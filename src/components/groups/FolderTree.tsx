// import { useState, useRef, useMemo, useEffect } from 'react';
// import { format } from 'date-fns';
// import JSZip from 'jszip';
// import type { FolderRecord } from '../../types/folder';
// import type { FileRecord, Group } from '../../components/layout/ui/cons';
// import { EXT_COLOR,EXT_ICON, PALETTES } from '@/constant/fileIcons';
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../contexts/AuthContext';

// // ── Membership check ──────────────────────────────────────────────────────────

// function useIsMember(groupId: string) {
//   const { user } = useAuth();
//   const [isMember, setIsMember] = useState(false);

//   useEffect(() => {
//     if (!user || !groupId) return;
//     supabase
//       .from('group_members')
//       .select('id')
//       .eq('group_id', groupId)
//       .eq('user_id', user.id)
//       .maybeSingle()
//       .then(({ data }) => setIsMember(!!data));
//   }, [groupId, user]);

//   return isMember;
// }

// // ── Palette ───────────────────────────────────────────────────────────────────

// function getPalette(id: string) {
//   let h = 0;
//   for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
//   return PALETTES[h % PALETTES.length];
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function findFolder(nodes: FolderRecord[], id: string): FolderRecord | null {
//   for (const n of nodes) {
//     if (n.id === id) return n;
//     const found = findFolder(n.children, id);
//     if (found) return found;
//   }
//   return null;
// }

// function extOf(file: FileRecord) { return (file.ext ?? 'other').toLowerCase(); }

// function fmtDate(iso: string | null | undefined) {
//   if (!iso) return '—';
//   try { return format(new Date(iso), 'MMM d, yyyy'); } catch { return '—'; }
// }

// function fmtBytes(bytes: number) {
//   if (bytes === 0) return '0 B';
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
// }

// const IcoUpload = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
//     <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
//   </svg>
// );
// const IcoDownload = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
//     <polyline points="7 10 12 15 17 10"/>
//     <line x1="12" y1="15" x2="12" y2="3"/>
//   </svg>
// );
// const IcoChevronRight = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="9 18 15 12 9 6"/>
//   </svg>
// );
// const IcoTrash = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
//   </svg>
// );
// const IcoPencil = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
//     <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
//   </svg>
// );
// const IcoMove = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/>
//     <polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
//     <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
//   </svg>
// );
// const IcoEye = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//     <circle cx="12" cy="12" r="3"/>
//   </svg>
// );
// const IcoExport = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
//     <polyline points="17 8 12 3 7 8"/>
//     <line x1="12" y1="3" x2="12" y2="15"/>
//   </svg>
// );

// const iconBtn: React.CSSProperties = {
//   width: 20, height: 20, borderRadius: 4, border: 'none',
//   display: 'flex', alignItems: 'center', justifyContent: 'center',
//   cursor: 'pointer', padding: 0,
// };
// const toolbarBtn: React.CSSProperties = {
//   display: 'flex', alignItems: 'center', gap: 6,
//   fontSize: 13, fontWeight: 500,
//   padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
// };

// // ── FilePreviewModal ──────────────────────────────────────────────────────────

// interface FilePreviewModalProps {
//   file: FileRecord;
//   onClose: () => void;
// }

// function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
//   const [url, setUrl]         = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError]     = useState<string | null>(null);
//   const ext = (file.ext ?? '').toLowerCase();

//   const isImage  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
//   const isPdf    = ext === 'pdf';
//   const isOffice = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);

//   useState(() => {
//     (async () => {
//       try {
//         const { supabase } = await import('../../lib/supabase');
//         if (isOffice) {
//           const { data, error: e } = await supabase.storage
//             .from('filevault')
//             .createSignedUrl(file.storage_path, 3600);
//           if (e || !data) throw new Error(e?.message ?? 'Failed to get signed URL');
//           setUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(data.signedUrl)}&embedded=true`);
//         } else {
//           const { data, error: e } = await supabase.storage
//             .from('filevault')
//             .download(file.storage_path);
//           if (e || !data) throw new Error(e?.message ?? 'Failed to download file');
//           setUrl(URL.createObjectURL(data));
//         }
//       } catch (err) {
//         setError(String(err));
//       } finally {
//         setLoading(false);
//       }
//     })();
//   });

//   function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
//     if (e.target === e.currentTarget) onClose();
//   }

//   return (
//     <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: 24 }}>
//       <div style={{ background: '#fff', borderRadius: 16, width: '90vw', maxWidth: 1000, height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, background: '#fafafa' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <span style={{ fontSize: 22 }}>{EXT_ICON[ext] ?? EXT_ICON.other}</span>
//             <div>
//               <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{file.name}</div>
//               <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{fmtBytes(file.size_bytes ?? 0)} · {ext.toUpperCase()}</div>
//             </div>
//           </div>
//           <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', padding: '4px 8px', borderRadius: 6, lineHeight: 1 }}>✕</button>
//         </div>
//         <div style={{ flex: 1, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           {loading && (
//             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: '#94a3b8' }}>
//               <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'ftSpin 0.7s linear infinite' }} />
//               <span style={{ fontSize: 13 }}>Loading preview…</span>
//               <style>{`@keyframes ftSpin { to { transform: rotate(360deg); } }`}</style>
//             </div>
//           )}
//           {!loading && error && (
//             <div style={{ textAlign: 'center', padding: 40 }}>
//               <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
//               <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Preview unavailable</div>
//               <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 320 }}>{error}</div>
//             </div>
//           )}
//           {!loading && !error && url && isImage && (
//             <img src={url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, padding: 16 }} />
//           )}
//           {!loading && !error && url && (isPdf || isOffice) && (
//             <iframe src={url} title={file.name} style={{ width: '100%', height: '100%', border: 'none' }} />
//           )}
//           {!loading && !error && url && !isImage && !isPdf && !isOffice && (
//             <div style={{ textAlign: 'center', padding: 40 }}>
//               <div style={{ fontSize: 52, marginBottom: 14 }}>{EXT_ICON[ext] ?? EXT_ICON.other}</div>
//               <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No preview available</div>
//               <div style={{ fontSize: 12, color: '#94a3b8' }}>This file type cannot be previewed in the browser</div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── ProjectDetailsPanel ───────────────────────────────────────────────────────

// interface ProjectDetailsPanelProps {
//   node:               FolderRecord;
//   group:              Group;
//   files:              FileRecord[];
//   onMoveFile:         (f: FileRecord) => void;
//   onRemoveFromFolder: (fileId: string) => void;
//   canEdit:            boolean;
// }

// function ProjectDetailsPanel({ node, group, files, onMoveFile, onRemoveFromFolder, canEdit }: ProjectDetailsPanelProps) {
//   const folderFiles = files.filter(f => f.folder_id === node.id);

//   const totalSize = useMemo(
//     () => folderFiles.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0),
//     [folderFiles],
//   );

//   const cell: React.CSSProperties = {
//     padding: '9px 16px',
//     borderBottom: '1px solid #f1f5f9',
//     fontSize: 13,
//     verticalAlign: 'middle',
//   };

//   return (
//     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 20 }}>
//       {/* ── LEFT: Project details ── */}
//       <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
//         <div style={{ padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//           <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Project details</span>
//           <span style={{ color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>⋯</span>
//         </div>
//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <tbody>
//             <tr>
//               <td style={{ ...cell, color: '#94a3b8', width: '36%' }}>Name</td>
//               <td style={{ ...cell, color: '#1e293b', fontWeight: 600 }}>{node.name}</td>
//             </tr>
//             <tr>
//               <td style={{ ...cell, color: '#94a3b8' }}>Description</td>
//               <td style={{ ...cell, color: '#1e293b' }}>{node.description ?? '—'}</td>
//             </tr>
//             <tr>
//               <td style={{ ...cell, borderBottom: 'none', color: '#94a3b8' }}>Cohort</td>
//               <td style={{ ...cell, borderBottom: 'none', color: '#1e293b' }}>{group.name}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* ── RIGHT: Files table ── */}
//       <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
//         <div style={{ padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//           <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Files</span>
//           <span style={{ fontSize: 12, color: '#94a3b8' }}>{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''} · {fmtBytes(totalSize)}</span>
//         </div>
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 100px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
//           <span>Name</span>
//           <span style={{ textAlign: 'right' }}>Size</span>
//           <span style={{ textAlign: 'center' }}>Type</span>
//           <span />
//         </div>
//         {folderFiles.length === 0 ? (
//           <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No files yet</div>
//         ) : (
//           folderFiles.map((f, i) => {
//             const ext   = extOf(f);
//             const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
//             const icon  = EXT_ICON[ext]  ?? EXT_ICON.other;
//             return (
//               <FileRowHorizontal key={f.id} file={f} ext={ext} color={color} icon={icon}
//                 isLast={i === folderFiles.length - 1} onMove={onMoveFile} onDelete={onRemoveFromFolder}
//                 canEdit={canEdit} />
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }

