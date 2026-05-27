import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getFileExtension, getFileConfig } from '../lib/metadata';
import { formatBytes } from '../lib/storage';
import Layout from '../components/layout/Layout';
import {
  ArrowLeft,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  HardDrive,
  Tag,
  FolderOpen,
  Users,
  Loader2,
  AlertTriangle,
  ExternalLink,
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
    return new Date(iso).toLocaleDateString(
      'en-GB',
      long
        ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: 'numeric', month: 'short', year: 'numeric' },
    );
  } catch {
    return '—';
  }
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function hashColor(str: string) {
  const palette = ['#5B8DEF', '#4CAF7D', '#F5C842', '#E07B54', '#A78BFA', '#F472B6', '#34D399'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 36,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const color = hashColor(name);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

// ─── FilePreview ──────────────────────────────────────────────────────────────

function FilePreview({ file, ext }: { file: FileRecord; ext: string }) {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf = ext === 'pdf';
  const isOffice = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);
  const isText = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext);
  const canPreview = isImage || isPdf || isOffice || isText;

  const rawPath = (file.storage_path ?? file.path) as string | undefined;
  const storagePath = rawPath?.startsWith('filevault/')
    ? rawPath.slice('filevault/'.length)
    : rawPath;

  const [url, setUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(!!storagePath && canPreview);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!storagePath || !canPreview) return;

    (async () => {
      try {
        const { data, error: e } = await supabase.storage
          .from('filevault')
          .createSignedUrl(storagePath, 3600);
        if (e || !data) throw new Error(e?.message ?? 'Signed URL failed');
        const signed = data.signedUrl;
        setContentLoading(true);
        if (isOffice) {
          setUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(signed)}&embedded=true`);
        } else {
          setUrl(signed);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setUrlLoading(false);
      }
    })();
  }, [storagePath, canPreview, isOffice]);

  const cfg = getFileConfig(ext);

  if (!visible) {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <button
          onClick={() => setVisible(true)}
          className="flex cursor-pointer items-center gap-2 border-0 bg-transparent text-xs text-slate-500 hover:text-violet-600"
        >
          <Eye size={13} /> Show preview
        </button>
      </div>
    );
  }

  if (!canPreview) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-12">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label.slice(0, 3).toUpperCase()}
        </div>
        <p className="text-[13px] text-slate-400">No preview available for .{ext} files</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Preview
          </span>
          {contentLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Loader2 size={11} className="animate-spin" />
              <span>{isOffice ? 'Loading via Google Docs…' : 'Loading…'}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setVisible(false)}
          className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[11px] text-slate-400 hover:text-slate-600"
        >
          <EyeOff size={11} /> Hide
        </button>
      </div>

      <div className="flex items-center justify-center" style={{ minHeight: 320, maxHeight: 600 }}>
        {urlLoading && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[12px]">Preparing preview…</span>
          </div>
        )}
        {!urlLoading && error && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertTriangle size={22} className="text-amber-400" />
            <p className="max-w-xs text-[12px] text-slate-500">Preview unavailable: {error}</p>
          </div>
        )}
        {!urlLoading && !error && url && isImage && (
          <img
            src={url}
            alt={file.name}
            className="max-h-full max-w-full rounded object-contain p-4"
            style={{ maxHeight: 560 }}
            onLoad={() => setContentLoading(false)}
          />
        )}
        {!urlLoading && !error && url && (isPdf || isOffice) && (
          <div className="relative w-full" style={{ height: 560 }}>
            {contentLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50">
                <Loader2 size={22} className="animate-spin text-slate-400" />
                <span className="text-[12px] text-slate-400">
                  {isOffice
                    ? 'Loading document via Google Docs… this may take a moment'
                    : 'Loading PDF…'}
                </span>
              </div>
            )}
            <iframe
              src={url}
              title={file.name}
              className="h-full w-full border-none"
              onLoad={() => setContentLoading(false)}
            />
          </div>
        )}
        {!urlLoading && !error && url && isText && (
          <div className="relative w-full" style={{ height: 400 }}>
            {contentLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
                <Loader2 size={18} className="animate-spin text-slate-400" />
              </div>
            )}
            <iframe
              src={url}
              title={file.name}
              className="h-full w-full border-none bg-white"
              onLoad={() => setContentLoading(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-50 py-3 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        <div className="text-[13px] text-slate-700">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FileDetail() {
  const { fileId, id } = useParams<{ fileId?: string; id?: string }>();
  const resolvedId = fileId ?? id; // works with both /files/:fileId and /files/:id
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [file, setFile] = useState<FileRecord | null>(null);
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [uploader, setUploader] = useState<UploaderInfo | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    return () => {
      cancelled = true;
    };
  }, [resolvedId]);

  // ── Download ───────────────────────────────────────────────────────────────
  async function handleDownload() {
    if (!file) return;
    const rawDlPath = (file.storage_path ?? file.path) as string | undefined;
    const storagePath = rawDlPath?.startsWith('filevault/')
      ? rawDlPath.slice('filevault/'.length)
      : rawDlPath;
    if (!storagePath) return;
    setDownloading(true);
    try {
      const { data, error: e } = await supabase.storage.from('filevault').download(storagePath);
      if (e || !data) throw new Error(e?.message ?? 'Download failed');
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
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
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <Loader2 size={20} className="animate-spin text-slate-300" />
        </div>
      </Layout>
    );
  }

  if (error || !file) {
    return (
      <Layout>
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="mb-3 text-sm text-slate-500">{error ?? 'File not found.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="cursor-pointer border-0 bg-transparent text-sm text-violet-600 hover:underline"
            >
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            {/* Breadcrumb */}
            <nav className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <button
                onClick={() => navigate('/groups')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[11px] hover:text-violet-600"
              >
                Root
              </button>
              {group && (
                <>
                  <span className="text-slate-300">/</span>
                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="cursor-pointer border-0 bg-transparent p-0 text-[11px] hover:text-violet-600"
                  >
                    {group.icon ? `${group.icon} ` : ''}
                    {group.name}
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
                  <span className="text-slate-500">
                    {folder.icon ?? '📁'} {folder.name}
                  </span>
                </>
              )}
              <span className="text-slate-300">/</span>
              <span className="max-w-[200px] truncate font-medium text-slate-700">{file.name}</span>
            </nav>

            <h1 className="flex max-w-xl items-center gap-2 truncate text-[16px] font-semibold text-slate-900">
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label.slice(0, 3).toUpperCase()}
              </span>
              {file.name}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <button
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {downloading ? 'Downloading…' : 'Download'}
            </button>

            {canEdit && (
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* ── Left: preview ── */}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <FilePreview file={file} ext={ext} />

              {/* Description card */}
              {file.description && (
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                  <h3 className="mb-2 text-[12px] font-semibold tracking-wider text-slate-400 uppercase">
                    Description
                  </h3>
                  <p className="text-[13px] leading-relaxed text-slate-700">
                    {String(file.description)}
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: metadata sidebar ── */}
            <div className="flex w-[300px] shrink-0 flex-col gap-4">
              {/* File info card */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-[14px] font-semibold text-slate-800">File info</h2>
                </div>
                <div className="px-5 py-2">
                  <MetaRow icon={HardDrive} label="Size">
                    {formatBytes(Number(file.size_bytes ?? 0))}
                  </MetaRow>

                  <MetaRow icon={Tag} label="Type">
                    <span
                      className="inline-flex h-5 items-center rounded px-2 text-[10px] font-semibold uppercase"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="ml-1 text-[12px] text-slate-400">.{ext}</span>
                  </MetaRow>

                  <MetaRow icon={Calendar} label="Uploaded">
                    <span title={fmtDate(file.created_at, true)}>{fmtDate(file.created_at)}</span>
                  </MetaRow>

                  {folder && (
                    <MetaRow icon={FolderOpen} label="Folder">
                      <button
                        onClick={() => group && navigate(`/groups/${group.id}`)}
                        className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-violet-600 hover:underline"
                      >
                        {folder.icon ?? '📁'} {folder.name}
                        <ExternalLink size={10} className="text-slate-300" />
                      </button>
                    </MetaRow>
                  )}

                  {group && (
                    <MetaRow icon={FolderOpen} label="Cohort">
                      <button
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-violet-600 hover:underline"
                      >
                        {group.icon ?? ''} {group.name}
                        <ExternalLink size={10} className="text-slate-300" />
                      </button>
                    </MetaRow>
                  )}
                </div>
              </div>

              {/* Uploader card */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
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
                        <p className="truncate text-[13px] font-medium text-slate-700">
                          {uploader.full_name ?? 'Unknown user'}
                        </p>
                        {uploader.email && (
                          <p className="truncate text-[11px] text-slate-400">{uploader.email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
                        <Users size={14} className="text-slate-300" />
                      </div>
                      <p className="text-[13px] text-slate-400">Unknown uploader</p>
                    </div>
                  )}
                </div>
              </div>

              {/* File ID (dev utility) */}
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  File ID
                </p>
                <p className="font-mono text-[11px] break-all text-slate-400 select-all">
                  {file.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
