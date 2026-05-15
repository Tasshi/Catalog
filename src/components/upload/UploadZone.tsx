// import { useCallback, useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { CloudUpload, X } from 'lucide-react';
// import { getFileConfig, getFileExtension } from '../../lib/metadata';
// import { formatBytes } from '../../lib/storage';

// export default function UploadZone({ onFilesSelected, file, onClear }) {
//   const onDrop = useCallback(accepted => {
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

//   if (file) {
//     const ext = getFileExtension(file.name);
//     const cfg = getFileConfig(ext);
//     return (
//       <div className="rounded-xl p-8 flex flex-col items-center gap-4 relative"
//         style={{ background: 'var(--navy2)', border: '2px solid rgba(34,211,238,0.3)', minHeight: 260 }}>
//         <button onClick={onClear} className="absolute top-3 right-3 icon-btn"><X size={13} /></button>
//         <div className="w-20 h-24 rounded-xl flex items-center justify-center font-mono text-lg font-medium"
//           style={{ background: cfg.bg, color: cfg.color }}>
//           {cfg.label}
//         </div>
//         <div className="text-center">
//           <div className="font-serif text-lg" style={{ color: 'var(--text)' }}>{file.name}</div>
//           <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>{formatBytes(file.size)}</div>
//         </div>
//         <div className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)' }}>
//           ✓ Ready to upload
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       {...getRootProps()}
//       className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 text-center relative"
//       style={{
//         background: isDragActive ? 'rgba(34,211,238,0.04)' : 'var(--navy2)',
//         border: `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border2)'}`,
//         minHeight: 260,
//         padding: '48px 32px',
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
//           <span key={f} className="text-xs font-mono px-2 py-0.5 rounded"
//             style={{ background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text3)' }}>
//             {f}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, X } from 'lucide-react';
import { getFileConfig, getFileExtension } from '../../lib/metadata';
import { formatBytes } from '../../lib/storage';

interface UploadZoneProps {
  file:             File | null;
  onFilesSelected:  (file: File) => void;
  onClear:          () => void;
  /** Tag suggestions loaded from the DB by the parent */
  tagSuggestions?:  string[];
  /** Currently selected tags */
  selectedTags?:    string[];
  onTagsChange?:    (tags: string[]) => void;
}

export default function UploadZone({
  onFilesSelected,
  file,
  onClear,
  tagSuggestions = [],
  selectedTags   = [],
  onTagsChange,
}: UploadZoneProps) {

  const [tagInput, setTagInput] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFilesSelected(accepted[0]);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
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

  // ── Tag helpers ────────────────────────────────────────────────────────────

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || selectedTags.includes(t)) return;
    onTagsChange?.([...selectedTags, t]);
  }

  function removeTag(tag: string) {
    onTagsChange?.(selectedTags.filter(t => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }

  // Suggestions not already selected, filtered by current input
  const filteredSuggestions = tagSuggestions.filter(
    s => !selectedTags.includes(s) &&
         s.toLowerCase().includes(tagInput.toLowerCase()),
  );

  // ── File preview state ─────────────────────────────────────────────────────

  if (file) {
    const ext = getFileExtension(file.name);
    const cfg = getFileConfig(ext);
    return (
      <div
        className="rounded-xl p-8 flex flex-col items-center gap-4 relative"
        style={{ background: 'var(--navy2)', border: '2px solid rgba(34,211,238,0.3)', minHeight: 260 }}
      >
        <button onClick={onClear} className="absolute top-3 right-3 icon-btn">
          <X size={13} />
        </button>

        {/* File card */}
        <div
          className="w-20 h-24 rounded-xl flex items-center justify-center font-mono text-lg font-medium"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </div>
        <div className="text-center">
          <div className="font-serif text-lg" style={{ color: 'var(--text)' }}>{file.name}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>{formatBytes(file.size)}</div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs"
          style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)' }}
        >
          ✓ Ready to upload
        </div>

        {/* ── Inline tag picker ── */}
        <div className="w-full mt-2">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>Tags</div>

          {/* Input + selected chips */}
          <div
            className="flex flex-wrap gap-1.5 rounded-lg px-2 py-1.5 min-h-[38px]"
            style={{ background: 'var(--navy3)', border: '1px solid var(--border2)' }}
          >
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.25)' }}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="opacity-60 hover:opacity-100 leading-none"
                  style={{ fontSize: 11 }}
                >×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={selectedTags.length ? '' : 'Add tag, press Enter…'}
              className="flex-1 min-w-[100px] bg-transparent outline-none text-xs"
              style={{ color: 'var(--text)', caretColor: 'var(--cyan)' }}
            />
          </div>

          {/* DB tag suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                  style={{
                    background: 'var(--navy3)',
                    color: 'var(--text3)',
                    border: '1px solid var(--border2)',
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Drop zone ──────────────────────────────────────────────────────────────

  return (
    <div
      {...getRootProps()}
      className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 text-center relative"
      style={{
        background:  isDragActive ? 'rgba(34,211,238,0.04)' : 'var(--navy2)',
        border:      `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border2)'}`,
        minHeight:   260,
        padding:     '48px 32px',
      }}
    >
      <input {...getInputProps()} />
      <CloudUpload
        size={48}
        style={{ color: isDragActive ? 'var(--cyan)' : 'var(--text3)', opacity: 0.6 }}
      />
      <div>
        <div className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>
          {isDragActive ? 'Drop it here!' : 'Drop your file here'}
        </div>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
          or <span style={{ color: 'var(--cyan)' }}>click to browse</span> your files
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