// // ── FileRowHorizontal ─────────────────────────────────────────────────────────

// interface FileRowHorizontalProps {
//   file: FileRecord; ext: string; color: string; icon: string;
//   isLast: boolean; onMove: (f: FileRecord) => void; onDelete: (fileId: string) => void;
//   canEdit: boolean;
// }

// function FileRowHorizontal({ file, ext, color, icon, isLast, onMove, onDelete, canEdit }: FileRowHorizontalProps) {
//   const [hov, setHov]               = useState(false);
//   const [previewing, setPreviewing] = useState(false);

//   async function handleDownload() {
//     if (!file.storage_path) return;
//     const { supabase } = await import('../../lib/supabase');
//     const { data, error } = await supabase.storage.from('filevault').download(file.storage_path);
//     if (error || !data) { console.error('Download failed', error); return; }
//     const url = URL.createObjectURL(data);
//     const a = document.createElement('a');
//     a.href = url; a.download = file.name;
//     document.body.appendChild(a); a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   }

//   return (
//     <>
//       {previewing && <FilePreviewModal file={file} onClose={() => setPreviewing(false)} />}
//       <div
//         onMouseEnter={() => setHov(true)}
//         onMouseLeave={() => setHov(false)}
//         style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 100px', alignItems: 'center', padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid #f1f5f9', background: hov ? '#f8fafc' : '#fff', transition: 'background 0.1s', gap: 8 }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
//           <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
//           <span onClick={() => setPreviewing(true)} title="Click to preview" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: hov ? 'underline' : 'none', textUnderlineOffset: 2 }}>
//             {file.name}
//           </span>
//         </div>
//         <span style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{file.sizeFormatted ?? fmtBytes(file.size_bytes ?? 0)}</span>
//         <div style={{ display: 'flex', justifyContent: 'center' }}>
//           <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>{ext}</span>
//         </div>
//         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
//           {/* Preview and Download are always visible */}
//           <button title="Preview" onClick={() => setPreviewing(true)} style={{ ...iconBtn, background: '#f0fdf4', color: '#166834' }}><IcoEye /></button>
//           <button title="Download" onClick={() => { void handleDownload(); }} style={{ ...iconBtn, background: '#dbeafe', color: '#1d4ed8' }}><IcoDownload /></button>
//           {/* Move and Remove only for group members */}
//           {canEdit && (
//             <>
//               <button title="Move" onClick={() => onMove(file)} style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }}><IcoMove /></button>
//               <button title="Remove from folder" onClick={() => onDelete(file.id)} style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }}><IcoTrash /></button>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// // ── Filter Bar ────────────────────────────────────────────────────────────────

// function TagFilterBar({ roots, activeFolderId, onSelect, onClear }: {
//   roots: FolderRecord[]; activeFolderId: string | null;
//   onSelect: (id: string) => void; onClear: () => void;
// }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
//         <button onClick={onClear} style={{ height: 38, padding: '0 18px', borderRadius: 999, border: `1.5px solid ${activeFolderId === null ? 'transparent' : '#e2e8f0'}`, background: activeFolderId === null ? '#6366f1' : '#fff', color: activeFolderId === null ? '#fff' : '#64748b', fontSize: 14, fontWeight: activeFolderId === null ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }}>
//           All
//         </button>
//         {roots.map(node => {
//           const isActive = activeFolderId === node.id;
//           return (
//             <button key={node.id} onClick={() => onSelect(node.id)} style={{ height: 38, padding: '0 18px', borderRadius: 999, border: `1.5px solid ${isActive ? 'transparent' : '#e2e8f0'}`, background: isActive ? '#6366f1' : '#fff', color: isActive ? '#fff' : '#64748b', fontSize: 14, fontWeight: isActive ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
//               {node.icon && <span style={{ fontSize: 14 }}>{node.icon}</span>}
//               {node.name}
//               {(node.file_count ?? 0) > 0 && <span style={{ fontSize: 11, opacity: isActive ? 0.7 : 0.5 }}>{node.file_count}</span>}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ── FolderTile ────────────────────────────────────────────────────────────────

// function FolderTile({ node, fileCount, onOpen, onRename, onDelete, onUpload, canEdit }: {
//   node: FolderRecord; fileCount: number; onOpen: () => void;
//   onRename: (id: string, name: string) => Promise<void>;
//   onDelete: (id: string) => Promise<void>;
//   onUpload: (id: string, files: FileList) => void;
//   canEdit: boolean;
// }) {
//   const [hov, setHov]             = useState(false);
//   const [renaming, setRenaming]   = useState(false);
//   const [renameVal, setRenameVal] = useState(node.name);
//   const fileRef = useRef<HTMLInputElement>(null);
//   const { tab, body } = getPalette(node.id);

//   async function commitRename() {
//     const v = renameVal.trim();
//     if (v && v !== node.name) await onRename(node.id, v);
//     else setRenameVal(node.name);
//     setRenaming(false);
//   }

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 96, cursor: 'pointer', position: 'relative' }}
//       onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>

