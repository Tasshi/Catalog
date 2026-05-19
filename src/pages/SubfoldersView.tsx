import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useFolderTree } from '../hooks/useFolderTree';
import { formatBytes, downloadFile } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import {
  ArrowLeft,
  Download,
  Folder,
  FolderOpen,
  ChevronRight,
  FileX,
  MoreHorizontal,
  Home,
  Loader2,
} from 'lucide-react';
import type { FolderRecord } from '../types/folder';
import type { FileRecord } from '../components/layout/ui/cons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
  fileId:  string;
  groupId: string | null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  root:             'flex h-full min-h-screen bg-slate-50',
  sidebar:          'w-56 shrink-0 flex flex-col bg-white border-r border-slate-200',
  sidebarTop:       'flex items-center px-4 py-4 border-b border-slate-100',
  backBtn:          'flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors',
  sidebarLabel:     'px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400',
  folderList:       'flex flex-col gap-0.5 px-2 overflow-y-auto',

  folderItem:       [
    'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer select-none',
    'text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    'transition-colors duration-100',
  ].join(' '),
  folderItemActive: 'bg-indigo-50 text-indigo-700 font-medium',
  folderDot:        'w-2 h-2 rounded-full bg-amber-400 shrink-0',
  folderName:       'truncate flex-1',
  folderCount:      'text-[10px] text-slate-400 tabular-nums',

  // Children (nested)
  childList:        'ml-5 flex flex-col gap-0.5 border-l border-slate-100 pl-2 mt-0.5',

  main:             'flex-1 flex flex-col overflow-hidden',
  topbar:           'flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white',
  breadcrumb:       'flex items-center gap-1.5 text-sm text-slate-500',
  breadcrumbSep:    'text-slate-300',
  breadcrumbActive: 'text-slate-800 font-medium flex items-center gap-1.5',
  topActions:       'flex items-center gap-2',
  exportBtn:        [
    'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium',
    'border border-slate-200 bg-white text-slate-600',
    'hover:bg-slate-50 transition-colors',
  ].join(' '),

  content:          'flex-1 flex items-stretch gap-5 p-6 overflow-auto',

  detailsCard:      [
    'w-[380px] shrink-0 bg-white rounded-2xl flex flex-col self-stretch',
    'border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.06)]',
  ].join(' '),
  cardHeader:       'flex items-center justify-between px-6 py-5',
  cardTitle:        'text-[16px] font-semibold text-slate-900',
  moreBtn:          'text-slate-300 hover:text-slate-500 transition-colors',
  detailRows:       'flex flex-col',
  detailRow:        'flex items-center gap-6 px-6 py-[18px] border-t border-slate-100',
  detailLabel:      'w-32 shrink-0 text-[13.5px] text-slate-400 font-normal',
  detailValue:      'flex-1 text-[13.5px] text-slate-900 font-semibold',
  detailValueMuted: 'flex-1 text-[13.5px] text-slate-400',

  filesCard:        [
    'flex-1 bg-white rounded-2xl overflow-hidden flex flex-col',
    'border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.06)]',
  ].join(' '),
  filesHeader:      'flex items-center justify-between px-6 py-5',
  filesTitle:       'text-[16px] font-semibold text-slate-900',
  filesMeta:        'text-[12px] text-slate-400',
  filesTable:       'w-full border-collapse',
  filesThead:       'border-t border-slate-100',
  filesTh:          'text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400',
  filesTbody:       'divide-y divide-slate-100',
  filesTr:          'hover:bg-slate-50/80 transition-colors group',
  filesTd:          'px-6 py-4 text-[13.5px] text-slate-700',
  fileNameCell:     'flex items-center gap-3',
  fileThumb:        [
    'w-8 h-8 rounded-lg shrink-0 overflow-hidden',
    'bg-gradient-to-br from-slate-100 to-slate-200',
    'flex items-center justify-center text-base leading-none',
  ].join(' '),
  fileName:         'font-medium text-slate-800 truncate max-w-[260px] text-[13.5px]',
  fileSize:         'text-slate-400 tabular-nums text-right text-[13.5px]',
  downloadBtn:      [
    'opacity-0 group-hover:opacity-100 transition-opacity',
    'flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600',
  ].join(' '),

  emptyWrap:    'flex flex-col items-center justify-center py-20 gap-3',
  emptyIcon:    'flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-300',
  emptyText:    'text-sm font-medium text-slate-600',
  emptySubtext: 'text-xs text-slate-400',
  spinner:      'w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin',
  spinnerWrap:  'flex items-center justify-center py-20',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function badgeColor(ext: string) {
  const map: Record<string, string> = {
    pdf: 'bg-red-500',
    docx: 'bg-blue-500', doc: 'bg-blue-500',
    xlsx: 'bg-green-600', xls: 'bg-green-600',
    pptx: 'bg-orange-500', ppt: 'bg-orange-500',
    zip: 'bg-slate-500', rar: 'bg-slate-500',
    png: 'bg-pink-500', jpg: 'bg-pink-500',
    jpeg: 'bg-pink-500', gif: 'bg-pink-500', webp: 'bg-pink-500',
  };
  return map[ext?.toLowerCase()] ?? 'bg-slate-400';
}

