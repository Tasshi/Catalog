import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../../hooks/useFiles';
import { useApp } from '../../contexts/AppContext';
import { downloadFile } from '../../lib/storage';
import { FileRow, FileCard } from './FileCard';
import { type FileItem } from '../layout/ui/cons';
import FilterPanel from './FilterPanel';
import { LayoutGrid, List, FileX, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'grid';
export type SortKey = 'newest' | 'oldest' | 'name' | 'size';
export type FileType = 'All' | 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'ZIP' | 'IMG';

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
  size:   (a, b) => Number(b.size_bytes ?? 0) - Number(a.size_bytes ?? 0),
};

const TABLE_HEADERS = ['File', 'Type', 'Group', 'Owner', 'Date', ''] as const;

const PAGE_SIZES = [10, 20, 50, 100] as const;

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: 'flex flex-col gap-5',

  // ── Toolbar ──
  toolbar: 'flex items-center gap-3 flex-wrap',
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
    'text-[13px] text-slate-800 placeholder:text-slate-400',
    "font-['DM_Sans',ui-sans-serif,system-ui]",
  ].join(' '),
  spacer: 'flex-1',
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
  countChip: [
    'inline-flex items-center h-6 px-2 rounded-md',
    'bg-slate-50 border border-slate-200',
    'text-[11px] font-semibold tabular-nums tracking-wide text-slate-500',
  ].join(' '),

  // ── Table ──
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

  // ── Grid ──
  grid: 'grid gap-3 file-grid',

  // ── Empty state ──
  empty: [
    'flex flex-col items-center justify-center py-24 gap-3',
    'rounded-lg border border-dashed border-slate-200 bg-slate-50/60',
  ].join(' '),
  emptyIconWrap: [
    'flex items-center justify-center w-12 h-12 rounded-xl',
    'bg-white border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
    'text-slate-300',
  ].join(' '),
  emptyText:    'text-center',
  emptyHeading: 'text-sm font-medium text-slate-700',
  emptySubtext: 'text-xs text-slate-400',

  // ── Loading ──
  loading:        'flex items-center justify-center min-h-[260px]',
  loadingInner:   'flex flex-col items-center gap-3',
  loadingSpinner: [
    'w-6 h-6 rounded-full border-2',
    'border-slate-200 border-t-indigo-500',
    'animate-spin',
  ].join(' '),
  loadingLabel: 'text-xs text-slate-400 font-medium tracking-wide',

  // ── Pagination ──
  paginationWrap: [
    'flex items-center justify-between flex-wrap gap-3 pt-1',
  ].join(' '),
  paginationSizeWrap: 'flex items-center gap-2',
  paginationSizeLabel: 'text-[13px] text-slate-500 whitespace-nowrap',
  paginationSizeSelect: [
    'h-8 px-2 pr-7 text-[13px]',
    'border border-slate-200 rounded-md',
    'bg-white text-slate-700',
    'cursor-pointer outline-none',
    'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
    'transition-colors duration-150',
  ].join(' '),
  paginationInfo: 'text-[13px] text-slate-500 tabular-nums',
  paginationControls: 'flex items-center gap-1',
  paginationEllipsis: 'px-1 text-[13px] text-slate-400 select-none',
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function viewBtnClass(active: boolean) {
  return `${styles.viewBtnBase} ${active ? styles.viewBtnActive : styles.viewBtnInactive}`;
}

function pageBtnClass(active: boolean, disabled: boolean) {
  const base = [
    'flex items-center justify-center min-w-[32px] h-8 px-1.5 rounded-md',
    'text-[13px] border transition-all duration-100 cursor-pointer',
  ].join(' ');
  if (disabled) return `${base} border-slate-200 bg-white text-slate-300 cursor-not-allowed`;
  if (active)   return `${base} border-indigo-300 bg-indigo-50 text-indigo-600 font-medium`;
  return `${base} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300`;
}

function buildPageNumbers(current: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  const lo = Math.max(2, current - 1);
  const hi = Math.min(last - 1, current + 1);
  for (let i = lo; i <= hi; i++) pages.push(i);
  if (current < last - 2) pages.push('…');
  pages.push(last);
  return pages;
}

// ─── Pagination sub-component ───────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start      = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end        = Math.min(page * pageSize, total);
  const pageNums   = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(Number(e.target.value));
    onPageChange(1);
  };

  return (
    <div className={styles.paginationWrap} aria-label="Pagination">

      {/* Rows per page */}
      <div className={styles.paginationSizeWrap}>
        <label htmlFor="pg-size" className={styles.paginationSizeLabel}>
          Rows per page
        </label>
        <select
          id="pg-size"
          value={pageSize}
          onChange={handleSizeChange}
          className={styles.paginationSizeSelect}
        >
          {PAGE_SIZES.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Range label */}
      <span className={styles.paginationInfo} aria-live="polite">
        {total === 0 ? 'No files' : `${start}–${end} of ${total}`}
      </span>

      {/* Page buttons */}
      <div className={styles.paginationControls} role="navigation" aria-label="Page navigation">

        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={pageBtnClass(false, page === 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>

        {/* Page numbers */}
        {pageNums.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.paginationEllipsis} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={pageBtnClass(p === page, false)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={pageBtnClass(false, page === totalPages)}
          aria-label="Next page"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>

      </div>
    </div>
  );
}

// ─── CatalogView ────────────────────────────────────────────────────────────────

export default function CatalogView({ groupId }: CatalogViewProps) {
  const { files, loading, deleteFile, logAction } = useFiles(groupId);
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [activeType, setActiveType] = useState<FileType>('All');
  const [sortBy, setSortBy]         = useState<SortKey>('newest');
  const [viewMode, setViewMode]     = useState<ViewMode>('table');

  // ── Pagination state ─────────────────────────────────────────────────────────
  const filterKey = `${search}|${activeType}|${sortBy}`;
  const [pagination, setPagination] = useState({ filterKey, page: 1, pageSize: 20 });

  const page     = pagination.filterKey === filterKey ? pagination.page : 1;
  const pageSize = pagination.pageSize;

  const setPage = (p: number) =>
    setPagination(prev => ({ ...prev, filterKey, page: p }));

  const setPageSize = (s: number) =>
    setPagination({ filterKey, page: 1, pageSize: s });

  // ── Filtering & sorting ──────────────────────────────────────────────────────

  const filtered = useMemo<FileItem[]>(() => {
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
      result = result.filter(f => allowed.includes((f.file_type ?? '').toLowerCase()));
    }

    return result.sort(SORT_FNS[sortBy]);
  }, [files, search, activeType, sortBy]);

  // ── Paginated slice ──────────────────────────────────────────────────────────

  const paginated = useMemo<FileItem[]>(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // ✅ CHANGED: navigate to ProjectDetail (/groups/:groupId) with openFolderId
  // instead of SubfoldersView (/catalog/:fileId/subfolders)
  const handleView = useCallback(
    (file: FileItem) => {
      logAction(file.id, 'view');
      navigate(`/groups/${file.group_id}`, {
        state: { openFolderId: file.folder_id },
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

  // ── Loading ──────────────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>

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

        <span className={styles.countChip} aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
        </span>

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

        <>
          <div className={styles.tableOuter}>
            <table className={styles.table} aria-label="File catalog">
              <thead className={styles.thead}>
                <tr>
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className={styles.th} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {paginated.map(f => (
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

          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>

      ) : (

        <>
          <div className={styles.grid} aria-label="File grid">
            {paginated.map(f => (
              <FileCard
                key={f.id}
                file={f}
                onView={handleView}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>

      )}
    </div>
  );
}