//       {/* Edit / Delete — only for group members */}
//       {hov && !renaming && !node.is_auto && canEdit && (
//         <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 10, display: 'flex', gap: 2 }}>
//           <button style={{ ...iconBtn, background: '#fef3c7', color: '#92400e' }} title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true); }}><IcoPencil /></button>
//           <button style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }} title="Delete" onClick={e => { e.stopPropagation(); onDelete(node.id); }}><IcoTrash /></button>
//         </div>
//       )}

//       {/* Upload — only for group members */}
//       {hov && !renaming && canEdit && (
//         <div style={{ position: 'absolute', top: -6, left: -6, zIndex: 10 }}>
//           <button style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }} title="Upload" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}><IcoUpload /></button>
//         </div>
//       )}

//       <div onClick={onOpen} style={{ position: 'relative', width: 80, height: 64, transition: 'transform 0.12s', transform: hov ? 'translateY(-3px)' : 'none' }}>
//         <div style={{ position: 'absolute', top: 0, left: 0, width: 34, height: 12, borderRadius: '4px 4px 0 0', background: tab }} />
//         <div style={{ position: 'absolute', top: 9, left: 0, width: 80, height: 55, borderRadius: '2px 7px 7px 7px', background: body, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
//           <span style={{ fontSize: 20, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{node.icon ?? '📁'}</span>
//           {fileCount > 0 && <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px' }}>{fileCount}</div>}
//           {node.children.length > 0 && <div style={{ position: 'absolute', bottom: 4, left: 5, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px' }}>📁 {node.children.length}</div>}
//         </div>
//       </div>
//       {renaming ? (
//         <input autoFocus style={{ width: 88, fontSize: 11, textAlign: 'center', padding: '2px 4px', borderRadius: 4, border: '1.5px solid #6366f1', outline: 'none', background: '#fff', color: '#1e293b' }}
//           value={renameVal} onChange={e => setRenameVal(e.target.value)}
//           onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
//           onBlur={commitRename} onClick={e => e.stopPropagation()} />
//       ) : (
//         <span onClick={onOpen} style={{ fontSize: 11, fontWeight: 500, color: '#334155', textAlign: 'center', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{node.name}</span>
//       )}
//       <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) { onUpload(node.id, e.target.files); e.target.value = ''; } }} />
//     </div>
//   );
// }

// // ── Breadcrumb ────────────────────────────────────────────────────────────────

// function Breadcrumb({ stack, roots, onJump }: {
//   stack: string[]; roots: FolderRecord[]; onJump: (index: number) => void;
// }) {
//   const crumbs = stack.map(id => { const f = findFolder(roots, id); return { label: f?.name ?? id, icon: f?.icon ?? '📁' }; });
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
//       <button onClick={() => onJump(-1)} style={{ fontWeight: stack.length === 0 ? 600 : 400, color: stack.length === 0 ? '#1e293b' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}>🏠 Root</button>
//       {crumbs.map((c, i) => (
//         <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//           <IcoChevronRight />
//           <button onClick={() => onJump(i)} style={{ fontWeight: i === crumbs.length - 1 ? 600 : 400, color: i === crumbs.length - 1 ? '#1e293b' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}>{c.icon} {c.label}</button>
//         </span>
//       ))}
//     </div>
//   );
// }

// // ── ExportModal ───────────────────────────────────────────────────────────────

// type ExportFormat = 'csv' | 'zip';

// const ALL_FIELDS = [
//   { key: 'name',       label: 'File Name' },
//   { key: 'ext',        label: 'Type' },
//   { key: 'size_bytes', label: 'Size (bytes)' },
//   { key: 'folder_id',  label: 'Folder ID' },
//   { key: 'group_id',   label: 'Group ID' },
//   { key: 'created_at', label: 'Created At' },
// ] as const;

// type FieldKey = typeof ALL_FIELDS[number]['key'];

// interface ExportModalProps {
//   node: FolderRecord; files: FileRecord[]; onClose: () => void;
// }

// function ExportModal({ node, files, onClose }: ExportModalProps) {
//   const [format,       setFormat]       = useState<ExportFormat>('csv');
//   const [activeFields, setActiveFields] = useState<Set<FieldKey>>(new Set(['name', 'ext', 'size_bytes', 'created_at']));
//   const [copied,    setCopied]    = useState(false);
//   const [zipping,   setZipping]   = useState(false);
//   const [zipStatus, setZipStatus] = useState('');
//   const rows = files;

//   function toggleField(key: FieldKey) {
//     setActiveFields(prev => {
//       const next = new Set(prev);
//       if (next.has(key)) next.delete(key);
//       else next.add(key);
//       return next;
//     });
//   }

//   function getVal(f: FileRecord, key: FieldKey): string {
//     switch (key) {
//       case 'name':       return f.name ?? '';
//       case 'ext':        return (f.ext ?? 'other').toUpperCase();
//       case 'size_bytes': return String(f.size_bytes ?? 0);
//       case 'folder_id':  return f.folder_id ?? '';
//       case 'group_id':   return f.group_id  ?? '';
//       case 'created_at': return f.created_at ? fmtDate(f.created_at) : '—';
//       default:           return '';
//     }
//   }

//   const orderedFields = ALL_FIELDS.filter(f => activeFields.has(f.key));

//   const csvContent = useMemo(() => {
//     if (rows.length === 0) return '(no files)';
//     const header = orderedFields.map(f => f.label).join(',');
//     const body   = rows.map(r => orderedFields.map(f => { const v = getVal(r, f.key); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(',')).join('\n');
//     return header + '\n' + body;
//   }, [rows, activeFields]);

//   function handleDownloadCSV() {
//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url  = URL.createObjectURL(blob);
//     const a    = document.createElement('a');
//     a.href = url; a.download = `${node.name.replace(/\s+/g, '_')}_export.csv`;
//     document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
//   }

//   async function handleDownloadZIP() {
//     if (rows.length === 0) return;
//     setZipping(true); setZipStatus('Preparing…');
//     try {
//       const zip = new JSZip();
//       const { supabase } = await import('../../lib/supabase');
//       for (let i = 0; i < rows.length; i++) {
//         const f = rows[i];
//         setZipStatus(`Fetching ${i + 1} / ${rows.length}: ${f.name}`);
//         try {
//           if (!f.storage_path) throw new Error('No storage path');
//           const { data, error } = await supabase.storage.from('filevault').download(f.storage_path);
//           if (error || !data) throw new Error(error?.message ?? 'Download failed');
//           zip.file(f.name, data);
//         } catch (e) {
//           zip.file(`${f.name}.error.txt`, `Could not fetch: ${String(e)}`);
//         }
//       }
//       zip.file('_manifest.csv', csvContent);
//       setZipStatus('Compressing…');
//       const blob = await zip.generateAsync({ type: 'blob' });
//       const url = URL.createObjectURL(blob);
//       const a   = document.createElement('a');
//       a.href = url; a.download = `${node.name.replace(/\s+/g, '_')}_files.zip`;
//       document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
//       setZipStatus('Done!'); setTimeout(() => setZipStatus(''), 2000);
//     } catch (err) { console.error('ZIP export error:', err); setZipStatus('Error — see console'); }
//     finally { setZipping(false); }
//   }

