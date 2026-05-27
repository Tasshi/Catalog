import { useFiles } from '../hooks/useFiles';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { FileRow } from '../components/catalog/FileCard';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from '../lib/storage';
import { useApp } from '../contexts/AppContext';
import { getFileExtension, getFileConfig } from '../lib/metadata';
import { formatBytes } from '../lib/storage';
import {
  FolderOpen,
  Users,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PdfViewer } from '../components/shared/PdfViewer';
import type { FileItem } from '../components/layout/ui/cons';

const PAGE_SIZE = 8;

// ─── Inline file preview modal ────────────────────────────────────────────────

function FilePreviewModal({
  file,
  onClose,
  onDownload,
}: {
  file: FileItem;
  onClose: () => void;
  onDownload: (f: FileItem) => void;
}) {
  const ext = file.ext || getFileExtension(file.name) || '';
  const cfg = getFileConfig(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf = ext === 'pdf';
  const isOffice = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);
  const isText = ['txt', 'md', 'csv', 'json', 'xml'].includes(ext);
  const canPreview = isImage || isPdf || isOffice || isText;

  const rawPath = file.storage_path as string | undefined;
  const storagePath = rawPath?.startsWith('filevault/')
    ? rawPath.slice('filevault/'.length)
    : rawPath;

  const [url, setUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(!!storagePath && canPreview);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!storagePath || !canPreview) return;
    (async () => {
      try {
        setContentLoading(true);
        if (isPdf) {
          const { data: blob, error: dlErr } = await supabase.storage
            .from('filevault')
            .download(storagePath);
          if (dlErr || !blob) throw new Error(dlErr?.message ?? 'Download failed');
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setUrl(blobUrl);
        } else {
          const { data, error: e } = await supabase.storage
            .from('filevault')
            .createSignedUrl(storagePath, 3600);
          if (e || !data) throw new Error(e?.message ?? 'Signed URL failed');
          const signed = data.signedUrl;
          if (isOffice) {
            setUrl(
              `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signed)}`,
            );
          } else {
            setUrl(signed);
          }
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setUrlLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePath]);

  // Close on backdrop click or Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isLoading = urlLoading || contentLoading;
  const loadingMsg = urlLoading
    ? 'Preparing preview…'
    : isOffice
      ? 'Loading document… (this may take a moment)'
      : 'Loading preview…';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxWidth: 860, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-slate-800">{file.name}</p>
            <p className="text-[11px] text-slate-400">
              {formatBytes(Number(file.size_bytes ?? 0))}
            </p>
          </div>
          {isLoading && (
            <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              <span>{loadingMsg}</span>
            </div>
          )}
          <button
            onClick={() => onDownload(file)}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-slate-100 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Download size={13} /> Download
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview body */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-4"
          style={{ minHeight: 300 }}
        >
          {urlLoading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-[12px]">Preparing preview…</span>
            </div>
          )}
          {!urlLoading && error && (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <AlertTriangle size={22} className="text-amber-400" />
              <p className="text-[13px] font-medium text-slate-700">Preview unavailable</p>
              <p className="max-w-xs text-[12px] text-slate-400">
                Storage access was denied for this file. Ask your Supabase admin to allow
                authenticated users to read from the{' '}
                <span className="rounded bg-slate-100 px-1 font-mono">filevault</span> bucket, or
                download the file to view it.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#054159] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0a2f45]"
              >
                <Download size={13} /> Download to view
              </button>
            </div>
          )}
          {!urlLoading && !error && !canPreview && (
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label.slice(0, 3).toUpperCase()}
              </div>
              <p className="text-[13px] text-slate-400">No preview available for .{ext} files</p>
            </div>
          )}
          {!urlLoading && !error && url && isImage && (
            <img
              src={url}
              alt={file.name}
              className="max-h-full max-w-full rounded-lg object-contain"
              style={{ maxHeight: 560 }}
              onLoad={() => setContentLoading(false)}
            />
          )}
          {!urlLoading && !error && url && isPdf && <PdfViewer url={url} height={520} />}
          {!urlLoading && !error && url && isOffice && (
            <div className="relative w-full" style={{ height: 520 }}>
              {contentLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-50">
                  <Loader2 size={22} className="animate-spin text-slate-400" />
                  <span className="text-[12px] text-slate-400">
                    Loading document via Google Docs… this may take a moment
                  </span>
                </div>
              )}
              <iframe
                src={url}
                title={file.name}
                className="h-full w-full rounded-lg border-none"
                onLoad={() => setContentLoading(false)}
              />
            </div>
          )}
          {!urlLoading && !error && url && isText && (
            <div className="relative w-full" style={{ height: 400 }}>
              {contentLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-50">
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                </div>
              )}
              <iframe
                src={url}
                title={file.name}
                className="h-full w-full rounded-lg border-none bg-white"
                onLoad={() => setContentLoading(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  num: string | number;
  label: string;
  sub?: string | null;
  icon: React.ReactNode;
  accentClass?: string;
}

function StatCard({ num, label, sub, icon, accentClass = 'bg-slate-200' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#D4DEE9] bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
      <div className={`absolute inset-x-0 top-0 h-[2px] ${accentClass}`} />
      <div className="mt-1 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[28px] leading-none font-medium text-[#061B31]">{num}</div>
          <div className="text-[11px] font-medium tracking-wider text-[#64748D] uppercase">
            {label}
          </div>
          {sub && <div className="mt-1 text-[11px] font-medium text-emerald-600">{sub}</div>}
        </div>
        <div className="mt-0.5 text-[#B8CCDB]">{icon}</div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuth();
  const { files, loading, deleteFile } = useFiles();
  const { groups } = useGroups();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [subprojectCount, setSubprojectCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    if (!groups.length) return;
    const groupIds = groups.map((g) => g.id);
    supabase
      .from('subprojects')
      .select('id', { count: 'exact', head: true })
      .in('group_id', groupIds)
      .then(({ count }) => {
        if (count != null) setSubprojectCount(count);
      });
  }, [groups]);

  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const recent = files.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const now = new Date();
  const thisMonthCount = files.filter((f) => {
    if (!f.created_at) return false;
    const d = new Date(f.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  async function handleDownload(file: FileItem) {
    try {
      await downloadFile(file.storage_path, file.name);
      showToast(`Downloading ${file.name}`);
    } catch {
      showToast('Download failed', 'error');
    }
  }

  async function handleDelete(file: FileItem) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await deleteFile(file.id);
    showToast(`"${file.name}" deleted`);
  }

  // Normalize FileRecord to FileItem (null → undefined for groupName)
  const recentItems: FileItem[] = recent.map((f) => ({
    ...f,
    groupName: f.groupName ?? undefined, // ✅ null → undefined
  }));

  return (
    <Layout>
      <Header title={`Welcome back${firstName ? ', ' + firstName : ''} 👋`} />

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {/* ── Stat cards ── */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard
            num={files.length}
            label="Total files"
            sub={thisMonthCount > 0 ? `+${thisMonthCount} this month` : null}
            icon={<FolderOpen size={20} strokeWidth={1.5} />}
            accentClass="bg-sky-400"
          />
          <StatCard
            num={groups.length}
            label="Cohort"
            icon={<Users size={20} strokeWidth={1.5} />}
            accentClass="bg-violet-400"
          />
          <StatCard
            num={subprojectCount}
            label="Projects"
            sub={subprojectCount > 0 ? 'total created' : null}
            icon={<Layers size={20} strokeWidth={1.5} />}
            accentClass="bg-amber-400"
          />
        </div>

        {/* ── Recent files ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-[#273951]">Recent files</h2>
            <button
              className="text-[12px] text-sky-600 transition-colors hover:text-sky-700"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/catalog')}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-[13px] text-[#64748D]">Loading…</div>
          ) : recentItems.length === 0 ? (
            <div className="rounded-lg border border-[#D4DEE9] bg-white py-14 text-center">
              <div className="mb-3 text-4xl opacity-20">📂</div>
              <div className="mb-4 text-[13px] text-[#64748D]">No files yet</div>
              <button
                className="rounded-md bg-[#061B31] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#0f2d4a]"
                onClick={() => navigate('/upload')}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#D4DEE9] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#D4DEE9] bg-slate-50">
                    {['File', 'Type', 'Group', 'Owner', 'Date', 'Action'].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider text-[#64748D] uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((f) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      onView={(f) => setPreviewFile(f)}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  ))}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              <div className="flex items-center justify-between border-t border-[#D4DEE9] bg-slate-50 px-4 py-2.5">
                <span className="text-[11px] text-[#64748D]">
                  {files.length === 0
                    ? '0 files'
                    : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, files.length)} of ${files.length} files`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#D4DEE9] bg-white text-[#64748D] transition-colors hover:border-[#054159] hover:bg-[#054159] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border text-[12px] font-medium transition-colors ${
                        p === safePage
                          ? 'border-[#054159] bg-[#054159] text-white'
                          : 'border-[#D4DEE9] bg-white text-[#64748D] hover:border-[#054159] hover:bg-[#054159] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#D4DEE9] bg-white text-[#64748D] transition-colors hover:border-[#054159] hover:bg-[#054159] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
