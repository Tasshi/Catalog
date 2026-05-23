import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getFileExtension, getFileConfig } from '../lib/metadata';
import { formatBytes } from '../lib/storage';
import Layout from '../components/layout/Layout';
import {
  ArrowLeft, Download, Trash2, Eye, EyeOff,
  Calendar, HardDrive, Tag, FolderOpen,
  Users, Loader2, AlertTriangle, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileRecord {
  id: string;
  name: string;
  path?: string;
  storage_path?: string;
  size_bytes?: number | null;
  created_at: string;
  folder_id?: string | null;
  group_id?: string | null;
  uploaded_by?: string | null;
  description?: string | null;
  is_deleted?: boolean;
  [key: string]: unknown;
}

interface FolderInfo {
  id: string;
  name: string;
  icon?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
}

interface UploaderInfo {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  icon?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined, long = false) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', long
      ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function hashColor(str: string) {
  const palette = ['#5B8DEF', '#4CAF7D', '#F5C842', '#E07B54', '#A78BFA', '#F472B6', '#34D399'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const color = hashColor(name);
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        className="rounded-full object-cover shrink-0"
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

// ─── FilePreview ──────────────────────────────────────────────────────────────

function FilePreview({ file, ext }: { file: FileRecord; ext: string }) {
  const [url, setUrl]         = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  const isImage  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf    = ext === 'pdf';
  const isOffice = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);
  const isText   = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext);
  const canPreview = isImage || isPdf || isOffice || isText;

  const storagePath = (file.storage_path ?? file.path) as string | undefined;

  useEffect(() => {
    if (!storagePath || !canPreview) { setLoading(false); return; }

    let objectUrl: string | null = null;

    (async () => {
      try {
        if (isOffice) {
          const { data, error: e } = await supabase.storage
            .from('filevault')
            .createSignedUrl(storagePath, 3600);
          if (e || !data) throw new Error(e?.message ?? 'Signed URL failed');
          setUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(data.signedUrl)}&embedded=true`);
        } else {
          const { data, error: e } = await supabase.storage
            .from('filevault')
            .download(storagePath);
          if (e || !data) throw new Error(e?.message ?? 'Download failed');
          objectUrl = URL.createObjectURL(data);
          setUrl(objectUrl);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storagePath]);

  const cfg = getFileConfig(ext);

  if (!visible) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center h-16">
        <button onClick={() => setVisible(true)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-violet-600 border-0 bg-transparent cursor-pointer">
          <Eye size={13} /> Show preview
        </button>
      </div>
    );
  }

  if (!canPreview) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label.slice(0, 3).toUpperCase()}
        </div>
        <p className="text-[13px] text-slate-400">No preview available for .{ext} files</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Preview</span>
        <button onClick={() => setVisible(false)}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
          <EyeOff size={11} /> Hide
        </button>
      </div>

      <div className="flex items-center justify-center" style={{ minHeight: 320, maxHeight: 600 }}>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[12px]">Loading preview…</span>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <AlertTriangle size={22} className="text-amber-400" />
            <p className="text-[12px] text-slate-500 max-w-xs">Preview unavailable: {error}</p>
          </div>
        )}
        {!loading && !error && url && isImage && (
          <img src={url} alt={file.name}
            className="max-w-full max-h-full object-contain p-4 rounded"
            style={{ maxHeight: 560 }} />
        )}
        {!loading && !error && url && (isPdf || isOffice) && (
          <iframe src={url} title={file.name}
            className="w-full border-none"
            style={{ height: 560 }} />
        )}
        {!loading && !error && url && isText && (
          <iframe src={url} title={file.name}
            className="w-full border-none bg-white"
            style={{ height: 400 }} />
        )}
      </div>
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <div className="text-[13px] text-slate-700">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FileDetail() {
  const { fileId, id } = useParams<{ fileId?: string; id?: string }>();
  const resolvedId = fileId ?? id; // works with both /files/:fileId and /files/:id
  const navigate     = useNavigate();
  const { profile }  = useAuth();

  const [file,     setFile]     = useState<FileRecord | null>(null);
  const [folder,   setFolder]   = useState<FolderInfo | null>(null);
  const [uploader, setUploader] = useState<UploaderInfo | null>(null);
  const [group,    setGroup]    = useState<GroupInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Load file + related data ───────────────────────────────────────────────
  useEffect(() => {
    if (!resolvedId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1. File record
        const { data: f, error: fErr } = await db
          .from('files')
          .select('*')
          .eq('id', resolvedId)
          .maybeSingle();
        if (fErr) throw new Error(fErr.message);
        if (!f) throw new Error('File not found.');
        if (!cancelled) setFile(f as FileRecord);

        // 2. Folder info (+ parent name for breadcrumb)
        if (f.folder_id) {
          const { data: fo } = await db
            .from('subprojects')
            .select('id, name, icon, parent_id')
            .eq('id', f.folder_id)
            .maybeSingle();
          if (!cancelled && fo) {
            let parentName: string | null = null;
            if (fo.parent_id) {
              const { data: pfo } = await db
                .from('subprojects')
                .select('name')
                .eq('id', fo.parent_id)
                .maybeSingle();
              parentName = pfo?.name ?? null;
            }
            setFolder({ ...fo, parent_name: parentName });
          }
        }

        // 3. Uploader profile
        if (f.uploaded_by) {
          const { data: up } = await db
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', f.uploaded_by)
            .maybeSingle();
          if (!cancelled && up) setUploader(up as UploaderInfo);
        }

        // 4. Group info
        if (f.group_id) {
          const { data: g } = await db
            .from('groups')
            .select('id, name, icon')
            .eq('id', f.group_id)
            .maybeSingle();
          if (!cancelled && g) setGroup(g as GroupInfo);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [resolvedId]);

  // ── Download ───────────────────────────────────────────────────────────────
  async function handleDownload() {
    if (!file) return;
    const storagePath = (file.storage_path ?? file.path) as string | undefined;
    if (!storagePath) return;
    setDownloading(true);
    try {
      const { data, error: e } = await supabase.storage
        .from('filevault')
        .download(storagePath);
      if (e || !data) throw new Error(e?.message ?? 'Download failed');
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!file || !window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await db.from('files').update({ is_deleted: true }).eq('id', file.id);
      navigate(-1);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const ext = file ? getFileExtension(file.name) : '';
  const cfg = getFileConfig(ext);
  const canEdit = !!(profile?.cohort && group?.name && profile.cohort === group.name);

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 size={20} className="animate-spin text-slate-300" />
        </div>
      </Layout>
    );
  }

  if (error || !file) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-3">{error ?? 'File not found.'}</p>
            <button onClick={() => navigate(-1)}
              className="text-sm text-violet-600 hover:underline border-0 bg-transparent cursor-pointer">
              ← Go back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-slate-50">

        {/* ── Page header ── */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
              <button onClick={() => navigate('/groups')}
                className="hover:text-violet-600 border-0 bg-transparent cursor-pointer p-0 text-[11px]">
                Root
              </button>
              {group && (
                <>
                  <span className="text-slate-300">/</span>
                  <button onClick={() => navigate(`/groups/${group.id}`)}
                    className="hover:text-violet-600 border-0 bg-transparent cursor-pointer p-0 text-[11px]">
                    {group.icon ? `${group.icon} ` : ''}{group.name}
                  </button>
                </>
              )}
              {folder?.parent_name && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500">{folder.parent_name}</span>
                </>
              )}
              {folder && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500">{folder.icon ?? '📁'} {folder.name}</span>
                </>
              )}
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-medium truncate max-w-[200px]">{file.name}</span>
            </nav>

            <h1 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2 truncate max-w-xl">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label.slice(0, 3).toUpperCase()}
              </span>
              {file.name}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <ArrowLeft size={13} /> Back
            </button>

            <button
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50">
              {downloading
                ? <Loader2 size={13} className="animate-spin" />
                : <Download size={13} />}
              {downloading ? 'Downloading…' : 'Download'}
            </button>

            {canEdit && (
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 cursor-pointer transition-colors disabled:opacity-50">
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6">
          <div className="flex gap-5 items-start">

            {/* ── Left: preview ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <FilePreview file={file} ext={ext} />

              {/* Description card */}
              {file.description && (
                <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                  <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{String(file.description)}</p>
                </div>
              )}
            </div>

            {/* ── Right: metadata sidebar ── */}
            <div className="w-[300px] shrink-0 flex flex-col gap-4">

              {/* File info card */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-[14px] font-semibold text-slate-800">File info</h2>
                </div>
                <div className="px-5 py-2">

                  <MetaRow icon={HardDrive} label="Size">
                    {formatBytes(Number(file.size_bytes ?? 0))}
                  </MetaRow>

                  <MetaRow icon={Tag} label="Type">
                    <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-semibold uppercase"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-slate-400 ml-1 text-[12px]">.{ext}</span>
                  </MetaRow>

                  <MetaRow icon={Calendar} label="Uploaded">
                    <span title={fmtDate(file.created_at, true)}>
                      {fmtDate(file.created_at)}
                    </span>
                  </MetaRow>

                  {folder && (
                    <MetaRow icon={FolderOpen} label="Folder">
                      <button
                        onClick={() => group && navigate(`/groups/${group.id}`)}
                        className="flex items-center gap-1.5 text-violet-600 hover:underline border-0 bg-transparent cursor-pointer p-0 text-[13px]">
                        {folder.icon ?? '📁'} {folder.name}
                        <ExternalLink size={10} className="text-slate-300" />
                      </button>
                    </MetaRow>
                  )}

                  {group && (
                    <MetaRow icon={FolderOpen} label="Cohort">
                      <button
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="flex items-center gap-1.5 text-violet-600 hover:underline border-0 bg-transparent cursor-pointer p-0 text-[13px]">
                        {group.icon ?? ''} {group.name}
                        <ExternalLink size={10} className="text-slate-300" />
                      </button>
                    </MetaRow>
                  )}

                </div>
              </div>

              {/* Uploader card */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-[14px] font-semibold text-slate-800">Uploaded by</h2>
                </div>
                <div className="px-5 py-4">
                  {uploader ? (
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={uploader.full_name ?? uploader.email ?? 'User'}
                        avatarUrl={uploader.avatar_url}
                        size={38}
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-700 truncate">
                          {uploader.full_name ?? 'Unknown user'}
                        </p>
                        {uploader.email && (
                          <p className="text-[11px] text-slate-400 truncate">{uploader.email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Users size={14} className="text-slate-300" />
                      </div>
                      <p className="text-[13px] text-slate-400">Unknown uploader</p>
                    </div>
                  )}
                </div>
              </div>

              {/* File ID (dev utility) */}
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">File ID</p>
                <p className="text-[11px] font-mono text-slate-400 break-all select-all">{file.id}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}