//   function handleDownload() { if (format === 'csv') handleDownloadCSV(); else handleDownloadZIP(); }
//   function handleCopy() { navigator.clipboard.writeText(csvContent).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
//   function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) { if (e.target === e.currentTarget) onClose(); }

//   const tabStyle = (active: boolean): React.CSSProperties => ({ padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? '#6366f1' : 'transparent', color: active ? '#fff' : '#64748b', transition: 'all 0.15s' });
//   const fieldBtn = (active: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${active ? '#6366f1' : '#e2e8f0'}`, background: active ? '#eef2ff' : '#fff', color: active ? '#4338ca' : '#64748b', transition: 'all 0.15s' });

//   return (
//     <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
//       <div style={{ background: '#fff', borderRadius: 16, width: 620, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9' }}>
//           <div>
//             <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Export Files</div>
//             <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{node.name} · {rows.length} file{rows.length !== 1 ? 's' : ''}</div>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', lineHeight: 1, padding: 4 }}>✕</button>
//         </div>
//         <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
//           <div>
//             <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</div>
//             <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4, width: 'fit-content' }}>
//               <button style={tabStyle(format === 'csv')} onClick={() => setFormat('csv')}>📄 CSV</button>
//               <button style={tabStyle(format === 'zip')} onClick={() => setFormat('zip')}>🗜️ ZIP</button>
//             </div>
//           </div>
//           <div>
//             <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format === 'zip' ? 'Manifest Fields' : 'Include Fields'}</div>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//               {ALL_FIELDS.map(f => (
//                 <button key={f.key} style={fieldBtn(activeFields.has(f.key))} onClick={() => toggleField(f.key)}>
//                   {activeFields.has(f.key) && <span style={{ fontSize: 10 }}>✓</span>}
//                   {f.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//           {format === 'csv' && (
//             <div style={{ flex: 1 }}>
//               <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</div>
//               <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', fontSize: 11.5, lineHeight: 1.6, color: '#334155', overflowX: 'auto', overflowY: 'auto', maxHeight: 200, margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, monospace', whiteSpace: 'pre' }}>
//                 {csvContent.split('\n').slice(0, 12).join('\n')}
//                 {csvContent.split('\n').length > 12 ? '\n…' : ''}
//               </pre>
//             </div>
//           )}
//           {format === 'zip' && (
//             <div style={{ flex: 1 }}>
//               <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Files in archive</div>
//               <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
//                 {rows.length === 0 ? (
//                   <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No files to bundle</div>
//                 ) : (
//                   rows.map((f, i) => {
//                     const ext = (f.ext ?? 'other').toLowerCase();
//                     const icon = EXT_ICON[ext] ?? EXT_ICON.other;
//                     const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
//                     return (
//                       <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f1f5f9', fontSize: 13 }}>
//                         <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
//                         <span style={{ flex: 1, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
//                         <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', flexShrink: 0 }}>{ext}</span>
//                         <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{fmtBytes(f.size_bytes ?? 0)}</span>
//                       </div>
//                     );
//                   })
//                 )}
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>
//                   <span>📋</span><span>_manifest.csv — auto-included</span>
//                 </div>
//               </div>
//               {zipStatus && (
//                 <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6366f1' }}>
//                   {zipping && <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #c7d2fe', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }} />}
//                   {zipStatus}
//                   <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
//           {format === 'csv' ? (
//             <button onClick={handleCopy} style={{ ...toolbarBtn, background: '#fff', color: copied ? '#059669' : '#6366f1', border: `1px solid ${copied ? '#059669' : '#6366f1'}`, fontSize: 13 }}>
//               {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
//             </button>
//           ) : <div />}
//           <div style={{ display: 'flex', gap: 8 }}>
//             <button onClick={onClose} style={{ ...toolbarBtn, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}>Cancel</button>
//             <button onClick={handleDownload} disabled={rows.length === 0 || zipping} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none', opacity: (rows.length === 0 || zipping) ? 0.5 : 1 }}>
//               <IcoExport />
//               {format === 'zip' ? (zipping ? 'Zipping…' : 'Download .zip') : 'Download .csv'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── FolderViewProps ───────────────────────────────────────────────────────────

// interface FolderViewProps {
//   node: FolderRecord; group: Group; files: FileRecord[];
//   stack: string[]; roots: FolderRecord[];
//   onOpenFolder: (id: string) => void; onJump: (index: number) => void;
//   onAddSubFolder: (parentId: string, name: string, icon: string) => Promise<void>;
//   onRename: (id: string, name: string) => Promise<void>;
//   onDelete: (id: string) => Promise<void>;
//   onUploadToFolder: (folderId: string, files: FileList) => void;
//   onMoveFile: (file: FileRecord) => void;
//   onRemoveFromFolder: (fileId: string) => void;
//   onExport: (node: FolderRecord, files: FileRecord[]) => void;
//   canEdit: boolean;
// }

// // ── FolderView ────────────────────────────────────────────────────────────────

// function FolderView({ node, group, files, stack, roots, onOpenFolder, onJump, onRename, onDelete, onUploadToFolder, onMoveFile, onRemoveFromFolder, canEdit }: FolderViewProps) {
//   const uploadRef = useRef<HTMLInputElement>(null);
//   const [showExport, setShowExport] = useState(false);
//   const folderFiles = files.filter(f => f.folder_id === node.id);

//   return (
//     <div>
//       {showExport && <ExportModal node={node} files={folderFiles} onClose={() => setShowExport(false)} />}
//       <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
//         <Breadcrumb stack={stack} roots={roots} onJump={onJump} />
//         <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
//           <button onClick={() => setShowExport(true)} style={{ ...toolbarBtn, background: '#fff', color: '#6366f1', border: '1px solid #6366f1' }}><IcoExport /> Export</button>
//           {/* Upload button only visible for group members */}
//           {canEdit && (
//             <>
//               <button onClick={() => uploadRef.current?.click()} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none' }}><IcoUpload /> Upload</button>
//               <input ref={uploadRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) { onUploadToFolder(node.id, e.target.files); e.target.value = ''; } }} />
//             </>
//           )}
//         </div>
//       </div>
//       {node.children.length > 0 && (
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '8px 4px 28px', alignItems: 'flex-start' }}>
//           {node.children.map(child => (
//             <FolderTile key={child.id} node={child}
//               fileCount={child.file_count + child.children.reduce((s, c) => s + c.file_count, 0)}
//               onOpen={() => onOpenFolder(child.id)} onRename={onRename} onDelete={onDelete}
//               onUpload={(id, fs) => onUploadToFolder(id, fs)}
//               canEdit={canEdit} />
//           ))}
//         </div>
//       )}
//       <ProjectDetailsPanel node={node} group={group} files={files} onMoveFile={onMoveFile} onRemoveFromFolder={onRemoveFromFolder} canEdit={canEdit} />
//     </div>
//   );
// }

// // ── FolderTreeProps ───────────────────────────────────────────────────────────

