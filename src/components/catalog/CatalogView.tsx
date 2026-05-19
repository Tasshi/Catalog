import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../../hooks/useFiles';
import { useApp } from '../../contexts/AppContext';
import { downloadFile } from '../../lib/storage';
import { FileRow, FileCard } from './FileCard';
import { type FileItem } from '../layout/ui/cons';
import FilterPanel from './FilterPanel';
import { LayoutGrid, List, FileX, Search } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'grid';
export type SortKey = 'newest' | 'oldest' | 'name' | 'size';
export type FileType = 'All' | 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'ZIP' | 'IMG';

// FileItem is imported from FileCard (re-exported from cons.ts) so this file
// and FileCard/FileRow always share the exact same structural type.
// A local redefinition caused TS2322 because HookFile was missing FileRecord
// fields (size_bytes, is_deleted, group_id, uploaded_by) that cons.ts requires.
type HookFile = ReturnType<typeof useFiles>['files'][number];

interface CatalogViewProps {
  groupId?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<Exclude<FileType, 'All'>, string[]> = {
  PDF:  ['pdf'],
  DOCX: ['docx', 'doc'],
  XLSX: ['xlsx', 'xls'],
  PPTX: ['pptx', 'ppt'],
  ZIP:  ['zip', 'rar'],
  IMG:  ['png', 'jpg', 'jpeg', 'gif', 'webp'],
};
const SORT_FNS: Record<SortKey, (a: FileItem, b: FileItem) => number> = {
  newest: (a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime(),
  oldest: (a, b) => new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime(),
  name:   (a, b) => a.name.localeCompare(b.name),
  // Convert strings to numbers for the arithmetic operation
  size:   (a, b) => Number(b.size_bytes ?? 0) - Number(a.size_bytes ?? 0),
};

const TABLE_HEADERS = ['File', 'Type', 'Group', 'Owner', 'Date', ''] as const;

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  // Page wrapper
  wrapper: 'flex flex-col gap-5',

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  toolbar: 'flex items-center gap-3 flex-wrap',

  // Search box
  searchWrap: [
    'flex items-center gap-2 h-9 flex-1 max-w-[280px]',
    'bg-white border border-slate-200 rounded-md px-3',
    'shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]',
    'transition-all duration-150',
    'focus-within:border-indigo-400',
    'focus-within:shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),0_0_0_3px_rgba(99,102,241,0.12)]',
  ].join(' '),
  searchIcon: 'text-slate-400 shrink-0',
  searchInput: [
    'flex-1 bg-transparent border-none outline-none',
    "text-[13px] text-slate-800 placeholder:text-slate-400",
    "font-['DM_Sans',ui-sans-serif,system-ui]",
  ].join(' '),

  // Spacer
  spacer: 'flex-1',

  // View-mode toggle pill
  toggleWrap: [
    'flex items-center gap-0.5 p-0.5',
    'bg-slate-100 border border-slate-200 rounded-md',
  ].join(' '),
  viewBtnBase: [
    'flex items-center justify-center w-7 h-7 rounded-[5px]',
    'transition-all duration-150',
  ].join(' '),
  viewBtnActive:   'bg-white text-indigo-600 shadow-[0_1px_3px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80',
  viewBtnInactive: 'text-slate-400 hover:text-slate-600',

  // File-count chip
  countChip: [
    'inline-flex items-center h-6 px-2 rounded-md',
    'bg-slate-50 border border-slate-200',
    'text-[11px] font-semibold tabular-nums tracking-wide text-slate-500',
  ].join(' '),

  // ── Table ────────────────────────────────────────────────────────────────────
  tableOuter: [
    'overflow-hidden rounded-lg',
    'border border-slate-200',
    'shadow-[0_1px_4px_rgba(15,23,42,0.06),0_0_0_0.5px_rgba(15,23,42,0.04)]',
    'bg-white',
  ].join(' '),
  table: 'w-full border-collapse',

  thead: 'bg-slate-50 border-b border-slate-200',
  th: [
    'text-left px-4 py-2.5',
    'text-[11px] font-semibold uppercase tracking-widest',
    'text-slate-400 select-none whitespace-nowrap',
  ].join(' '),
  tbody: 'divide-y divide-slate-100',

  // ── Grid ─────────────────────────────────────────────────────────────────────
  // NOTE: gridTemplateColumns uses a dynamic value not expressible as a static
  // Tailwind class, so it lives in a dedicated CSS class defined in index.css:
  //   .file-grid { grid-template-columns: repeat(auto-fill, minmax(192px, 1fr)); }
  grid: 'grid gap-3 file-grid',

  // ── Empty state ───────────────────────────────────────────────────────────────
  empty: [
    'flex flex-col items-center justify-center py-24 gap-3',
    'rounded-lg border border-dashed border-slate-200 bg-slate-50/60',
  ].join(' '),
  emptyIconWrap: [
    'flex items-center justify-center w-12 h-12 rounded-xl',
    'bg-white border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
    'text-slate-300',
  ].join(' '),
  emptyText: 'text-center',
  emptyHeading: 'text-sm font-medium text-slate-700',
  emptySubtext: 'text-xs text-slate-400',

  // ── Loading ───────────────────────────────────────────────────────────────────
  loading: 'flex items-center justify-center min-h-[260px]',
  loadingInner: 'flex flex-col items-center gap-3',
  loadingSpinner: [
    'w-6 h-6 rounded-full border-2',
    'border-slate-200 border-t-indigo-500',
    'animate-spin',
  ].join(' '),
  loadingLabel: 'text-xs text-slate-400 font-medium tracking-wide',
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function viewBtnClass(active: boolean) {
  return `${styles.viewBtnBase} ${active ? styles.viewBtnActive : styles.viewBtnInactive}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CatalogView({ groupId }: CatalogViewProps) {
  const { files, loading, deleteFile, logAction } = useFiles(groupId);
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [activeType, setActiveType] = useState<FileType>('All');
  const [sortBy, setSortBy]         = useState<SortKey>('newest');
  const [viewMode, setViewMode]     = useState<ViewMode>('table');

  // ── Filtering & sorting ─────────────────────────────────────────────────────

  const filtered = useMemo<FileItem[]>(() => {
    // Narrow HookFile to FileItem by asserting the required fields are present.
    // Cast through unknown first — HookFile (from useFiles) has no index signature
    // so a direct cast to Record<string,unknown> raises TS2352.
    const baseList = (files as HookFile[]).filter(
      (f): f is HookFile & FileItem => {
        const rec = f as unknown as Record<string, unknown>;
        return (
          typeof rec.storage_path === 'string' &&
          typeof rec.file_type    === 'string' &&
          typeof rec.size_bytes   !== 'undefined' &&
          typeof rec.is_deleted   !== 'undefined' &&
          typeof rec.group_id     !== 'undefined' &&
          typeof rec.uploaded_by  !== 'undefined'
        );
      },
    );

    const normalizedList: FileItem[] = baseList.map(f => ({
      ...f,
      groupName: f.groupName ?? undefined,
      groupIcon: f.groupIcon ?? undefined,
    }));

    let result = normalizedList;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    if (activeType !== 'All') {
      const allowed = TYPE_MAP[activeType];
      // Bug fix: rely solely on the well-typed file_type field; removed
      // speculative access to a non-existent `ext` property.
      result = result.filter(f => allowed.includes(f.file_type.toLowerCase()));
    }

    // Bug fix: sortBy is SortKey so the lookup never misses; removed the
    // misleading SORT_FNS[sortBy] ?? SORT_FNS.newest fallback that implied
    // sortBy could be out-of-range while the type said otherwise.
    return result.sort(SORT_FNS[sortBy]);
  }, [files, search, activeType, sortBy]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // const handleView = useCallback(
  //   (file: FileItem) => { logAction(file.id, 'view'); navigate(`/files/${file.id}`); },
  //   [logAction, navigate],
  // );
    const handleView = useCallback(
    (file: FileItem) => {
      logAction(file.id, 'view');
      navigate(`/catalog/${file.id}/subfolders`, {
        state: { fileId: file.id, groupId: file.group_id },
      });
    },
    [logAction, navigate],
  );

  const handleDownload = useCallback(async (file: FileItem) => {
    try {
      await downloadFile(file.storage_path, file.name);
      logAction(file.id, 'download');
      showToast(`Downloading ${file.name}`);
    } catch {
      showToast('Download failed', 'error');
    }
  }, [logAction, showToast]);

  const handleDelete = useCallback(async (file: FileItem) => {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    try {
      await deleteFile(file.id);
      showToast(`"${file.name}" deleted`);
    } catch {
      showToast('Delete failed', 'error');
    }
  }, [deleteFile, showToast]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingInner}>
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <span className={styles.loadingLabel}>Loading files…</span>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files…"
            className={styles.searchInput}
            aria-label="Search files"
          />
        </div>

        <div className={styles.spacer} />

        {/* Count chip */}
        <span className={styles.countChip} aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
        </span>

        {/* View toggle */}
        {/* Bug fix: added type="button" to prevent accidental form submission */}
        <div className={styles.toggleWrap} role="group" aria-label="View mode">
          {(['table', 'grid'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={viewBtnClass(viewMode === mode)}
              aria-pressed={viewMode === mode}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
            >
              {mode === 'table'
                ? <List size={13} aria-hidden="true" />
                : <LayoutGrid size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>

      </div>

      {/* ── Filter panel ── */}
      <FilterPanel
        activeType={activeType}
        onTypeChange={setActiveType}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* ── Content ── */}
      {filtered.length === 0 ? (

        <div className={styles.empty} role="status">
          <div className={styles.emptyIconWrap}>
            <FileX size={20} aria-hidden="true" />
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyHeading}>
              {search.trim() ? 'No matching files' : 'No files yet'}
            </p>
            <p className={styles.emptySubtext}>
              {search.trim() ? 'Try a different search term' : 'Upload something to get started'}
            </p>
          </div>
        </div>

      ) : viewMode === 'table' ? (

        <div className={styles.tableOuter}>
          <table className={styles.table} aria-label="File catalog">
            <thead className={styles.thead}>
              <tr>
                {/* Bug fix: use header text as key instead of numeric index */}
                {TABLE_HEADERS.map(h => (
                  <th key={h} className={styles.th} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {filtered.map(f => (
                <FileRow
                  key={f.id}
                  file={f}
                  onView={handleView}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        // NOTE: The responsive grid column rule lives in index.css as .file-grid
        // because Tailwind cannot generate `repeat(auto-fill, minmax(192px, 1fr))`
        // from a static class name. Add this to your global stylesheet:
        //   .file-grid { grid-template-columns: repeat(auto-fill, minmax(192px, 1fr)); }
        <div className={styles.grid} aria-label="File grid">
          {filtered.map(f => (
            <FileCard
              key={f.id}
              file={f}
              onView={handleView}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>

      )}
    </div>
  );
}
