import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useFolderTree } from '../hooks/useFolderTree';
import { useGroups } from '../hooks/useGroups';
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
  X,
  AlertTriangle,
  UploadCloud,
  UserCog,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { FolderRecord } from '../types/folder';
import type { FileRecord } from '../components/layout/ui/cons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
  fileId:  string;
  groupId: string | null;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { tab: '#3b82f6', body: '#60a5fa' },
  { tab: '#f59e0b', body: '#fbbf24' },
  { tab: '#10b981', body: '#34d399' },
  { tab: '#8b5cf6', body: '#a78bfa' },
  { tab: '#ef4444', body: '#f87171' },
  { tab: '#06b6d4', body: '#22d3ee' },
  { tab: '#ec4899', body: '#f472b6' },
  { tab: '#6366f1', body: '#818cf8' },
];

function getPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  root:             'flex h-full min-h-screen bg-slate-50',
  sidebar:          'w-60 shrink-0 flex flex-col bg-white border-r border-slate-200',
  sidebarTop:       'flex items-center px-4 py-4 border-b border-slate-100',
  backBtn:          'flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors border-0 bg-transparent cursor-pointer p-0',
  sidebarLabel:     'px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400',
  folderList:       'flex flex-col gap-0.5 px-2 pb-4 overflow-y-auto flex-1',
  folderItem:       [
    'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer select-none',
    'text-[13px] text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    'transition-colors duration-100 border-0 bg-transparent w-full text-left',
  ].join(' '),
  folderItemActive: 'bg-indigo-50 !text-indigo-700 font-medium',
  folderName:       'truncate flex-1',
  folderCount:      'text-[10px] text-slate-400 tabular-nums shrink-0',
  childList:        'ml-4 flex flex-col gap-0.5 border-l border-slate-100 pl-2 mt-0.5',
  main:             'flex-1 flex flex-col overflow-hidden',
  topbar:           'flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white',
  breadcrumb:       'flex items-center gap-1.5 text-sm text-slate-500 flex-wrap',
  breadcrumbSep:    'text-slate-300',
  breadcrumbActive: 'text-slate-800 font-semibold flex items-center gap-1.5',
  topActions:       'flex items-center gap-2',
  exportBtn:        [
    'flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium',
    'border border-slate-200 bg-white text-slate-600',
    'hover:bg-slate-50 transition-colors cursor-pointer',
  ].join(' '),
  content:          'flex-1 flex items-start gap-5 p-6 overflow-auto',

  // cards
  detailsCard:      'w-[340px] shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col self-start',
  filesCard:        'flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0',
  cardHeader:       'flex items-center justify-between px-5 py-4 border-b border-slate-100',
  cardTitle:        'text-[13px] font-semibold text-slate-700',
  cardMeta:         'text-[11px] text-slate-400',
  detailRow:        'flex items-start gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0',
  detailLabel:      'w-28 shrink-0 text-[12px] text-slate-400 pt-px',
  detailValue:      'flex-1 text-[13px] text-slate-800 font-medium',
  detailValueMuted: 'flex-1 text-[13px] text-slate-300',

  // files table
  filesTable:  'w-full border-collapse',
  filesThead:  'border-b border-slate-100 bg-slate-50/70',
  filesTh:     'text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400',
  filesTbody:  'divide-y divide-slate-50',
  filesTr:     'hover:bg-slate-50/60 transition-colors group cursor-pointer',
  filesTd:     'px-5 py-3.5 text-[13px] text-slate-700',
  fileNameCell:'flex items-center gap-3',
  fileThumb:   'w-8 h-8 rounded-lg shrink-0 bg-slate-50 flex items-center justify-center text-base',
  fileName:    'font-medium text-slate-800 truncate',
  downloadBtn: 'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 cursor-pointer border-0 bg-transparent p-0',

  // empty / loading
  emptyWrap:   'flex flex-col items-center justify-center py-16 gap-3',
  emptyIcon:   'w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300',
  emptyText:   'text-[13px] font-medium text-slate-600',
  emptySubtext:'text-[12px] text-slate-400 text-center max-w-[220px]',
  spinner:     'w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin',
  spinnerWrap: 'flex items-center justify-center py-20',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fileEmoji(ext: string) {
  const e = ext?.toLowerCase();
  if (['png','jpg','jpeg','gif','webp'].includes(e)) return '🖼️';
  if (e === 'pdf')  return '📄';
  if (['docx','doc'].includes(e)) return '📝';
  if (['xlsx','xls'].includes(e)) return '📊';
  if (['pptx','ppt'].includes(e)) return '📊';
  if (e === 'zip' || e === 'rar') return '🗜️';
  return '📁';
}