// export interface FolderTreeProps {
//   group: Group; roots: FolderRecord[]; files: FileRecord[]; loading: boolean;
//   onCreateFolder: (name: string, parentId: string | null, icon?: string) => Promise<string | null>;
//   onAddSubFolder: (parentId: string, name: string, icon: string) => Promise<void>;
//   onRename: (id: string, name: string) => Promise<void>;
//   onDelete: (id: string) => Promise<void>;
//   onUploadToFolder: (folderId: string | null, files: FileList) => void;
//   onMoveFile: (file: FileRecord) => void;
//   onRemoveFromFolder: (fileId: string) => void;
//   onExport: (node: FolderRecord, files: FileRecord[]) => void;
// }

// // ── FolderTree (root export) ──────────────────────────────────────────────────

// export default function FolderTree({
//   group, roots, files, loading,
//   onAddSubFolder, onRename, onDelete,
//   onUploadToFolder, onMoveFile, onRemoveFromFolder, onExport,
// }: FolderTreeProps) {
//   const [folderStack,    setFolderStack]    = useState<string[]>([]);
//   const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
//   const [search,         setSearch]         = useState('');

//   // ✅ Check if the current user is a member of this group
//   const isMember = useIsMember(group.id);

//   const openFolderId = folderStack.at(-1) ?? null;
//   const openFolder   = openFolderId ? findFolder(roots, openFolderId) : null;

//   const filteredRoots = useMemo(() => {
//     let result = activeFolderId ? roots.filter(n => n.id === activeFolderId) : roots;
//     if (search.trim()) {
//       const q = search.trim().toLowerCase();
//       result = result.filter(n => n.name.toLowerCase().includes(q));
//     }
//     return result;
//   }, [roots, activeFolderId, search]);

//   function handleOpenFolder(id: string) { setFolderStack(s => [...s, id]); }
//   function handleJump(index: number) { setFolderStack(index === -1 ? [] : s => s.slice(0, index + 1)); }
//   function handleFolderViewUpload(folderId: string, fileList: FileList) { onUploadToFolder(folderId, fileList); }

//   if (openFolder) {
//     return (
//       <FolderView
//         node={openFolder} group={group} files={files}
//         stack={folderStack} roots={roots}
//         onOpenFolder={handleOpenFolder} onJump={handleJump}
//         onAddSubFolder={onAddSubFolder} onRename={onRename} onDelete={onDelete}
//         onUploadToFolder={handleFolderViewUpload}
//         onMoveFile={onMoveFile} onRemoveFromFolder={onRemoveFromFolder} onExport={onExport}
//         canEdit={isMember}
//       />
//     );
//   }

//   return (
//     <div>
//       <TagFilterBar
//         roots={roots}
//         activeFolderId={activeFolderId}
//         onSelect={id => setActiveFolderId(prev => prev === id ? null : id)}
//         onClear={() => { setActiveFolderId(null); setSearch(''); }}
//       />

//       {loading ? (
//         <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Loading folders…</div>
//       ) : (
//         <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px 24px', minHeight: 120 }}>
//           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
//             {filteredRoots.map(node => (
//               <FolderTile key={node.id} node={node}
//                 fileCount={node.file_count + node.children.reduce((s, c) => s + c.file_count, 0)}
//                 onOpen={() => handleOpenFolder(node.id)} onRename={onRename} onDelete={onDelete}
//                 onUpload={(id, fs) => onUploadToFolder(id, fs)}
//                 canEdit={isMember} />
//             ))}
//             {filteredRoots.length === 0 && (
//               <div style={{ width: '100%', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
//                 <span style={{ fontSize: 40 }}>🗂️</span>
//                 {activeFolderId !== null || search.trim() ? (
//                   <>
//                     <p style={{ fontSize: 13, margin: 0 }}>No projects match your search</p>
//                     <button onClick={() => { setActiveFolderId(null); setSearch(''); }} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
//                   </>
//                 ) : (
//                   <p style={{ fontSize: 13, margin: 0 }}>No folders yet</p>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { useState, useRef, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import JSZip from 'jszip';
import type { FolderRecord } from '../../types/folder';
import type { FileRecord, Group } from '../../components/layout/ui/cons';
import { EXT_COLOR,EXT_ICON, PALETTES } from '@/constant/fileIcons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ── Membership check ──────────────────────────────────────────────────────────

function useIsMember(groupId: string) {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!user || !groupId) return;

    async function check() {
      // Check 1: explicit group_members row
      const { data: memberRow } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (memberRow) {
        setIsMember(true);
        return;
      }

      // Check 2: user's profile group_id matches
      const { data: profile } = await supabase
        .from('profiles')        // ← adjust if your table is named differently
        .select('group_id')
        .eq('id', user!.id)
        .maybeSingle();

      setIsMember(profile?.group_id === groupId);
    }

    void check();
  }, [groupId, user]);

  return isMember;
}

// ── Palette ───────────────────────────────────────────────────────────────────

function getPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findFolder(nodes: FolderRecord[], id: string): FolderRecord | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findFolder(n.children, id);
    if (found) return found;
  }
  return null;
}

function extOf(file: FileRecord) { return (file.ext ?? 'other').toLowerCase(); }

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'MMM d, yyyy'); } catch { return '—'; }
}

function fmtBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const IcoUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcoDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcoChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IcoPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoMove = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/>
    <polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);
const IcoEye = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoExport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const iconBtn: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 4, border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
};
const toolbarBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 500,
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
};

// ── FilePreviewModal ──────────────────────────────────────────────────────────

interface FilePreviewModalProps {
  file: FileRecord;
  onClose: () => void;
}

