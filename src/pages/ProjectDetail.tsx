import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGroups, useUserGroupIds } from '../hooks/useGroups';
import { useFolderTree } from '../hooks/useFolderTree';
import { useUpload } from '../hooks/useUpload';
import JSZip from 'jszip';
import { downloadFile, formatBytes } from '../lib/storage';
import { getFileExtension, getFileConfig } from '../lib/metadata';
import Layout from '../components/layout/Layout';
import {
  ArrowLeft, AlertTriangle, MoreHorizontal, Users,
  FileText, Download, FolderOpen, UploadCloud, X,
  FolderPlus, Loader2, FileX, Pencil, Trash2, Upload,
  Eye, HardDrive, Tag, Calendar,
} from 'lucide-react';
import type { Group } from '../components/layout/ui/cons';
import type { FolderRecord } from '../types/folder';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectFile {
  id: string;
  name: string;
  path?: string;
  storage_path?: string;
  size_bytes?: number | null;
  created_at: string;
  uploaded_by?: string | null;
  ext?: string;
  [key: string]: unknown;
}

interface SubProjectMember {
  id: string;
  user_id: string;
  role: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface UploaderInfo {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface MiniCohort {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
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

const ICON_OPTIONS = ['📁','🚀','💡','🎯','🔬','📊','🛠️','🌐','🎨','📝','🔐','⚙️','📦','🧪','🏗️'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function hashColor(str: string) {
  const palette = ['#5B8DEF', '#4CAF7D', '#F5C842', '#E07B54', '#A78BFA', '#F472B6', '#34D399'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return '—'; }
}

// ─── MemberAvatar ─────────────────────────────────────────────────────────────

function MemberAvatar({ name, avatarUrl, size = 28 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const color = hashColor(name);
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
    );
  }
  return (
    <div className="rounded-full shrink-0 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    owner:  'bg-violet-50 text-violet-600 border-violet-100',
    admin:  'bg-indigo-50 text-indigo-600 border-indigo-100',
    editor: 'bg-blue-50 text-blue-600 border-blue-100',
    viewer: 'bg-slate-50 text-slate-500 border-slate-200',
    member: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium border capitalize ${map[role?.toLowerCase()] ?? map.member}`}>
      {role}
    </span>
  );
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
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: '20px 22px',
        background: hov ? '#f8fafc' : '#ffffff',
        border: `1px solid ${hov ? '#c7d2e0' : '#e2e8f0'}`,
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
        boxShadow: hov ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {hov && !renaming && canEdit && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 4 }}>
          <button title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true); }}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#fef3c7', color: '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Pencil size={11} />
          </button>
          <button title="Delete" onClick={e => { e.stopPropagation(); void onDelete(node.id); }}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 80, height: 64, flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 34, height: 12, borderRadius: '4px 4px 0 0', background: tab }} />
          <div style={{ position: 'absolute', top: 9, left: 0, width: 80, height: 55, borderRadius: '2px 8px 8px 8px', background: body, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${body}55` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <span style={{ fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>{node.icon ?? '📁'}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <input autoFocus value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
              onBlur={() => void commitRename()}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', fontSize: 14, padding: '4px 8px', borderRadius: 6, border: '1.5px solid #6366f1', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
            />
          ) : (
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {node.name}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: 20 }}>
          {node.file_count ?? 0} file{(node.file_count ?? 0) !== 1 ? 's' : ''}
        </span>
        {(node.children?.length ?? 0) > 0 && (
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: 20 }}>
            📁 {node.children!.length} sub-folder{node.children!.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── CreateSubFolderModal ─────────────────────────────────────────────────────

function CreateSubFolderModal({ parentName, parentId, groupId, onClose, onCreated }: {
  parentName: string; parentId: string; groupId: string;
  onClose: () => void; onCreated: () => void;
}) {
  const [name,    setName]    = useState('');
  const [icon,    setIcon]    = useState('📁');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Folder name is required.'); return; }
    setLoading(true); setError(null);
    try {
      const { error: e } = await db.from('subprojects').insert({ name: trimmed, icon, parent_id: parentId, group_id: groupId });
      if (e) throw new Error(e.message);
      onCreated(); onClose();
    } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900">New Sub-folder</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Inside <span className="font-semibold text-slate-600">{parentName}</span></p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 cursor-pointer"><X size={15} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ico => (
                <button key={ico} type="button" onClick={() => setIcon(ico)}
                  className={['w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer border-0', icon === ico ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'bg-slate-50 hover:bg-slate-100'].join(' ')}>
                  {ico}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Folder Name</label>
            <input autoFocus type="text" value={name}
              onChange={e => { setName(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); if (e.key === 'Escape') onClose(); }}
              placeholder="e.g. Raw Data, Reports…"
              className={['w-full px-4 py-2.5 rounded-xl text-[14px] text-slate-900 bg-slate-50 border outline-none', error ? 'border-red-400' : 'border-slate-200 focus:border-indigo-500'].join(' ')}
            />
            {error && <p className="text-[12px] text-red-500 mt-1.5">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button type="button" onClick={() => void handleSubmit()} disabled={loading || !name.trim()}
            className={['h-9 px-4 rounded-xl text-[13px] font-medium text-white flex items-center gap-2 border-0', loading || !name.trim() ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'].join(' ')}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : <><FolderPlus size={13} /> Create</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FilePreview ──────────────────────────────────────────────────────────────

function FilePreview({ file, ext }: { file: ProjectFile; ext: string }) {
  const rawPath     = (file.storage_path ?? file.path) as string | undefined;
  const storagePath = rawPath?.startsWith('filevault/') ? rawPath.slice('filevault/'.length) : rawPath;

  const isImage  = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
  const isPdf    = ext === 'pdf';
  const isOffice = ['xlsx','xls','docx','doc','pptx','ppt'].includes(ext);
  const isVideo  = ['mp4','webm','mov','avi','mkv'].includes(ext);
  const isAudio  = ['mp3','wav','aac','m4a','flac','ogg'].includes(ext);
  const isText   = ['txt','md','csv','json','xml','html','css','js','ts','jsx','tsx','py','java','c','cpp','rb','go','rs','sh','yaml','yml','toml','ini','log'].includes(ext);
  const canPreview = isImage || isPdf || isOffice || isVideo || isAudio || isText;

  const [url,     setUrl]     = useState<string | null>(null);
  const [text,    setText]    = useState<string | null>(null);
  const [loading, setLoading] = useState(canPreview && !!storagePath);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath || !canPreview) return;
    let objectUrl: string | null = null;
    (async () => {
      try {
        if (isOffice || isVideo || isAudio) {
          const { data, error: e } = await supabase.storage.from('filevault').createSignedUrl(storagePath, 3600);
          if (e || !data) throw new Error(e?.message ?? 'Failed');
          setUrl(isOffice ? `https://docs.google.com/viewer?url=${encodeURIComponent(data.signedUrl)}&embedded=true` : data.signedUrl);
        } else {
          const { data, error: e } = await supabase.storage.from('filevault').download(storagePath);
          if (e || !data) throw new Error(e?.message ?? 'Failed');
          if (isText) { const raw = await (data as Blob).text(); setText(raw.length > 60000 ? raw.slice(0, 60000) + '\n\n… (preview truncated)' : raw); }
          else { objectUrl = URL.createObjectURL(data); setUrl(objectUrl); }
        }
      } catch (err) { setError(String(err)); } finally { setLoading(false); }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storagePath, canPreview, isOffice, isVideo, isAudio, isText]);

  const cfg = getFileConfig(ext);

  if (!canPreview) return (<div className="flex flex-col items-center justify-center py-14 gap-3"><div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[12px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label.slice(0, 3).toUpperCase()}</div><p className="text-[13px] text-slate-500 font-medium">No preview for .{ext} files</p><p className="text-[11px] text-slate-400">Download the file to open it</p></div>);
  if (loading) return (<div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={22} className="animate-spin" /><span className="text-[12px]">Loading preview…</span></div>);
  if (error) return (<div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-8"><AlertTriangle size={20} className="text-amber-400" /><p className="text-[13px] text-slate-500 font-medium">Preview unavailable</p><p className="text-[11px] text-slate-400">Download the file to view it</p></div>);
  if (url && isImage) return <img src={url} alt={file.name} className="max-w-full object-contain p-4" style={{ maxHeight: '70vh' }} />;
  if (url && (isPdf || isOffice)) return <iframe src={url} title={file.name} className="w-full border-none" style={{ height: '72vh' }} referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />;
  if (url && isVideo) return (<div className="w-full p-4"><video controls className="w-full rounded-lg" style={{ maxHeight: '68vh' }}><source src={url} /></video></div>);
  if (url && isAudio) return (<div className="flex flex-col items-center gap-5 py-12 px-8"><div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[13px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{ext.toUpperCase()}</div><p className="text-[13px] font-medium text-slate-600">{file.name}</p><audio controls className="w-full"><source src={url} /></audio></div>);
  if (text !== null) return (<pre className="w-full text-left p-5 font-mono text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words overflow-auto" style={{ maxHeight: '70vh', background: '#f8fafc' }}>{text}</pre>);
  return null;
}

// ─── FilePreviewModal ─────────────────────────────────────────────────────────

function FilePreviewModal({ file, onClose }: { file: ProjectFile; onClose: () => void }) {
  const ext = file.ext ?? getFileExtension(file.name);
  const cfg = getFileConfig(ext);
  useEffect(() => { function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return (
    <>
      <style>{`@keyframes previewPop { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      <div className="fixed inset-0 z-[60] bg-black/55" style={{ backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto" style={{ width: '100%', maxWidth: 860, maxHeight: '92vh', animation: 'previewPop 0.18s ease-out' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label.slice(0, 3).toUpperCase()}</div>
              <div className="min-w-0"><p className="text-[14px] font-semibold text-slate-800 truncate">{file.name}</p><p className="text-[11px] text-slate-400">{formatBytes(Number(file.size_bytes ?? 0))} · .{ext.toUpperCase()}</p></div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 cursor-pointer shrink-0 ml-3"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50"><FilePreview file={file} ext={ext} /></div>
        </div>
      </div>
    </>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; children: React.ReactNode; }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <Icon size={12} className="text-slate-300 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <div className="text-[12px] text-slate-700">{children}</div>
      </div>
    </div>
  );
}

// ─── FileDrawer ───────────────────────────────────────────────────────────────

function FileDrawer({ file, folderName, groupName, canEdit, onClose, onDeleted }: { file: ProjectFile; folderName?: string; groupName?: string; canEdit: boolean; onClose: () => void; onDeleted: (fileId: string) => void; }) {
  const [uploader,    setUploader]    = useState<UploaderInfo | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const ext = file.ext ?? getFileExtension(file.name);
  const cfg = getFileConfig(ext);

  useEffect(() => {
    if (!file.uploaded_by) return;
    (async () => { const { data } = await db.from('profiles').select('full_name, email, avatar_url').eq('id', file.uploaded_by).maybeSingle(); if (data) setUploader(data as UploaderInfo); })();
  }, [file.uploaded_by]);

  async function handleDownload() {
    const storagePath = (file.storage_path ?? file.path) as string | undefined;
    if (!storagePath) return;
    setDownloading(true);
    try { await downloadFile(storagePath, file.name); } finally { setDownloading(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await db.from('files').update({ is_deleted: true }).eq('id', file.id); onDeleted(file.id); onClose(); }
    catch { setDeleting(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[360px] bg-white border-l border-slate-200 flex flex-col shadow-2xl" style={{ animation: 'fdSlideIn 0.18s ease-out' }}>
        <style>{`@keyframes fdSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label.slice(0, 3).toUpperCase()}</div>
            <div className="min-w-0"><p className="text-[13px] font-semibold text-slate-800 truncate">{file.name}</p><p className="text-[11px] text-slate-400">{formatBytes(Number(file.size_bytes ?? 0))} · .{ext.toUpperCase()}</p></div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 cursor-pointer shrink-0 ml-2"><X size={13} /></button>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 shrink-0">
          <button onClick={() => void handleDownload()} disabled={downloading} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50">
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}{downloading ? 'Downloading…' : 'Download'}
          </button>
          <button onClick={() => setPreviewOpen(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 cursor-pointer transition-colors"><Eye size={12} /> Preview</button>
          {canEdit && (<button onClick={() => void handleDelete()} disabled={deleting} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 cursor-pointer transition-colors disabled:opacity-50 ml-auto">{deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}{deleting ? 'Deleting…' : 'Delete'}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="border border-slate-100 rounded-xl px-4 py-1">
            <MetaRow icon={HardDrive} label="Size">{formatBytes(Number(file.size_bytes ?? 0))}</MetaRow>
            <MetaRow icon={Tag} label="Type"><span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-semibold uppercase" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></MetaRow>
            <MetaRow icon={Calendar} label="Uploaded">{fmtDate(file.created_at)}</MetaRow>
            {folderName && <MetaRow icon={FolderOpen} label="Folder">{folderName}</MetaRow>}
            {groupName  && <MetaRow icon={FolderOpen} label="Cohort">{groupName}</MetaRow>}
          </div>
          <div className="border border-slate-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Uploaded by</p>
            {uploader ? (
              <div className="flex items-center gap-3"><MemberAvatar name={uploader.full_name ?? uploader.email ?? 'User'} avatarUrl={uploader.avatar_url} size={36} /><div className="min-w-0"><p className="text-[13px] font-medium text-slate-700 truncate">{uploader.full_name ?? 'Unknown'}</p>{uploader.email && <p className="text-[11px] text-slate-400 truncate">{uploader.email}</p>}</div></div>
            ) : (
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center"><Users size={13} className="text-slate-300" /></div><p className="text-[12px] text-slate-400">Unknown uploader</p></div>
            )}
          </div>
          <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">File ID</p>
            <p className="text-[10px] font-mono text-slate-400 break-all select-all">{file.id}</p>
          </div>
        </div>
      </div>
      {previewOpen && <FilePreviewModal file={file} onClose={() => setPreviewOpen(false)} />}
    </>
  );
}

// ─── ProjectDetail ────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { groupId }                        = useParams<{ groupId: string }>();
  const navigate                           = useNavigate();
  const location                           = useLocation();
  const { profile }                        = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const { userGroupIds }                   = useUserGroupIds();
  const queryClient                        = useQueryClient();

  const { roots, loading: foldersLoading, refetch: refetchFolders, renameFolder, deleteFolder } = useFolderTree(groupId ?? '');
  const { uploadFile, uploading: inlineUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  const [folderIdStack,      setFolderIdStack]      = useState<string[]>([]);
  const [activeGroupId,      setActiveGroupId]      = useState(groupId);
  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [dismissedWarning,   setDismissedWarning]   = useState(false);
  const [selectedFile,       setSelectedFile]       = useState<ProjectFile | null>(null);

  // ── CHANGED: replaced filterTileId (folder-based) with filterCohortName (cohort-based) ──
  const [filterCohortName,   setFilterCohortName]   = useState<string | null>(null);

  const [deepLinkConsumed,   setDeepLinkConsumed]   = useState(false);

  if (activeGroupId !== groupId) {
    setActiveGroupId(groupId);
    setFolderIdStack([]);
    setDeepLinkConsumed(false);
  }

  const folderMap = useMemo(() => {
    const map = new Map<string, FolderRecord>();
    function walk(nodes: FolderRecord[]) { for (const n of nodes) { map.set(n.id, n); if (n.children?.length) walk(n.children); } }
    walk(roots);
    return map;
  }, [roots]);

  useEffect(() => {
    if (deepLinkConsumed) return;
    if (foldersLoading || roots.length === 0) return;
    const openFolderId = (location.state as { openFolderId?: string } | null)?.openFolderId;
    if (!openFolderId) return;
    function buildAncestorPath(targetId: string): string[] {
      const path: string[] = [];
      let current = folderMap.get(targetId);
      while (current) { path.unshift(current.id); const parentId = (current as FolderRecord & { parent_id?: string | null }).parent_id; current = parentId ? folderMap.get(parentId) : undefined; }
      return path;
    }
    const path = buildAncestorPath(openFolderId);
    if (path.length > 0) setFolderIdStack(path);
    setDeepLinkConsumed(true);
  }, [location.state, foldersLoading, roots, folderMap, deepLinkConsumed]);

  const folderStack  = folderIdStack.map(id => folderMap.get(id)).filter(Boolean) as FolderRecord[];
  const activeFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
  const isLeafFolder = activeFolder !== null && (activeFolder.children?.length ?? 0) === 0;
  const currentTiles = activeFolder ? (activeFolder.children ?? []) : roots;

  // ── Fetch mini_cohorts for this group via junction table ──
  const { data: miniCohorts = [], isLoading: miniCohortsLoading } = useQuery<MiniCohort[]>({
    queryKey: ['mini-cohorts', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from('group_mini_cohorts')
        .select('mini_cohorts!inner(id, name, created_at)')
        .eq('group_id', groupId)
        .order('mini_cohorts(name)', { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as { mini_cohorts: MiniCohort }[]).map(r => r.mini_cohorts);
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  const visibleTiles = (() => {
    if (!filterCohortName) return currentTiles;
    const matchId = miniCohorts.find(mc => mc.name === filterCohortName)?.id;
    if (!matchId) return currentTiles;
    return currentTiles.filter(f => (f.mini_cohort_ids ?? []).includes(matchId));
  })();

  // ── Members: use only group_members (folder_members table doesn't exist) ──
  const { data: members = [], isLoading: membersLoading } = useQuery<SubProjectMember[]>({
    queryKey: ['subproject-members', activeFolder?.id, groupId],
    queryFn: async () => {
      const { data: gm, error: gmErr } = await db
        .from('group_members')
        .select('id, user_id, role')
        .eq('group_id', groupId);
      if (gmErr) throw new Error(gmErr.message);
      if (!gm?.length) return [];

      const userIds = gm.map((m: any) => m.user_id);
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return gm.map((m: any) => {
        const p = profileMap.get(m.user_id) as any;
        return { id: m.id, user_id: m.user_id, role: m.role ?? 'member', full_name: p?.full_name ?? null, email: p?.email ?? null, avatar_url: p?.avatar_url ?? null };
      });
    },
    enabled: !!activeFolder && isLeafFolder && !!groupId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<ProjectFile[]>({
    queryKey: ['project-files', activeFolder?.id],
    queryFn: async () => {
      const { data, error } = await db.from('files').select('*').eq('folder_id', activeFolder!.id).eq('is_deleted', false).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((f: any) => ({ ...f, ext: getFileExtension(f.name) })) as ProjectFile[];
    },
    enabled: !!activeFolder && isLeafFolder,
    staleTime: 2 * 60 * 1000,
  });

  const group: Group | null = groups.find(g => g.id === groupId) ?? null;
  const isAdmin             = profile?.role === 'admin';
  const isMember            = isAdmin || userGroupIds.has(groupId ?? '');
  const canEdit             = isMember;
  const cohortMismatch      = !dismissedWarning && !isMember && !!group;
  const totalSize           = files.reduce((s, f) => s + (Number(f.size_bytes) || 0), 0);

  function openFolder(f: FolderRecord) { setFolderIdStack(s => [...s, f.id]); }
  function jumpTo(i: number) { setFolderIdStack(s => i === -1 ? [] : s.slice(0, i + 1)); }

  async function handleRename(id: string, name: string) { await renameFolder(id, name); await refetchFolders(); }
  async function handleDelete(id: string) {
    if (!window.confirm('Delete this folder?')) return;
    await deleteFolder(id);
    setFolderIdStack(s => s.filter(fid => fid !== id));
    await refetchFolders();
  }

  function handleGroupSelect(g: Group | null) { if (g) navigate(`/groups/${g.id}`); else navigate('/groups'); }

  async function handleExport() {
    if (!files.length || !activeFolder) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      await Promise.all(files.map(async file => {
        const rawPath = (file.storage_path ?? file.path) as string | undefined;
        const path = rawPath?.startsWith('filevault/') ? rawPath.slice('filevault/'.length) : rawPath;
        if (!path) return;
        const { data, error } = await supabase.storage.from('filevault').download(path);
        if (error || !data) return;
        zip.file(file.name, data);
      }));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeFolder.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleInlineUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length || !activeFolder) return;
    await Promise.allSettled(
      picked.map(file => uploadFile({ file, groupId: groupId ?? null, folderId: activeFolder.id }))
    );
    void queryClient.invalidateQueries({ queryKey: ['project-files', activeFolder.id] });
  }

  if (groupsLoading) {
    return (<Layout selectedGroupId={groupId}><div className="flex-1 flex items-center justify-center bg-slate-50"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div></Layout>);
  }

  if (!group) {
    return (<Layout><div className="flex-1 flex items-center justify-center bg-slate-50"><div className="text-center"><p className="text-sm text-slate-500 mb-3">Project not found.</p><button onClick={() => navigate('/groups')} className="text-sm text-violet-600 hover:underline border-0 bg-transparent cursor-pointer">← Back to cohorts</button></div></div></Layout>);
  }

  return (
    <Layout selectedGroupId={groupId} onSelectGroup={handleGroupSelect}>
      <>
        {selectedFile && (
          <FileDrawer file={selectedFile} folderName={activeFolder?.name} groupName={group.name} canEdit={canEdit} onClose={() => setSelectedFile(null)}
            onDeleted={(fileId) => { queryClient.setQueryData(['project-files', activeFolder?.id], (old: ProjectFile[] | undefined) => (old ?? []).filter(f => f.id !== fileId)); }} />
        )}

        {showSubFolderModal && activeFolder && groupId && (
          <CreateSubFolderModal parentName={activeFolder.name} parentId={activeFolder.id} groupId={groupId} onClose={() => setShowSubFolderModal(false)}
            onCreated={async () => { await refetchFolders(); void queryClient.invalidateQueries({ queryKey: ['project-files', activeFolder.id] }); }} />
        )}

        {cohortMismatch && (
          <div className="flex-shrink-0 flex items-start gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="flex-1 leading-relaxed"><strong>View &amp; download only</strong> — You are not a member of <strong>{group?.name}</strong>. To upload or manage files here, ask an admin to add you to this group.</p>
            <button onClick={() => setDismissedWarning(true)} className="text-amber-400 hover:text-amber-600 border-0 bg-transparent cursor-pointer p-0 shrink-0"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <button onClick={() => navigate('/groups')} className="hover:text-violet-600 border-0 bg-transparent cursor-pointer p-0 text-[11px]">Root</button>
                <span className="text-slate-300">/</span>
                <button onClick={() => jumpTo(-1)} className="hover:text-violet-600 border-0 bg-transparent cursor-pointer p-0 text-[11px] text-slate-600 font-medium">{group.icon ? `${group.icon} ` : ''}{group.name}</button>
                {folderStack.map((f, i) => (
                  <span key={f.id} className="flex items-center gap-1.5">
                    <span className="text-slate-300">/</span>
                    {i === folderStack.length - 1 ? <span className="text-slate-700 font-semibold">{f.name}</span> : <button onClick={() => jumpTo(i)} className="hover:text-violet-600 border-0 bg-transparent cursor-pointer p-0 text-[11px] text-slate-600">{f.name}</button>}
                  </span>
                ))}
              </nav>
              <h1 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                <button
                  onClick={() => { if (folderStack.length > 0) jumpTo(folderStack.length - 2); else navigate('/groups'); }}
                  className="group flex items-center justify-center w-7 h-7 rounded-lg border-0 cursor-pointer transition-colors bg-transparent hover:bg-[#054159] flex-shrink-0">
                  <ArrowLeft size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                </button>
                {activeFolder ? <><span className="text-xl">{activeFolder.icon ?? '📁'}</span>{activeFolder.name}</> : <>{group.icon ? <span className="text-xl">{group.icon}</span> : null}{group.name}</>}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && activeFolder && (
                <button onClick={() => setShowSubFolderModal(true)}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-bold text-white border-0 cursor-pointer transition-all hover:-translate-y-px"
                  style={{ background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 4px 14px rgba(255,100,0,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,120,0,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,100,0,0.35)')}>
                  <FolderPlus size={13} /> New Sub-folder
                </button>
              )}
              <button onClick={() => navigate('/upload')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-bold text-white border-0 cursor-pointer transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 4px 14px rgba(255,100,0,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,120,0,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,100,0,0.35)')}>
                Create Project
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLeafFolder && activeFolder ? (
              <div className="flex gap-5 items-start">
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h2 className="text-[14px] font-semibold text-slate-800">Project details</h2><button className="text-slate-300 hover:text-slate-500 border-0 bg-transparent cursor-pointer p-0"><MoreHorizontal size={16} /></button></div>
                    <div className="divide-y divide-slate-50">
                      <div className="flex items-center px-5 py-3.5"><span className="w-28 text-[13px] text-slate-400">Name</span><span className="text-[13px] text-slate-800 font-medium">{activeFolder.name}</span></div>
                      <div className="flex items-center px-5 py-3.5"><span className="w-28 text-[13px] text-slate-400">Description</span><span className="text-[13px] text-slate-800 font-medium">{(activeFolder as any).description ?? <span className="text-slate-300">—</span>}</span></div>
                      <div className="flex items-center px-5 py-3.5"><span className="w-28 text-[13px] text-slate-400">Cohort</span><span className="text-[13px] text-slate-800 font-medium">{group.name}</span></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h2 className="text-[14px] font-semibold text-slate-800">Team members</h2><span className="text-[12px] text-slate-400">{membersLoading ? '…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}</span></div>
                    {membersLoading ? (
                      <div className="divide-y divide-slate-50 animate-pulse">{[1, 2].map(i => (<div key={i} className="flex items-center gap-3 px-5 py-3.5"><div className="w-7 h-7 rounded-full bg-slate-100 shrink-0" /><div className="flex-1 space-y-1.5"><div className="h-3 w-1/3 bg-slate-100 rounded" /><div className="h-2.5 w-1/2 bg-slate-100 rounded" /></div><div className="h-5 w-14 bg-slate-100 rounded-full" /></div>))}</div>
                    ) : members.length === 0 ? (
                      <div className="py-10 flex flex-col items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center"><Users size={18} className="text-slate-300" /></div><p className="text-[13px] text-slate-400">No members yet</p></div>
                    ) : (
                      <div>
                        <div className="grid px-5 py-2 bg-slate-50/60 border-b border-slate-100" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Name</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Role</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {members.map(m => (
                            <div key={m.id} className="grid items-center px-5 py-3 hover:bg-slate-50/60 transition-colors" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                              <div className="flex items-center gap-2.5 min-w-0"><MemberAvatar name={m.full_name ?? m.email ?? 'User'} avatarUrl={m.avatar_url} size={28} /><span className="text-[13px] font-medium text-slate-700 truncate">{m.full_name ?? 'Unknown'}</span></div>
                              <span className="text-[12px] text-slate-400 truncate pr-3">{m.email ?? '—'}</span>
                              <RoleBadge role={m.role ?? 'member'} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div><h2 className="text-[14px] font-semibold text-slate-800">Files</h2>{!filesLoading && <p className="text-[12px] text-slate-400 mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''}{files.length > 0 ? ` · ${formatBytes(totalSize)}` : ''}</p>}</div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => void handleInlineUpload(e)}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={inlineUploading}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium text-white border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px"
                            style={{ background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 2px 8px rgba(255,100,0,0.3)' }}
                          >
                            {inlineUploading
                              ? <><Loader2 size={11} className="animate-spin" /> Uploading…</>
                              : <><UploadCloud size={11} /> Upload</>
                            }
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => void handleExport()}
                        disabled={exporting || files.length === 0}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {exporting ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} className="rotate-180" />}
                        {exporting ? 'Exporting…' : 'Export'}
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-0 bg-transparent cursor-pointer"><MoreHorizontal size={14} /></button>
                    </div>
                  </div>
                  {!filesLoading && files.length > 0 && (<div className="grid px-5 py-2 bg-slate-50/60 border-b border-slate-100" style={{ gridTemplateColumns: '1fr 80px 60px 36px' }}><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Name</span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Size</span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right pr-2">Type</span><span /></div>)}
                  {filesLoading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div>
                  ) : files.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><FileText size={20} className="text-slate-300" /></div>
                      <p className="text-[13px] font-medium text-slate-600">No files yet</p>
                      <p className="text-[12px] text-slate-400 max-w-[200px]">{canEdit ? 'Upload your first file to this project.' : 'Files will appear here once uploaded.'}</p>
                      {canEdit && (<button onClick={() => navigate('/upload', { state: { folderId: activeFolder.id, groupId } })} className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 border-0 cursor-pointer mt-1"><UploadCloud size={13} /> Upload file</button>)}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {files.map(file => {
                        const ext = file.ext ?? getFileExtension(file.name);
                        const cfg = getFileConfig(ext);
                        return (
                          <div key={file.id} className="grid items-center px-5 py-3.5 hover:bg-slate-50/60 cursor-pointer group transition-colors" style={{ gridTemplateColumns: '1fr 80px 60px 36px' }} onClick={() => setSelectedFile(file)}>
                            <div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label.slice(0, 3).toUpperCase()}</div><span className="text-[13px] font-medium text-slate-700 truncate">{file.name}</span></div>
                            <span className="text-[12px] text-slate-400 text-right tabular-nums">{formatBytes(Number(file.size_bytes))}</span>
                            <span className="inline-flex items-center justify-end pr-2"><span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-semibold uppercase" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></span>
                            <button onClick={e => { e.stopPropagation(); void downloadFile(file.path ?? file.storage_path ?? '', file.name); }} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 border-0 bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"><Download size={13} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div><h2 className="text-[14px] font-semibold text-slate-800">{activeFolder ? 'Sub-folders' : 'Projects'}</h2><p className="text-[12px] text-slate-400 mt-0.5">{foldersLoading ? 'Loading…' : `${currentTiles.length} folder${currentTiles.length !== 1 ? 's' : ''}`}</p></div>
                </div>
                <div className="p-6">
                  {foldersLoading ? (
                    <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div>
                  ) : currentTiles.length === 0 ? (
                    <div className="flex flex-col items-center py-14 gap-3"><div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center"><FileX size={16} className="text-slate-300" /></div><p className="text-[13px] font-medium text-slate-600">No projects yet</p><p className="text-[12px] text-slate-400">{canEdit ? 'Create your first project above.' : 'Projects will appear here once created.'}</p></div>
                  ) : (
                    <>
                      {/* ── CHANGED: cohort-based filter pills ── */}
                      <div className="flex items-center gap-2 flex-wrap mb-5">
                        {/* All pill */}
                        <button
                          type="button"
                          onClick={() => setFilterCohortName(null)}
                          className={[
                            'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border whitespace-nowrap',
                            filterCohortName === null
                              ? 'text-white border-transparent shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900',
                          ].join(' ')}
                          style={filterCohortName === null
                            ? { background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 4px 12px rgba(255,100,0,0.35)' }
                            : {}}>
                          All
                        </button>

                        {/* Mini cohort filter pills */}
                        {miniCohortsLoading ? (
                          <span className="text-[12px] text-slate-400 animate-pulse">Loading cohorts…</span>
                        ) : (
                          miniCohorts.map(mc => {
                            const isActive = filterCohortName === mc.name;
                            const cohortFileCount = currentTiles
                              .filter(f => (f.mini_cohort_ids ?? []).includes(mc.id))
                              .reduce((sum, f) => sum + (f.file_count ?? 0), 0);
                            return (
                              <button
                                key={mc.id}
                                type="button"
                                onClick={() => setFilterCohortName(prev => prev === mc.name ? null : mc.name)}
                                className={[
                                  'inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border whitespace-nowrap',
                                  isActive
                                    ? 'text-white border-transparent shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900',
                                ].join(' ')}
                                style={isActive
                                  ? { background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 4px 12px rgba(255,100,0,0.35)' }
                                  : {}}>
                                {mc.name}
                                {cohortFileCount > 0 && (
                                  <span className={isActive ? 'opacity-70 text-xs' : 'text-slate-400 text-xs'}>
                                    {cohortFileCount}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {visibleTiles.map(folder => (<FolderTile key={folder.id} node={folder} canEdit={canEdit} onOpen={() => openFolder(folder)} onRename={handleRename} onDelete={handleDelete} />))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    </Layout>
  );
}