// ─── Sidebar folder tree (recursive) ─────────────────────────────────────────

function FolderTree({
  nodes,
  activeId,
  onSelect,
  depth = 0,
}: {
  nodes: FolderRecord[];
  activeId: string | null;
  onSelect: (f: FolderRecord) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map(folder => {
        const isActive   = activeId === folder.id;
        const hasChildren = (folder.children?.length ?? 0) > 0;

        return (
          <div key={folder.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(folder)}
              onKeyDown={e => e.key === 'Enter' && onSelect(folder)}
              className={[s.folderItem, isActive ? s.folderItemActive : ''].join(' ')}
            >
              <span className={s.folderDot} />
              {isActive
                ? <FolderOpen size={14} className="text-indigo-500 shrink-0" />
                : <Folder     size={14} className="text-amber-500 shrink-0" />}
              <span className={s.folderName}>{folder.name}</span>
              {(folder.file_count ?? 0) > 0 && (
                <span className={s.folderCount}>{folder.file_count}</span>
              )}
            </div>

            {/* Nested children */}
            {hasChildren && (
              <div className={s.childList}>
                <FolderTree
                  nodes={folder.children!}
                  activeId={activeId}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubfoldersView() {
  useParams<{ fileId: string }>();                                            // ✅ kept for route param, value unused
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const { showToast } = useApp();
  const { user }      = useAuth();

  const { groupId } = (state as LocationState) ?? {};

  const { roots, loading: loadingFolders } = useFolderTree(groupId ?? '');

  const [activeFolder, setActiveFolder] = useState<FolderRecord | null>(null);
  const [files,        setFiles]        = useState<FileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

  // Clear selection when folder changes
  useEffect(() => { setSelectedIds(new Set()); }, [activeFolder]);

  const allSelected   = files.length > 0 && selectedIds.size === files.length;
  const someSelected  = selectedIds.size > 0 && !allSelected;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(files.map(f => f.id)));
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Auto-select first root folder when tree loads
  useEffect(() => {
    if (roots.length > 0 && !activeFolder) {
      setActiveFolder(roots[0]);
    }
  }, [roots, activeFolder]);

  // Fetch files whenever active folder changes
  useEffect(() => {
    if (!user || !activeFolder) { setFiles([]); return; }
    let cancelled = false;

    (async () => {
      setLoadingFiles(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('files')
          .select(`
            *,
            uploaded_by_profile:profiles!uploaded_by(full_name),
            group:groups(name, icon)
          `)
          .eq('is_deleted', false)
          .eq('folder_id', activeFolder.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!cancelled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFiles((data ?? []).map((f: any) => ({
            ...f,
            ext:           getFileExtension(f.name),
            sizeFormatted: formatBytes(f.size_bytes),
            authorName:    f.uploaded_by_profile?.full_name ?? 'Unknown',
            groupName:     f.group?.name ?? null,
            groupIcon:     f.group?.icon ?? null,
          })));
        }
      } catch (e) {
        console.error('[SubfoldersView] fetch files', e);
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, activeFolder]);

  async function handleDownload(file: FileRecord) {
    try {
      await downloadFile(file.storage_path, file.name);
      showToast(`Downloading ${file.name}`);
    } catch {
      showToast('Download failed', 'error');
    }
  }

  async function handleExport() {
    const toExport = files.filter(f => selectedIds.has(f.id));
    if (!toExport.length || exporting) return;
    setExporting(true);
    showToast(`Preparing ${toExport.length} file${toExport.length > 1 ? 's' : ''}…`);

    try {
      // Get the current user JWT to authenticate the Edge Function call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-zip`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            folderName: activeFolder?.name ?? 'export',
            files: toExport.map(f => ({
              storage_path: f.storage_path,
              name:         f.name,
            })),
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Server error ${response.status}`);
      }

      // Stream the ZIP blob and trigger download
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${activeFolder?.name ?? 'export'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${toExport.length} file${toExport.length > 1 ? 's' : ''} as ZIP`);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('[export]', e);
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  }

  const totalSize = files.reduce((acc, f) => acc + Number(f.size_bytes ?? 0), 0);

  return (
    <div className={s.root}>

      {/* ── Sidebar ── */}
      <aside className={s.sidebar}>
        <div className={s.sidebarTop}>
          <button type="button" onClick={() => navigate('/catalog')} className={s.backBtn}>
            <ArrowLeft size={13} /> Back to Catalog
          </button>
        </div>

        <span className={s.sidebarLabel}>All Cohorts</span>

        <div className={s.folderList}>
          {loadingFolders ? (
            <div className="flex justify-center py-6">
              <div className={s.spinner} />
            </div>
          ) : roots.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-400">No subprojects yet</p>
          ) : (
            <FolderTree
              nodes={roots}
              activeId={activeFolder?.id ?? null}
              onSelect={setActiveFolder}
            />
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={s.main}>

        {/* Topbar */}
        <div className={s.topbar}>
          <nav className={s.breadcrumb} aria-label="Breadcrumb">
            <Home size={13} className="text-slate-400" />
            <span className={s.breadcrumbSep}><ChevronRight size={12} /></span>
            <span>Root</span>
            {activeFolder?.parent_id && (
              <>
                <span className={s.breadcrumbSep}><ChevronRight size={12} /></span>
                <span className="text-slate-500">…</span>
              </>
            )}
            <span className={s.breadcrumbSep}><ChevronRight size={12} /></span>
            <span className={s.breadcrumbActive}>
              <Folder size={13} className="text-amber-500" />
              {activeFolder?.name ?? '—'}
            </span>
          </nav>

          <div className={s.topActions}>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedIds.size === 0}
              className={[
                s.exportBtn,
                exporting || selectedIds.size === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-slate-50',
              ].join(' ')}
            >
              {exporting
                ? <Loader2 size={13} className="animate-spin" />
                : <Download size={13} />}
              {exporting ? 'Exporting…' : 'Export'}
              {selectedIds.size > 0 && !exporting && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {selectedIds.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={s.content}>

          {/* Project details */}
          <div className={s.detailsCard}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Project details</span>
              <button type="button" className={s.moreBtn} aria-label="More options">
                <MoreHorizontal size={16} />
              </button>
            </div>

            {activeFolder ? (
              <div className={s.detailRows}>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Name</span>
                  <span className={s.detailValue}>{activeFolder.name}</span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Description</span>
                  {(activeFolder as any).description
                    ? <span className={s.detailValue}>{(activeFolder as any).description}</span>
                    : <span className={s.detailValueMuted}>—</span>}
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Cohort</span>
                  <span className={s.detailValue}>{activeFolder.name}</span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Tags</span>
                  <span className={s.detailValueMuted}>—</span>
                </div>

                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Files</span>
                  <span className={s.detailValue}>{activeFolder.file_count ?? 0}</span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Created</span>
                  <span className={s.detailValue}>
                    {activeFolder.created_at ? formatDate(activeFolder.created_at) : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className={s.emptyWrap}>
                <span className={s.emptySubtext}>Select a folder to see details</span>
              </div>
            )}
          </div>

          {/* Files */}
          <div className={s.filesCard}>
            <div className={s.filesHeader}>
              <span className={s.filesTitle}>Files</span>
              <span className={s.filesMeta}>
                {files.length} {files.length === 1 ? 'file' : 'files'}
                {files.length > 0 && ` · ${formatBytes(totalSize)}`}
              </span>
            </div>

            {loadingFiles ? (
              <div className={s.spinnerWrap}><div className={s.spinner} /></div>
            ) : files.length === 0 ? (
              <div className={s.emptyWrap}>
                <div className={s.emptyIcon}><FileX size={16} /></div>
                <p className={s.emptyText}>No files in this folder</p>
                <p className={s.emptySubtext}>Upload something to get started</p>
              </div>
            ) : (
              <table className={s.filesTable}>
                <thead className={s.filesThead}>
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="px-6 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                        aria-label="Select all files"
                      />
                    </th>
                    <th className={s.filesTh}>Name</th>
                    <th className={s.filesTh}>Size</th>
                    <th className={s.filesTh}>Type</th>
                    <th className={s.filesTh} />
                  </tr>
                </thead>
                <tbody className={s.filesTbody}>
                  {files.map(f => {
                    const isSelected = selectedIds.has(f.id);
                    return (
                    <tr
                      key={f.id}
                      className={[
                        s.filesTr,
                        isSelected ? 'bg-indigo-50/60' : '',
                      ].join(' ')}
                    >
                      {/* Row checkbox */}
                      <td className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(f.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                          aria-label={`Select ${f.name}`}
                        />
                      </td>

                      {/* NAME — thumbnail + filename */}
                      <td className={s.filesTd}>
                        <div className={s.fileNameCell}>
                          <div className={s.fileThumb}>
                            {['png','jpg','jpeg','gif','webp'].includes(f.ext?.toLowerCase())
                              ? '🖼️'
                              : f.ext?.toLowerCase() === 'pdf' ? '📄'
                              : f.ext?.toLowerCase() === 'docx' || f.ext?.toLowerCase() === 'doc' ? '📝'
                              : f.ext?.toLowerCase() === 'xlsx' || f.ext?.toLowerCase() === 'xls' ? '📊'
                              : f.ext?.toLowerCase() === 'zip' ? '🗜️'
                              : '📁'}
                          </div>
                          <span className={s.fileName}>{f.name}</span>
                        </div>
                      </td>

                      {/* SIZE */}
                      <td className={[s.filesTd, s.fileSize].join(' ')}>
                        {f.sizeFormatted}
                      </td>

                      {/* TYPE badge */}
                      <td className={s.filesTd}>
                        <span className={[
                          'inline-flex items-center px-2 py-0.5 rounded-md',
                          'text-[11px] font-bold uppercase tracking-wide text-white',
                          badgeColor(f.ext),
                        ].join(' ')}>
                          {f.ext?.toUpperCase()}
                        </span>
                      </td>

                      {/* Download on hover */}
                      <td className={s.filesTd}>
                        <button
                          type="button"
                          onClick={() => handleDownload(f)}
                          className={s.downloadBtn}
                          title="Download"
                        >
                          <Download size={13} /> Download
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}