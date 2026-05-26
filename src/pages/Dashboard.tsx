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
import { FolderOpen, Users, Layers, ChevronLeft, ChevronRight, X, Download, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { FileItem } from '../components/layout/ui/cons';

const PAGE_SIZE = 8;

// ─── Inline file preview modal ────────────────────────────────────────────────

function FilePreviewModal({ file, onClose, onDownload }: {
  file: FileItem;
  onClose: () => void;
  onDownload: (f: FileItem) => void;
}) {
  const [url,           setUrl]           = useState<string | null>(null);
  const [urlLoading,    setUrlLoading]    = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const ext        = file.ext || getFileExtension(file.name) || '';
  const cfg        = getFileConfig(ext);
  const isImage    = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf      = ext === 'pdf';
  const isOffice   = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);
  const isText     = ['txt', 'md', 'csv', 'json', 'xml'].includes(ext);
  const canPreview = isImage || isPdf || isOffice || isText;

  const rawPath     = file.storage_path as string | undefined;
  const storagePath = rawPath?.startsWith('filevault/') ? rawPath.slice('filevault/'.length) : rawPath;

  useEffect(() => {
    if (!storagePath || !canPreview) { setUrlLoading(false); return; }
    (async () => {
      try {
        const { data, error: e } = await supabase.storage.from('filevault').createSignedUrl(storagePath, 3600);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePath]);

  // Close on backdrop click or Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 860, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-[11px] text-slate-400">{formatBytes(Number(file.size_bytes ?? 0))}</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
              <Loader2 size={12} className="animate-spin" />
              <span>{loadingMsg}</span>
            </div>
          )}
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer transition-colors shrink-0"
          >
            <Download size={13} /> Download
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 border-0 bg-transparent cursor-pointer transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4 relative" style={{ minHeight: 300 }}>
          {urlLoading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-[12px]">Preparing preview…</span>
            </div>
          )}
          {!urlLoading && error && (
            <div className="flex flex-col items-center gap-3 text-center px-6 py-10">
              <AlertTriangle size={22} className="text-amber-400" />
              <p className="text-[13px] font-medium text-slate-700">Preview unavailable</p>
              <p className="text-[12px] text-slate-400 max-w-xs">
                Storage access was denied for this file. Ask your Supabase admin to allow authenticated users to read from the <span className="font-mono bg-slate-100 px-1 rounded">filevault</span> bucket, or download the file to view it.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-1 flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold text-white bg-[#054159] hover:bg-[#0a2f45] border-0 cursor-pointer transition-colors"
              >
                <Download size={13} /> Download to view
              </button>
            </div>
          )}
          {!urlLoading && !error && !canPreview && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label.slice(0, 3).toUpperCase()}
              </div>
              <p className="text-[13px] text-slate-400">No preview available for .{ext} files</p>
            </div>
          )}
          {!urlLoading && !error && url && isImage && (
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: 560 }}
              onLoad={() => setContentLoading(false)}
            />
          )}
          {!urlLoading && !error && url && (isPdf || isOffice) && (
            <div className="relative w-full" style={{ height: 520 }}>
              {contentLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 z-10 rounded-lg">
                  <Loader2 size={22} className="animate-spin text-slate-400" />
                  <span className="text-[12px] text-slate-400">
                    {isOffice ? 'Loading document via Google Docs… this may take a moment' : 'Loading PDF…'}
                  </span>
                </div>
              )}
              <iframe
                src={url}
                title={file.name}
                className="w-full h-full border-none rounded-lg"
                onLoad={() => setContentLoading(false)}
              />
            </div>
          )}
          {!urlLoading && !error && url && isText && (
            <div className="relative w-full" style={{ height: 400 }}>
              {contentLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 rounded-lg">
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                </div>
              )}
              <iframe
                src={url}
                title={file.name}
                className="w-full h-full border-none bg-white rounded-lg"
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
    <div className="bg-white border border-[#D4DEE9] rounded-lg p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[2px] ${accentClass}`} />
      <div className="flex items-start justify-between mt-1">
        <div>
          <div className="text-[28px] font-medium text-[#061B31] leading-none mb-1">
            {num}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#64748D] font-medium">
            {label}
          </div>
          {sub && (
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">{sub}</div>
          )}
        </div>
        <div className="text-[#B8CCDB] mt-0.5">{icon}</div>
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
    const groupIds = groups.map(g => g.id);
    supabase
      .from('subprojects')
      .select('id', { count: 'exact', head: true })
      .in('group_id', groupIds)
      .then(({ count }) => { if (count != null) setSubprojectCount(count); });
  }, [groups]);

  const firstName  = profile?.full_name?.split(' ')[0] ?? null;
  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const recent     = files.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
  const recentItems: FileItem[] = recent.map(f => ({
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

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            num={files.length}
            label="Total files"
            sub={files.length > 0 ? `+${Math.min(files.length, 3)} this month` : null}
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[#273951]">Recent files</h2>
            <button
              className="text-[12px] text-sky-600 hover:text-sky-700 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/catalog')}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="text-[13px] py-10 text-center text-[#64748D]">Loading…</div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-14 rounded-lg bg-white border border-[#D4DEE9]">
              <div className="text-4xl mb-3 opacity-20">📂</div>
              <div className="text-[13px] text-[#64748D] mb-4">No files yet</div>
              <button
                className="text-[13px] px-4 py-2 rounded-md bg-[#061B31] text-white hover:bg-[#0f2d4a] transition-colors"
                onClick={() => navigate('/upload')}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-[#D4DEE9] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#D4DEE9]">
                    {['File', 'Type', 'Group', 'Owner', 'Date', 'Action'].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 text-[#64748D]"
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
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#D4DEE9] bg-slate-50">
                <span className="text-[11px] text-[#64748D]">
                  {files.length === 0 ? '0 files' : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, files.length)} of ${files.length} files`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-[#D4DEE9] bg-white text-[#64748D] hover:bg-[#054159] hover:text-white hover:border-[#054159] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                        p === safePage
                          ? 'bg-[#054159] text-white border-[#054159]'
                          : 'bg-white text-[#64748D] border-[#D4DEE9] hover:bg-[#054159] hover:text-white hover:border-[#054159]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-[#D4DEE9] bg-white text-[#64748D] hover:bg-[#054159] hover:text-white hover:border-[#054159] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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