function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [url, setUrl]         = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const ext = (file.ext ?? '').toLowerCase();

  const isImage  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf    = ext === 'pdf';
  const isOffice = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext);

  useState(() => {
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        if (isOffice) {
          const { data, error: e } = await supabase.storage
            .from('filevault')
            .createSignedUrl(file.storage_path, 3600);
          if (e || !data) throw new Error(e?.message ?? 'Failed to get signed URL');
          setUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(data.signedUrl)}&embedded=true`);
        } else {
          const { data, error: e } = await supabase.storage
            .from('filevault')
            .download(file.storage_path);
          if (e || !data) throw new Error(e?.message ?? 'Failed to download file');
          setUrl(URL.createObjectURL(data));
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  });

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90vw', maxWidth: 1000, height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{EXT_ICON[ext] ?? EXT_ICON.other}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{fmtBytes(file.size_bytes ?? 0)} · {ext.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b', padding: '4px 8px', borderRadius: 6, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: '#94a3b8' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'ftSpin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading preview…</span>
              <style>{`@keyframes ftSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Preview unavailable</div>
              <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 320 }}>{error}</div>
            </div>
          )}
          {!loading && !error && url && isImage && (
            <img src={url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, padding: 16 }} />
          )}
          {!loading && !error && url && (isPdf || isOffice) && (
            <iframe src={url} title={file.name} style={{ width: '100%', height: '100%', border: 'none' }} />
          )}
          {!loading && !error && url && !isImage && !isPdf && !isOffice && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>{EXT_ICON[ext] ?? EXT_ICON.other}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No preview available</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>This file type cannot be previewed in the browser</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ProjectDetailsPanel ───────────────────────────────────────────────────────

interface ProjectDetailsPanelProps {
  node:               FolderRecord;
  group:              Group;
  files:              FileRecord[];
  onMoveFile:         (f: FileRecord) => void;
  onRemoveFromFolder: (fileId: string) => void;
  canEdit:            boolean;
}

function ProjectDetailsPanel({ node, group, files, onMoveFile, onRemoveFromFolder, canEdit }: ProjectDetailsPanelProps) {
  const folderFiles = files.filter(f => f.folder_id === node.id);

  const totalSize = useMemo(
    () => folderFiles.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0),
    [folderFiles],
  );

  const cell: React.CSSProperties = {
    padding: '9px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13,
    verticalAlign: 'middle',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 20 }}>
      {/* ── LEFT: Project details ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Project details</span>
          <span style={{ color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>⋯</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, color: '#94a3b8', width: '36%' }}>Name</td>
              <td style={{ ...cell, color: '#1e293b', fontWeight: 600 }}>{node.name}</td>
            </tr>
            <tr>
              <td style={{ ...cell, color: '#94a3b8' }}>Description</td>
              <td style={{ ...cell, color: '#1e293b' }}>{node.description ?? '—'}</td>
            </tr>
            <tr>
              <td style={{ ...cell, borderBottom: 'none', color: '#94a3b8' }}>Cohort</td>
              <td style={{ ...cell, borderBottom: 'none', color: '#1e293b' }}>{group.name}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── RIGHT: Files table ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Files</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''} · {fmtBytes(totalSize)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 100px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Name</span>
          <span style={{ textAlign: 'right' }}>Size</span>
          <span style={{ textAlign: 'center' }}>Type</span>
          <span />
        </div>
        {folderFiles.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No files yet</div>
        ) : (
          folderFiles.map((f, i) => {
            const ext   = extOf(f);
            const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
            const icon  = EXT_ICON[ext]  ?? EXT_ICON.other;
            return (
              <FileRowHorizontal key={f.id} file={f} ext={ext} color={color} icon={icon}
                isLast={i === folderFiles.length - 1} onMove={onMoveFile} onDelete={onRemoveFromFolder}
                canEdit={canEdit} />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── FileRowHorizontal ─────────────────────────────────────────────────────────

interface FileRowHorizontalProps {
  file: FileRecord; ext: string; color: string; icon: string;
  isLast: boolean; onMove: (f: FileRecord) => void; onDelete: (fileId: string) => void;
  canEdit: boolean;
}

function FileRowHorizontal({ file, ext, color, icon, isLast, onMove, onDelete, canEdit }: FileRowHorizontalProps) {
  const [hov, setHov]               = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function handleDownload() {
    if (!file.storage_path) return;
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase.storage.from('filevault').download(file.storage_path);
    if (error || !data) { console.error('Download failed', error); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {previewing && <FilePreviewModal file={file} onClose={() => setPreviewing(false)} />}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 100px', alignItems: 'center', padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid #f1f5f9', background: hov ? '#f8fafc' : '#fff', transition: 'background 0.1s', gap: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
          <span onClick={() => setPreviewing(true)} title="Click to preview" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: hov ? 'underline' : 'none', textUnderlineOffset: 2 }}>
            {file.name}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{file.sizeFormatted ?? fmtBytes(file.size_bytes ?? 0)}</span>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>{ext}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
          {/* Preview and Download are always visible */}
          <button title="Preview" onClick={() => setPreviewing(true)} style={{ ...iconBtn, background: '#f0fdf4', color: '#166834' }}><IcoEye /></button>
          <button title="Download" onClick={() => { void handleDownload(); }} style={{ ...iconBtn, background: '#dbeafe', color: '#1d4ed8' }}><IcoDownload /></button>
          {/* Move and Remove only for group members */}
          {canEdit && (
            <>
              <button title="Move" onClick={() => onMove(file)} style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }}><IcoMove /></button>
              <button title="Remove from folder" onClick={() => onDelete(file.id)} style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }}><IcoTrash /></button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