function badgeCls(ext: string) {
  const m: Record<string, string> = {
    pdf: 'bg-red-500', docx: 'bg-blue-500', doc: 'bg-blue-500',
    xlsx: 'bg-green-600', xls: 'bg-green-600', pptx: 'bg-orange-500',
    ppt: 'bg-orange-500', zip: 'bg-slate-500', rar: 'bg-slate-500',
    png: 'bg-pink-500', jpg: 'bg-pink-500', jpeg: 'bg-pink-500',
  };
  return m[ext?.toLowerCase()] ?? 'bg-slate-400';
}

/**
 * Walk the tree and build the ancestor path to `targetId`.
 * Returns array of FolderRecord from root → target, or null if not found.
 */
function findPath(nodes: FolderRecord[], targetId: string): FolderRecord[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return [node];
    if (node.children?.length) {
      const sub = findPath(node.children, targetId);
      if (sub) return [node, ...sub];
    }
  }
  return null;
}

// ─── FolderTile ───────────────────────────────────────────────────────────────

function FolderTile({ node, canEdit, onOpen, onRename, onDelete }: {
  node: FolderRecord; canEdit: boolean;
  onOpen: () => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [hov,       setHov]       = useState(false);
  const [renaming,  setRenaming]  = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const { tab, body } = getPalette(node.id);

  async function commitRename() {
    const v = renameVal.trim();
    if (v && v !== node.name) await onRename(node.id, v);
    else setRenameVal(node.name);
    setRenaming(false);
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 110, cursor: 'pointer', position: 'relative', userSelect: 'none' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {hov && !renaming && canEdit && (
        <div style={{ position: 'absolute', top: -8, right: -8, zIndex: 10, display: 'flex', gap: 3 }}>
          <button title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true); }}
            style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: '#fef3c7', color: '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Pencil size={11} />
          </button>
          <button title="Delete" onClick={e => { e.stopPropagation(); void onDelete(node.id); }}
            style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}

      <div onClick={onOpen}
        style={{ position: 'relative', width: 90, height: 72, transition: 'transform 0.12s', transform: hov ? 'translateY(-4px)' : 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 38, height: 13, borderRadius: '4px 4px 0 0', background: tab }} />
        <div style={{ position: 'absolute', top: 10, left: 0, width: 90, height: 62, borderRadius: '2px 8px 8px 8px', background: body, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hov ? `0 8px 24px ${body}66` : `0 2px 8px ${body}44`, transition: 'box-shadow 0.15s' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontSize: 24, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}>{node.icon ?? '📁'}</span>
          {(node.file_count ?? 0) > 0 && (
            <div style={{ position: 'absolute', bottom: 5, right: 6, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.95)', background: 'rgba(0,0,0,0.28)', borderRadius: 10, padding: '1px 6px' }}>
              {node.file_count}
            </div>
          )}
          {(node.children?.length ?? 0) > 0 && (
            <div style={{ position: 'absolute', bottom: 5, left: 6, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.95)', background: 'rgba(0,0,0,0.28)', borderRadius: 10, padding: '1px 6px' }}>
              📁 {node.children!.length}
            </div>
          )}
        </div>
      </div>

      {renaming ? (
        <input autoFocus value={renameVal}
          onChange={e => setRenameVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
          onBlur={() => void commitRename()} onClick={e => e.stopPropagation()}
          style={{ width: 100, fontSize: 11, textAlign: 'center', padding: '3px 6px', borderRadius: 5, border: '1.5px solid #6366f1', outline: 'none', background: '#fff', color: '#1e293b' }}
        />
      ) : (
        <div onClick={onOpen} style={{ textAlign: 'center', width: 110 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
            {node.name}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar tree ─────────────────────────────────────────────────────────────

function SidebarTree({ nodes, activeId, stackIds, onSelect }: {
  nodes: FolderRecord[];
  activeId: string | null;
  stackIds: Set<string>;
  onSelect: (path: FolderRecord[]) => void;
}) {
  return (
    <>
      {nodes.map(folder => {
        const isActive   = activeId === folder.id;
        const isExpanded = stackIds.has(folder.id);
        const hasChildren = (folder.children?.length ?? 0) > 0;

        return (
          <div key={folder.id}>
            <button
              type="button"
              onClick={() => {
                // Build path up to this node by walking from roots
                // We pass the full node so parent can compute path
                onSelect([folder]);
              }}
              className={[s.folderItem, isActive ? s.folderItemActive : ''].join(' ')}
            >
              {isActive
                ? <FolderOpen size={13} className="text-indigo-500 shrink-0" />
                : <Folder size={13} className="text-amber-400 shrink-0" />}
              <span className={s.folderName}>{folder.icon ? `${folder.icon} ` : ''}{folder.name}</span>
              {(folder.file_count ?? 0) > 0 && (
                <span className={s.folderCount}>{folder.file_count}</span>
              )}
            </button>

            {hasChildren && (isExpanded || isActive) && (
              <div className={s.childList}>
                <SidebarTree
                  nodes={folder.children!}
                  activeId={activeId}
                  stackIds={stackIds}
                  onSelect={path => onSelect([folder, ...path])}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SubfoldersView() {
  const { fileId }    = useParams<{ fileId: string }>();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const { showToast } = useApp();
  const { profile }   = useAuth();
  const { groups }    = useGroups();

  // ── Step 1: resolve the file → get group_id + folder_id ─────────────────
  const { data: fileRecord, isLoading: loadingFile } = useQuery({
    queryKey: ['file-meta', fileId],
    queryFn: async () => {
      const { data, error } = await db
        .from('files')
        .select('id, name, group_id, folder_id, size_bytes, created_at, storage_path, file_type')
        .eq('id', fileId)
        .single();
      if (error) throw new Error(error.message);
      return data as {
        id: string; name: string; group_id: string | null;
        folder_id: string | null; size_bytes: number;
        created_at: string; storage_path: string; file_type: string;
      };
    },
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000,
  });

  // Prefer state.groupId (fast), fallback to file record
  const resolvedGroupId: string | null =
    (state as LocationState | null)?.groupId ?? fileRecord?.group_id ?? null;

  const resolvedFolderId: string | null = fileRecord?.folder_id ?? null;

  // ── Step 2: load the full subproject tree for this group ─────────────────
  const {
    roots,
    loading: loadingFolders,
    refetch: refetchFolders,
    renameFolder,
    deleteFolder,
  } = useFolderTree(resolvedGroupId ?? '');

  // ── Step 3: folder navigation stack ──────────────────────────────────────
  const [folderStack, setFolderStack] = useState<FolderRecord[]>([]);
  const [autoNavigated, setAutoNavigated] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [showCohortDialog, setShowCohortDialog] = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [exporting, setExporting]       = useState(false);
  const [projPage,  setProjPage]        = useState(1);
  const PROJ_PAGE_SIZE  = 6;

  // ── Step 4: auto-navigate to the file's folder once tree is ready ────────
  useEffect(() => {
    if (autoNavigated) return;
    if (loadingFolders || roots.length === 0) return;
    if (!resolvedFolderId) return;

    const path = findPath(roots, resolvedFolderId);
    if (path && path.length > 0) {
      setFolderStack(path);
      setAutoNavigated(true);
    }
  }, [roots, loadingFolders, resolvedFolderId, autoNavigated]);

  // Reset selection when folder changes
  useEffect(() => { setSelectedIds(new Set()); }, [folderStack.length]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activeFolder    = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
  const isLeafFolder    = activeFolder !== null && (activeFolder.children?.length ?? 0) === 0;
  const currentChildren = activeFolder ? (activeFolder.children ?? []) : roots;
  const currentGroup    = groups.find(g => g.id === resolvedGroupId);
  const canEdit         = !!(profile?.cohort && currentGroup?.name && profile.cohort === currentGroup.name);
  const cohortMismatch  = !dismissedWarning && !!(profile?.cohort && currentGroup?.name && profile.cohort !== currentGroup.name);
  const stackIds        = new Set(folderStack.map(f => f.id));

  // ── Files query (leaf folders only) ───────────────────────────────────────
  const { data: files = [], isLoading: loadingFiles } = useQuery<FileRecord[]>({
    queryKey: ['folder-files', activeFolder?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('files')
        .select('*, uploaded_by_profile:profiles!uploaded_by(full_name), group:groups(name, icon)')
        .eq('is_deleted', false)
        .eq('folder_id', activeFolder!.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((f: any) => ({
        ...f,
        ext:           getFileExtension(f.name),
        sizeFormatted: formatBytes(f.size_bytes),
        authorName:    f.uploaded_by_profile?.full_name ?? 'Unknown',
        groupName:     f.group?.name ?? null,
        groupIcon:     f.group?.icon ?? null,
      })) as FileRecord[];
    },
    enabled: !!activeFolder && isLeafFolder,
    staleTime: 3 * 60 * 1000,
  });

  const totalSize    = files.reduce((a, f) => a + Number(f.size_bytes ?? 0), 0);
  const allSelected  = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // ── Navigation helpers ────────────────────────────────────────────────────
  function openFolder(f: FolderRecord)  { setFolderStack(s => [...s, f]); }
  function jumpTo(index: number)        { setFolderStack(s => index === -1 ? [] : s.slice(0, index + 1)); }
  function toggleAll()                  { setSelectedIds(allSelected ? new Set() : new Set(files.map(f => f.id))); }
  function toggleOne(id: string)        { setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  // Sidebar click: we receive a partial path (from root of subtree), need to resolve full path
  function handleSidebarSelect(partialPath: FolderRecord[]) {
    // Walk from roots to find the full ancestor path
    const last = partialPath[partialPath.length - 1];
    const fullPath = findPath(roots, last.id);
    if (fullPath) setFolderStack(fullPath);
  }

  async function handleRename(id: string, name: string) {
    await renameFolder(id, name);
    await refetchFolders();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this folder? This cannot be undone.')) return;
    await deleteFolder(id);
    setFolderStack(s => s.filter(f => f.id !== id));
    await refetchFolders();
  }

  async function handleDownload(file: FileRecord) {
    try { await downloadFile(file.storage_path, file.name); showToast(`Downloading ${file.name}`); }
    catch { showToast('Download failed', 'error'); }
  }

  async function handleExport() {
    const toExport = files.filter(f => selectedIds.has(f.id));
    if (!toExport.length || exporting) return;
    setExporting(true);
    showToast(`Preparing ${toExport.length} file${toExport.length > 1 ? 's' : ''}…`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-zip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            folderName: activeFolder?.name ?? 'export',
            files: toExport.map(f => ({ storage_path: f.storage_path, name: f.name })),
          }),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Server error ${response.status}`);
      }
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${activeFolder?.name ?? 'export'}.zip`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
      showToast(`Downloaded ${toExport.length} file${toExport.length > 1 ? 's' : ''} as ZIP`);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('[export]', e);
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  }

  // ── Loading states ────────────────────────────────────────────────────────
  const isBooting = loadingFile || (loadingFolders && roots.length === 0);

  // ── Project pagination ────────────────────────────────────────────────────
  const projTotalPages = Math.max(1, Math.ceil(roots.length / PROJ_PAGE_SIZE));
  const safeProjPage   = Math.min(projPage, projTotalPages);
  const pagedRoots     = roots.slice((safeProjPage - 1) * PROJ_PAGE_SIZE, safeProjPage * PROJ_PAGE_SIZE);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Cohort mismatch banner */}
      {cohortMismatch && (
        <div className="flex items-start gap-3 px-5 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <span className="flex-1 leading-relaxed">
            <strong>View &amp; download only</strong> — your cohort (<strong>{profile?.cohort}</strong>) doesn't match this group (<strong>{currentGroup?.name}</strong>).{' '}
            <button type="button" onClick={() => navigate('/settings')} className="underline font-medium hover:text-amber-900 bg-transparent border-0 cursor-pointer p-0 text-sm">
              Update in Settings › Profile
            </button>
          </span>
          <button type="button" onClick={() => setDismissedWarning(true)} className="text-amber-400 hover:text-amber-600 bg-transparent border-0 cursor-pointer p-0 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className={s.root}>

        {/* ── Sidebar ── */}
        <aside className={s.sidebar}>
          <div className={s.sidebarTop}>
            <button type="button" onClick={() => navigate('/catalog')} className={s.backBtn}>
              <ArrowLeft size={13} /> Back to Catalog
            </button>
          </div>

          <span className={s.sidebarLabel}>
            {currentGroup ? `${currentGroup.icon ?? '📁'} ${currentGroup.name}` : 'All Projects'}
          </span>

          <div className={s.folderList}>
            {loadingFolders ? (
              <div className="flex justify-center py-6"><div className={s.spinner} /></div>
            ) : roots.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400">No folders yet</p>
            ) : (
              <SidebarTree
                nodes={roots}
                activeId={activeFolder?.id ?? null}
                stackIds={stackIds}
                onSelect={handleSidebarSelect}
              />
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className={s.main}>

          {/* Topbar */}
          <div className={s.topbar}>
            {/* Breadcrumb */}
            <nav className={s.breadcrumb} aria-label="Folder path">
              <Home size={13} className="text-slate-400 shrink-0" />
              <span className={s.breadcrumbSep}><ChevronRight size={12} /></span>
              <button type="button" onClick={() => jumpTo(-1)}
                className="hover:text-slate-800 bg-transparent border-0 cursor-pointer text-sm text-slate-500 p-0">
                {currentGroup ? currentGroup.name : 'Root'}
              </button>
              {folderStack.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1.5">
                  <span className={s.breadcrumbSep}><ChevronRight size={12} /></span>
                  {i === folderStack.length - 1 ? (
                    <>
                      <button type="button" onClick={() => jumpTo(i - 1)}
                        className="flex items-center text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer p-0"
                        title="Go back">
                        <ArrowLeft size={13} />
                      </button>
                      <span className={s.breadcrumbActive}>
                        <Folder size={13} className="text-amber-500 shrink-0" />
                        {f.name}
                      </span>
                    </>
                  ) : (
                    <button type="button" onClick={() => jumpTo(i)}
                      className="hover:text-slate-800 bg-transparent border-0 cursor-pointer text-sm text-slate-500 p-0">
                      {f.name}
                    </button>
                  )}
                </span>
              ))}
            </nav>

            {/* Actions */}
            <div className={s.topActions}>
              {canEdit && isLeafFolder && (
                <button type="button"
                  onClick={() => navigate('/upload', { state: { folderId: activeFolder!.id, groupId: resolvedGroupId } })}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer border-0">
                  <UploadCloud size={13} /> Upload File
                </button>
              )}
              {isLeafFolder && (
                <button type="button" onClick={handleExport}
                  disabled={exporting || selectedIds.size === 0}
                  className={[s.exportBtn, exporting || selectedIds.size === 0 ? 'opacity-40 cursor-not-allowed' : ''].join(' ')}>
                  {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  {exporting ? 'Exporting…' : 'Export'}
                  {selectedIds.size > 0 && !exporting && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      {selectedIds.size}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {isBooting ? (
            <div className={s.spinnerWrap}><div className={s.spinner} /></div>

          ) : !activeFolder ? (
            /* ══ ROOT: all top-level project folders ══ */
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">All Projects</p>
                <span className="text-[11px] text-slate-400">{roots.length} project{roots.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                {roots.length === 0 ? (
                  <div className={s.emptyWrap}>
                    <div className={s.emptyIcon}><FileX size={16} /></div>
                    <p className={s.emptyText}>No projects yet</p>
                    <p className={s.emptySubtext}>Projects will appear here once they're created</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
                      {pagedRoots.map(folder => (
                        <FolderTile key={folder.id} node={folder} canEdit={canEdit}
                          onOpen={() => openFolder(folder)}
                          onRename={handleRename}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>

                    {projTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <span className="text-[12px] text-slate-400">
                          {(safeProjPage - 1) * PROJ_PAGE_SIZE + 1}–{Math.min(safeProjPage * PROJ_PAGE_SIZE, roots.length)} of {roots.length} projects
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setProjPage(p => Math.max(1, p - 1))}
                            disabled={safeProjPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-[#054159] hover:text-white hover:border-[#054159] disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white text-sm cursor-pointer"
                          >‹</button>
                          {Array.from({ length: projTotalPages }, (_, i) => i + 1).map(n => (
                            <button
                              key={n}
                              onClick={() => setProjPage(n)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                n === safeProjPage
                                  ? 'bg-[#054159] text-white border-[#054159]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-[#054159] hover:text-white hover:border-[#054159]'
                              }`}
                            >{n}</button>
                          ))}
                          <button
                            onClick={() => setProjPage(p => Math.min(projTotalPages, p + 1))}
                            disabled={safeProjPage === projTotalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-[#054159] hover:text-white hover:border-[#054159] disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white text-sm cursor-pointer"
                          >›</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          ) : !isLeafFolder ? (
            /* ══ BRANCH FOLDER: show sub-folder tiles ══ */
            <div className="p-6 flex flex-col gap-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Sub-folders</p>
                  <span className="text-[11px] text-slate-400">{currentChildren.length} folder{currentChildren.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  {currentChildren.length === 0 ? (
                    <div className={s.emptyWrap} style={{ paddingTop: 24, paddingBottom: 24 }}>
                      <p className={s.emptySubtext}>No sub-folders — navigate deeper or go back</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
                      {currentChildren.map(child => (
                        <FolderTile key={child.id} node={child} canEdit={canEdit}
                          onOpen={() => openFolder(child)}
                          onRename={handleRename}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Folder details summary */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Folder details</span>
                </div>
                <div>
                  <div className={s.detailRow}>
                    <span className={s.detailLabel}>Name</span>
                    <span className={s.detailValue}>{activeFolder.name}</span>
                  </div>
                  <div className={s.detailRow}>
                    <span className={s.detailLabel}>Cohort</span>
                    <span className={s.detailValue}>{currentGroup?.name ?? '—'}</span>
                  </div>
                  <div className={s.detailRow}>
                    <span className={s.detailLabel}>Sub-folders</span>
                    <span className={s.detailValue}>{currentChildren.length}</span>
                  </div>
                  {activeFolder.created_at && (
                    <div className={s.detailRow}>
                      <span className={s.detailLabel}>Created</span>
                      <span className={s.detailValue}>{formatDate(activeFolder.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : (
            /* ══ LEAF FOLDER: project details + files ══ */
            <div className={s.content}>

              {/* Left: project details */}
              <div className={s.detailsCard}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Project details</span>
                  <button type="button" className="text-slate-300 hover:text-slate-500 border-0 bg-transparent cursor-pointer p-0">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
                <div>
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
                    <span className={s.detailValue}>{currentGroup?.name ?? '—'}</span>
                  </div>
                  <div className={s.detailRow}>
                    <span className={s.detailLabel}>Files</span>
                    <span className={s.detailValue}>{loadingFiles ? '…' : files.length}</span>
                  </div>
                  {activeFolder.created_at && (
                    <div className={s.detailRow}>
                      <span className={s.detailLabel}>Created</span>
                      <span className={s.detailValue}>{formatDate(activeFolder.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: files */}
              <div className={s.filesCard}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>Files</span>
                  <span className={s.cardMeta}>
                    {loadingFiles ? 'Loading…' : `${files.length} file${files.length !== 1 ? 's' : ''}${files.length > 0 ? ` · ${formatBytes(totalSize)}` : ''}`}
                  </span>
                </div>

                {loadingFiles ? (
                  <div className={s.spinnerWrap}><div className={s.spinner} /></div>

                ) : files.length === 0 ? (
                  <div className={s.emptyWrap}>
                    <div className={s.emptyIcon}><FileX size={16} /></div>
                    <p className={s.emptyText}>No files yet</p>
                    <p className={s.emptySubtext}>
                      {canEdit ? 'Upload your first file to this folder.' : 'Files uploaded to this project will appear here.'}
                    </p>
                    {canEdit && (
                      <button type="button"
                        onClick={() => navigate('/upload', { state: { folderId: activeFolder.id, groupId: resolvedGroupId } })}
                        className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 border-0 cursor-pointer mt-1">
                        <UploadCloud size={13} /> Upload file
                      </button>
                    )}
                  </div>

                ) : (
                  <table className={s.filesTable}>
                    <thead className={s.filesThead}>
                      <tr>
                        <th className="px-5 py-2.5 w-10">
                          <input type="checkbox" checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                        </th>
                        <th className={s.filesTh}>Name</th>
                        <th className={s.filesTh}>Size</th>
                        <th className={s.filesTh}>Type</th>
                        <th className={s.filesTh} />
                      </tr>
                    </thead>
                    <tbody className={s.filesTbody}>
                      {files.map(f => {
                        const ext        = f.ext ?? getFileExtension(f.name);
                        const isSelected = selectedIds.has(f.id);
                        return (
                          <tr key={f.id} className={[s.filesTr, isSelected ? 'bg-indigo-50/50' : ''].join(' ')}>
                            <td className="px-5 py-3.5 w-10">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleOne(f.id)}
                                className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                            </td>
                            <td className={s.filesTd}>
                              <div className={s.fileNameCell}>
                                <div className={s.fileThumb}>{fileEmoji(ext)}</div>
                                <span className={s.fileName}>{f.name}</span>
                              </div>
                            </td>
                            <td className={s.filesTd + ' text-slate-400 tabular-nums'}>{f.sizeFormatted}</td>
                            <td className={s.filesTd}>
                              <span className={['inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white', badgeCls(ext)].join(' ')}>
                                {ext?.toUpperCase()}
                              </span>
                            </td>
                            <td className={s.filesTd}>
                              <button type="button" onClick={() => handleDownload(f)} className={s.downloadBtn}>
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
          )}
        </div>
      </div>

      {/* No cohort dialog */}
      {showCohortDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={() => setShowCohortDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mx-auto">
              <UserCog size={22} className="text-amber-500" />
            </div>
            <div className="text-center">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-1">No cohort selected</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Go to <strong>Settings › Profile</strong> and choose your group.
              </p>
            </div>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => setShowCohortDialog(false)}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={() => { setShowCohortDialog(false); navigate('/settings'); }}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-white border-0 cursor-pointer"
                style={{ background: '#EB5800' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#CC4D00')}
                onMouseLeave={e => (e.currentTarget.style.background = '#EB5800')}>
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}