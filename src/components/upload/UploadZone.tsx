import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, X, FileText, AlertTriangle } from 'lucide-react';
import { getFileConfig, getFileExtension } from '../../lib/metadata';
import { formatBytes } from '../../lib/storage';

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

interface UploadZoneProps {
  files:           File[];
  onFilesSelected: (files: File[]) => void;
  onRemove:        (index: number) => void;
  onClear:         () => void;
}

export default function UploadZone({ files, onFilesSelected, onRemove, onClear }: UploadZoneProps) {
  const [oversized, setOversized] = useState<{ name: string; size: number }[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) onFilesSelected(accepted);
  }, [onFilesSelected]);

  const onDropRejected = useCallback((rejected: import('react-dropzone').FileRejection[]) => {
    const tooBig = rejected
      .filter(r => r.errors.some(e => e.code === 'file-too-large'))
      .map(r => ({ name: r.file.name, size: r.file.size }));
    if (tooBig.length) setOversized(tooBig);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: true,
    maxSize: MAX_SIZE,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt', '.md', '.csv'],
    },
  });

  const FORMATS = ['.PDF', '.DOCX', '.XLSX', '.PPTX', '.ZIP', '.PNG', '.JPG', '.CSV', '.TXT'];

  // ── File list preview ──────────────────────────────────────────────────────

  if (files.length > 0) {
    return (
      <div
        className="rounded-xl flex flex-col gap-3 relative"
        style={{ background: 'var(--navy2)', border: '2px solid rgba(34,211,238,0.3)', padding: '20px 24px', minHeight: 260 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            {/* Add more files */}
            <div {...getRootProps()} onClick={e => e.stopPropagation()}>
              <input {...getInputProps()} />
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.25)' }}
              >
                + Add more
              </button>
            </div>
            {/* Clear all */}
            <button
              onClick={onClear}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              Clear all
            </button>
          </div>
        </div>

        {/* File list */}
        <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 380 }}>
          {files.map((file, idx) => {
            const ext = getFileExtension(file.name);
            const cfg = getFileConfig(ext);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'var(--navy3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* File type badge */}
                <div
                  className="w-9 h-10 rounded flex items-center justify-center font-mono font-medium flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.color, fontSize: 8, letterSpacing: '0.05em' }}
                >
                  {cfg.label}
                </div>

                {/* Name + size */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text)' }}>{file.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{formatBytes(file.size)}</div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemove(idx)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors"
                  style={{ color: 'var(--text3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Drop more hint */}
        <div
          {...getRootProps()}
          className="rounded-lg flex items-center justify-center gap-2 mt-1 cursor-pointer transition-all"
          style={{
            border: `1.5px dashed ${isDragActive ? 'var(--cyan)' : 'rgba(255,255,255,0.12)'}`,
            background: isDragActive ? 'rgba(34,211,238,0.04)' : 'transparent',
            padding: '10px',
          }}
        >
          <input {...getInputProps()} />
          <FileText size={14} style={{ color: 'var(--text3)' }} />
          <span className="text-xs" style={{ color: 'var(--text3)' }}>
            {isDragActive ? 'Drop to add' : 'Drop more files here'}
          </span>
        </div>

        {/* Oversized file popup (file-list view) */}
        {oversized.length > 0 && <OversizedModal files={oversized} onClose={() => setOversized([])} />}
      </div>
    );
  }

  // ── Empty drop zone ────────────────────────────────────────────────────────

  return (
    <div
      {...getRootProps()}
      className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 text-center relative"
      style={{
        background: isDragActive ? 'rgba(34,211,238,0.04)' : 'var(--navy2)',
        border:     `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border2)'}`,
        minHeight:  260,
        padding:    '48px 32px',
      }}
    >
      <input {...getInputProps()} />
      <CloudUpload size={48} style={{ color: isDragActive ? 'var(--cyan)' : 'var(--text3)', opacity: 0.6 }} />
      <div>
        <div className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>
          {isDragActive ? 'Drop them here!' : 'Drop your files here'}
        </div>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
          or <span style={{ color: 'var(--cyan)' }}>click to browse</span> — select multiple at once
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center mt-1">
        {FORMATS.map(f => (
          <span
            key={f}
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text3)' }}
          >
            {f}
          </span>
        ))}
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text3)', opacity: 0.7 }}>
        Max file size: <strong style={{ color: 'var(--text)' }}>4 MB</strong>
      </p>

      {/* Oversized file popup */}
      {oversized.length > 0 && <OversizedModal files={oversized} onClose={() => setOversized([])} />}
    </div>
  );
}

// ── Oversized popup ────────────────────────────────────────────────────────────

function OversizedModal({ files, onClose }: { files: { name: string; size: number }[]; onClose: () => void }) {
  return (
    <>
      <style>{`@keyframes szPop { from { transform: translate(-50%,-50%) scale(0.94); opacity: 0; } to { transform: translate(-50%,-50%) scale(1); opacity: 1; } }`}</style>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="fixed z-[90] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 400,
          animation: 'szPop 0.18s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">File too large</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Maximum allowed size is 4 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 border-0 cursor-pointer shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        {/* File list */}
        <div className="px-6 pb-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {files.map(f => (
            <div
              key={f.name}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <span className="text-[13px] font-medium text-slate-700 truncate">{f.name}</span>
              <span className="text-[11px] font-semibold text-red-500 shrink-0 tabular-nums">
                {formatBytes(f.size)}
              </span>
            </div>
          ))}
        </div>

        {/* Message + action */}
        <div className="px-6 py-5">
          <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
            Please upload files under <strong className="text-slate-700">4 MB</strong>. Compress or resize the file and try again.
          </p>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 border-0 cursor-pointer transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}