function TagFilterBar({ roots, activeFolderId, onSelect, onClear }: {
  roots: FolderRecord[]; activeFolderId: string | null;
  onSelect: (id: string) => void; onClear: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
        <button onClick={onClear} style={{ height: 38, padding: '0 18px', borderRadius: 999, border: `1.5px solid ${activeFolderId === null ? 'transparent' : '#e2e8f0'}`, background: activeFolderId === null ? '#6366f1' : '#fff', color: activeFolderId === null ? '#fff' : '#64748b', fontSize: 14, fontWeight: activeFolderId === null ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }}>
          All
        </button>
        {roots.map(node => {
          const isActive = activeFolderId === node.id;
          return (
            <button key={node.id} onClick={() => onSelect(node.id)} style={{ height: 38, padding: '0 18px', borderRadius: 999, border: `1.5px solid ${isActive ? 'transparent' : '#e2e8f0'}`, background: isActive ? '#6366f1' : '#fff', color: isActive ? '#fff' : '#64748b', fontSize: 14, fontWeight: isActive ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {node.icon && <span style={{ fontSize: 14 }}>{node.icon}</span>}
              {node.name}
              {(node.file_count ?? 0) > 0 && <span style={{ fontSize: 11, opacity: isActive ? 0.7 : 0.5 }}>{node.file_count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── FolderTile ────────────────────────────────────────────────────────────────

function FolderTile({ node, fileCount, onOpen, onRename, onDelete, onUpload, canEdit }: {
  node: FolderRecord; fileCount: number; onOpen: () => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpload: (id: string, files: FileList) => void;
  canEdit: boolean;
}) {
  const [hov, setHov]             = useState(false);
  const [renaming, setRenaming]   = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const fileRef = useRef<HTMLInputElement>(null);
  const { tab, body } = getPalette(node.id);

  async function commitRename() {
    const v = renameVal.trim();
    if (v && v !== node.name) await onRename(node.id, v);
    else setRenameVal(node.name);
    setRenaming(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 96, cursor: 'pointer', position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>

      {/* Edit / Delete — only for group members */}
      {hov && !renaming && !node.is_auto && canEdit && (
        <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 10, display: 'flex', gap: 2 }}>
          <button style={{ ...iconBtn, background: '#fef3c7', color: '#92400e' }} title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true); }}><IcoPencil /></button>
          <button style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }} title="Delete" onClick={e => { e.stopPropagation(); onDelete(node.id); }}><IcoTrash /></button>
        </div>
      )}

      {/* Upload — only for group members */}
      {hov && !renaming && canEdit && (
        <div style={{ position: 'absolute', top: -6, left: -6, zIndex: 10 }}>
          <button style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }} title="Upload" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}><IcoUpload /></button>
        </div>
      )}

      <div onClick={onOpen} style={{ position: 'relative', width: 80, height: 64, transition: 'transform 0.12s', transform: hov ? 'translateY(-3px)' : 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 34, height: 12, borderRadius: '4px 4px 0 0', background: tab }} />
        <div style={{ position: 'absolute', top: 9, left: 0, width: 80, height: 55, borderRadius: '2px 7px 7px 7px', background: body, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 20, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{node.icon ?? '📁'}</span>
          {fileCount > 0 && <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px' }}>{fileCount}</div>}
          {node.children.length > 0 && <div style={{ position: 'absolute', bottom: 4, left: 5, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px' }}>📁 {node.children.length}</div>}
        </div>
      </div>
      {renaming ? (
        <input autoFocus style={{ width: 88, fontSize: 11, textAlign: 'center', padding: '2px 4px', borderRadius: 4, border: '1.5px solid #6366f1', outline: 'none', background: '#fff', color: '#1e293b' }}
          value={renameVal} onChange={e => setRenameVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
          onBlur={commitRename} onClick={e => e.stopPropagation()} />
      ) : (
        <span onClick={onOpen} style={{ fontSize: 11, fontWeight: 500, color: '#334155', textAlign: 'center', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{node.name}</span>
      )}
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) { onUpload(node.id, e.target.files); e.target.value = ''; } }} />
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ stack, roots, onJump }: {
  stack: string[]; roots: FolderRecord[]; onJump: (index: number) => void;
}) {
  const crumbs = stack.map(id => { const f = findFolder(roots, id); return { label: f?.name ?? id, icon: f?.icon ?? '📁' }; });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
      <button onClick={() => onJump(-1)} style={{ fontWeight: stack.length === 0 ? 600 : 400, color: stack.length === 0 ? '#1e293b' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}>🏠 Root</button>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IcoChevronRight />
          <button onClick={() => onJump(i)} style={{ fontWeight: i === crumbs.length - 1 ? 600 : 400, color: i === crumbs.length - 1 ? '#1e293b' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}>{c.icon} {c.label}</button>
        </span>
      ))}
    </div>
  );
}

// ── ExportModal ───────────────────────────────────────────────────────────────

type ExportFormat = 'csv' | 'zip';

const ALL_FIELDS = [
  { key: 'name',       label: 'File Name' },
  { key: 'ext',        label: 'Type' },
  { key: 'size_bytes', label: 'Size (bytes)' },
  { key: 'folder_id',  label: 'Folder ID' },
  { key: 'group_id',   label: 'Group ID' },
  { key: 'created_at', label: 'Created At' },
] as const;

type FieldKey = typeof ALL_FIELDS[number]['key'];

interface ExportModalProps {
  node: FolderRecord; files: FileRecord[]; onClose: () => void;
}

function ExportModal({ node, files, onClose }: ExportModalProps) {
  const [format,       setFormat]       = useState<ExportFormat>('csv');
  const [activeFields, setActiveFields] = useState<Set<FieldKey>>(new Set(['name', 'ext', 'size_bytes', 'created_at']));
  const [copied,    setCopied]    = useState(false);
  const [zipping,   setZipping]   = useState(false);
  const [zipStatus, setZipStatus] = useState('');
  const rows = files;

  function toggleField(key: FieldKey) {
    setActiveFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function getVal(f: FileRecord, key: FieldKey): string {
    switch (key) {
      case 'name':       return f.name ?? '';
      case 'ext':        return (f.ext ?? 'other').toUpperCase();
      case 'size_bytes': return String(f.size_bytes ?? 0);
      case 'folder_id':  return f.folder_id ?? '';
      case 'group_id':   return f.group_id  ?? '';
      case 'created_at': return f.created_at ? fmtDate(f.created_at) : '—';
      default:           return '';
    }
  }

  const orderedFields = ALL_FIELDS.filter(f => activeFields.has(f.key));

  const csvContent = useMemo(() => {
    if (rows.length === 0) return '(no files)';
    const header = orderedFields.map(f => f.label).join(',');
    const body   = rows.map(r => orderedFields.map(f => { const v = getVal(r, f.key); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(',')).join('\n');
    return header + '\n' + body;
  }, [rows, activeFields]);

  function handleDownloadCSV() {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${node.name.replace(/\s+/g, '_')}_export.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  async function handleDownloadZIP() {
    if (rows.length === 0) return;
    setZipping(true); setZipStatus('Preparing…');
    try {
      const zip = new JSZip();
      const { supabase } = await import('../../lib/supabase');
      for (let i = 0; i < rows.length; i++) {
        const f = rows[i];
        setZipStatus(`Fetching ${i + 1} / ${rows.length}: ${f.name}`);
        try {
          if (!f.storage_path) throw new Error('No storage path');
          const { data, error } = await supabase.storage.from('filevault').download(f.storage_path);
          if (error || !data) throw new Error(error?.message ?? 'Download failed');
          zip.file(f.name, data);
        } catch (e) {
          zip.file(`${f.name}.error.txt`, `Could not fetch: ${String(e)}`);
        }
      }
      zip.file('_manifest.csv', csvContent);
      setZipStatus('Compressing…');
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `${node.name.replace(/\s+/g, '_')}_files.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setZipStatus('Done!'); setTimeout(() => setZipStatus(''), 2000);
    } catch (err) { console.error('ZIP export error:', err); setZipStatus('Error — see console'); }
    finally { setZipping(false); }
  }

  function handleDownload() { if (format === 'csv') handleDownloadCSV(); else handleDownloadZIP(); }
  function handleCopy() { navigator.clipboard.writeText(csvContent).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) { if (e.target === e.currentTarget) onClose(); }

  const tabStyle = (active: boolean): React.CSSProperties => ({ padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? '#6366f1' : 'transparent', color: active ? '#fff' : '#64748b', transition: 'all 0.15s' });
  const fieldBtn = (active: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${active ? '#6366f1' : '#e2e8f0'}`, background: active ? '#eef2ff' : '#fff', color: active ? '#4338ca' : '#64748b', transition: 'all 0.15s' });

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 620, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Export Files</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{node.name} · {rows.length} file{rows.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</div>
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4, width: 'fit-content' }}>
              <button style={tabStyle(format === 'csv')} onClick={() => setFormat('csv')}>📄 CSV</button>
              <button style={tabStyle(format === 'zip')} onClick={() => setFormat('zip')}>🗜️ ZIP</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format === 'zip' ? 'Manifest Fields' : 'Include Fields'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_FIELDS.map(f => (
                <button key={f.key} style={fieldBtn(activeFields.has(f.key))} onClick={() => toggleField(f.key)}>
                  {activeFields.has(f.key) && <span style={{ fontSize: 10 }}>✓</span>}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {format === 'csv' && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</div>
              <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', fontSize: 11.5, lineHeight: 1.6, color: '#334155', overflowX: 'auto', overflowY: 'auto', maxHeight: 200, margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, monospace', whiteSpace: 'pre' }}>
                {csvContent.split('\n').slice(0, 12).join('\n')}
                {csvContent.split('\n').length > 12 ? '\n…' : ''}
              </pre>
            </div>
          )}
          {format === 'zip' && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Files in archive</div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                {rows.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No files to bundle</div>
                ) : (
                  rows.map((f, i) => {
                    const ext = (f.ext ?? 'other').toLowerCase();
                    const icon = EXT_ICON[ext] ?? EXT_ICON.other;
                    const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
                    return (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f1f5f9', fontSize: 13 }}>
                        <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                        <span style={{ flex: 1, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', flexShrink: 0 }}>{ext}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{fmtBytes(f.size_bytes ?? 0)}</span>
                      </div>
                    );
                  })
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>
                  <span>📋</span><span>_manifest.csv — auto-included</span>
                </div>
              </div>
              {zipStatus && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6366f1' }}>
                  {zipping && <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #c7d2fe', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }} />}
                  {zipStatus}
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
          {format === 'csv' ? (
            <button onClick={handleCopy} style={{ ...toolbarBtn, background: '#fff', color: copied ? '#059669' : '#6366f1', border: `1px solid ${copied ? '#059669' : '#6366f1'}`, fontSize: 13 }}>
              {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ ...toolbarBtn, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}>Cancel</button>
            <button onClick={handleDownload} disabled={rows.length === 0 || zipping} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none', opacity: (rows.length === 0 || zipping) ? 0.5 : 1 }}>
              <IcoExport />
              {format === 'zip' ? (zipping ? 'Zipping…' : 'Download .zip') : 'Download .csv'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FolderViewProps ───────────────────────────────────────────────────────────

interface FolderViewProps {
  node: FolderRecord; group: Group; files: FileRecord[];
  stack: string[]; roots: FolderRecord[];
  onOpenFolder: (id: string) => void; onJump: (index: number) => void;
  onAddSubFolder: (parentId: string, name: string, icon: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadToFolder: (folderId: string, files: FileList) => void;
  onMoveFile: (file: FileRecord) => void;
  onRemoveFromFolder: (fileId: string) => void;
  onExport: (node: FolderRecord, files: FileRecord[]) => void;
  canEdit: boolean;
}

// ── FolderView ────────────────────────────────────────────────────────────────

function FolderView({ node, group, files, stack, roots, onOpenFolder, onJump, onRename, onDelete, onUploadToFolder, onMoveFile, onRemoveFromFolder, canEdit }: FolderViewProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);
  const folderFiles = files.filter(f => f.folder_id === node.id);

  return (
    <div>
      {showExport && <ExportModal node={node} files={folderFiles} onClose={() => setShowExport(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <Breadcrumb stack={stack} roots={roots} onJump={onJump} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ ...toolbarBtn, background: '#fff', color: '#6366f1', border: '1px solid #6366f1' }}><IcoExport /> Export</button>
          {/* Upload button only visible for group members */}
          {canEdit && (
            <>
              <button onClick={() => uploadRef.current?.click()} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none' }}><IcoUpload /> Upload</button>
              <input ref={uploadRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) { onUploadToFolder(node.id, e.target.files); e.target.value = ''; } }} />
            </>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '8px 4px 28px', alignItems: 'flex-start' }}>
          {node.children.map(child => (
            <FolderTile key={child.id} node={child}
              fileCount={child.file_count + child.children.reduce((s, c) => s + c.file_count, 0)}
              onOpen={() => onOpenFolder(child.id)} onRename={onRename} onDelete={onDelete}
              onUpload={(id, fs) => onUploadToFolder(id, fs)}
              canEdit={canEdit} />
          ))}
        </div>
      )}
      <ProjectDetailsPanel node={node} group={group} files={files} onMoveFile={onMoveFile} onRemoveFromFolder={onRemoveFromFolder} canEdit={canEdit} />
    </div>
  );
}

// ── FolderTreeProps ───────────────────────────────────────────────────────────

export interface FolderTreeProps {
  group: Group; roots: FolderRecord[]; files: FileRecord[]; loading: boolean;
  onCreateFolder: (name: string, parentId: string | null, icon?: string) => Promise<string | null>;
  onAddSubFolder: (parentId: string, name: string, icon: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadToFolder: (folderId: string | null, files: FileList) => void;
  onMoveFile: (file: FileRecord) => void;
  onRemoveFromFolder: (fileId: string) => void;
  onExport: (node: FolderRecord, files: FileRecord[]) => void;
}

// ── FolderTree (root export) ──────────────────────────────────────────────────

export default function FolderTree({
  group, roots, files, loading,
  onAddSubFolder, onRename, onDelete,
  onUploadToFolder, onMoveFile, onRemoveFromFolder, onExport,
}: FolderTreeProps) {
  const [folderStack,    setFolderStack]    = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [search,         setSearch]         = useState('');

  // ✅ Check if the current user is a member of this group
  const isMember = useIsMember(group.id);

  const openFolderId = folderStack.at(-1) ?? null;
  const openFolder   = openFolderId ? findFolder(roots, openFolderId) : null;

  const filteredRoots = useMemo(() => {
    let result = activeFolderId ? roots.filter(n => n.id === activeFolderId) : roots;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(n => n.name.toLowerCase().includes(q));
    }
    return result;
  }, [roots, activeFolderId, search]);

  function handleOpenFolder(id: string) { setFolderStack(s => [...s, id]); }
  function handleJump(index: number) { setFolderStack(index === -1 ? [] : s => s.slice(0, index + 1)); }
  function handleFolderViewUpload(folderId: string, fileList: FileList) { onUploadToFolder(folderId, fileList); }

  if (openFolder) {
    return (
      <FolderView
        node={openFolder} group={group} files={files}
        stack={folderStack} roots={roots}
        onOpenFolder={handleOpenFolder} onJump={handleJump}
        onAddSubFolder={onAddSubFolder} onRename={onRename} onDelete={onDelete}
        onUploadToFolder={handleFolderViewUpload}
        onMoveFile={onMoveFile} onRemoveFromFolder={onRemoveFromFolder} onExport={onExport}
        canEdit={isMember}
      />
    );
  }

  return (
    <div>
      <TagFilterBar
        roots={roots}
        activeFolderId={activeFolderId}
        onSelect={id => setActiveFolderId(prev => prev === id ? null : id)}
        onClear={() => { setActiveFolderId(null); setSearch(''); }}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Loading folders…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px 24px', minHeight: 120 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {filteredRoots.map(node => (
              <FolderTile key={node.id} node={node}
                fileCount={node.file_count + node.children.reduce((s, c) => s + c.file_count, 0)}
                onOpen={() => handleOpenFolder(node.id)} onRename={onRename} onDelete={onDelete}
                onUpload={(id, fs) => onUploadToFolder(id, fs)}
                canEdit={isMember} />
            ))}
            {filteredRoots.length === 0 && (
              <div style={{ width: '100%', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                <span style={{ fontSize: 40 }}>🗂️</span>
                {activeFolderId !== null || search.trim() ? (
                  <>
                    <p style={{ fontSize: 13, margin: 0 }}>No projects match your search</p>
                    <button onClick={() => { setActiveFolderId(null); setSearch(''); }} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
                  </>
                ) : (
                  <p style={{ fontSize: 13, margin: 0 }}>No folders yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}