// import { useCallback } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { CloudUpload, X } from 'lucide-react';
// import { getFileConfig, getFileExtension } from '../../lib/metadata';
// import { formatBytes } from '../../lib/storage';

// interface UploadZoneProps {
//   file:            File | null;
//   onFilesSelected: (file: File) => void;
//   onClear:         () => void;
// }

// export default function UploadZone({ onFilesSelected, file, onClear }: UploadZoneProps) {

//   const onDrop = useCallback((accepted: File[]) => {
//     if (accepted[0]) onFilesSelected(accepted[0]);
//   }, [onFilesSelected]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     multiple: false,
//     accept: {
//       'application/pdf': ['.pdf'],
//       'application/msword': ['.doc'],
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
//       'application/vnd.ms-excel': ['.xls'],
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
//       'application/vnd.ms-powerpoint': ['.ppt'],
//       'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
//       'application/zip': ['.zip'],
//       'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
//       'text/*': ['.txt', '.md', '.csv'],
//     },
//   });

//   const FORMATS = ['.PDF', '.DOCX', '.XLSX', '.PPTX', '.ZIP', '.PNG', '.JPG', '.CSV', '.TXT'];

//   // ── File preview ───────────────────────────────────────────────────────────

//   if (file) {
//     const ext = getFileExtension(file.name);
//     const cfg = getFileConfig(ext);
//     return (
//       <div
//         className="rounded-xl p-8 flex flex-col items-center gap-4 relative"
//         style={{ background: 'var(--navy2)', border: '2px solid rgba(34,211,238,0.3)', minHeight: 260 }}
//       >
//         <button onClick={onClear} className="absolute top-3 right-3 icon-btn">
//           <X size={13} />
//         </button>

//         <div
//           className="w-20 h-24 rounded-xl flex items-center justify-center font-mono text-lg font-medium"
//           style={{ background: cfg.bg, color: cfg.color }}
//         >
//           {cfg.label}
//         </div>

//         <div className="text-center">
//           <div className="font-serif text-lg" style={{ color: 'var(--text)' }}>{file.name}</div>
//           <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>{formatBytes(file.size)}</div>
//         </div>

//         <div
//           className="px-3 py-1 rounded-full text-xs"
//           style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)' }}
//         >
//           ✓ Ready to upload
//         </div>
//       </div>
//     );
//   }

//   // ── Drop zone ──────────────────────────────────────────────────────────────

//   return (
//     <div
//       {...getRootProps()}
//       className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 text-center relative"
//       style={{
//         background: isDragActive ? 'rgba(34,211,238,0.04)' : 'var(--navy2)',
//         border:     `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border2)'}`,
//         minHeight:  260,
//         padding:    '48px 32px',
//       }}
//     >
//       <input {...getInputProps()} />
//       <CloudUpload size={48} style={{ color: isDragActive ? 'var(--cyan)' : 'var(--text3)', opacity: 0.6 }} />
//       <div>
//         <div className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>
//           {isDragActive ? 'Drop it here!' : 'Drop your file here'}
//         </div>
//         <div className="text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
//           or <span style={{ color: 'var(--cyan)' }}>click to browse</span> your files
//         </div>
//       </div>
//       <div className="flex gap-1.5 flex-wrap justify-center mt-1">
//         {FORMATS.map(f => (
//           <span
//             key={f}
//             className="text-xs font-mono px-2 py-0.5 rounded"
//             style={{ background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text3)' }}
//           >
//             {f}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, X, FileText } from 'lucide-react';
import { getFileConfig, getFileExtension } from '../../lib/metadata';
import { formatBytes } from '../../lib/storage';

interface UploadZoneProps {
  files:           File[];
  onFilesSelected: (files: File[]) => void;
  onRemove:        (index: number) => void;
  onClear:         () => void;
}

export default function UploadZone({ files, onFilesSelected, onRemove, onClear }: UploadZoneProps) {

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) onFilesSelected(accepted);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
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
    </div>
  );
}