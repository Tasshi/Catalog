// export const FILE_TYPE_CONFIG = {
//   pdf:  { bg: 'rgba(239,68,68,0.15)',   color: '#fc8181',  label: 'PDF',  badgeClass: 'badge-pdf' },
//   docx: { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd',  label: 'DOC',  badgeClass: 'badge-docx' },
//   doc:  { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd',  label: 'DOC',  badgeClass: 'badge-docx' },
//   xlsx: { bg: 'rgba(5,150,105,0.15)',   color: '#6ee7b7',  label: 'XLS',  badgeClass: 'badge-xlsx' },
//   xls:  { bg: 'rgba(5,150,105,0.15)',   color: '#6ee7b7',  label: 'XLS',  badgeClass: 'badge-xlsx' },
//   pptx: { bg: 'rgba(249,115,22,0.15)',  color: '#fdba74',  label: 'PPT',  badgeClass: 'badge-pptx' },
//   ppt:  { bg: 'rgba(249,115,22,0.15)',  color: '#fdba74',  label: 'PPT',  badgeClass: 'badge-pptx' },
//   zip:  { bg: 'rgba(168,85,247,0.15)',  color: '#d8b4fe',  label: 'ZIP',  badgeClass: 'badge-zip' },
//   rar:  { bg: 'rgba(168,85,247,0.15)',  color: '#d8b4fe',  label: 'RAR',  badgeClass: 'badge-zip' },
//   png:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
//   jpg:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
//   jpeg: { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
//   gif:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
//   mp4:  { bg: 'rgba(236,72,153,0.15)',  color: '#f9a8d4',  label: 'VID',  badgeClass: 'badge-img' },
//   txt:  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8',  label: 'TXT',  badgeClass: 'badge-personal' },
// };

// export function getFileConfig(ext) {
//   return FILE_TYPE_CONFIG[ext?.toLowerCase()] || {
//     bg: 'rgba(100,116,139,0.15)',
//     color: '#94a3b8',
//     label: (ext || 'FILE').toUpperCase().slice(0, 4),
//     badgeClass: 'badge-personal',
//   };
// }

// export function getFileExtension(filename) {
//   return filename?.split('.').pop()?.toLowerCase() || '';
// }

// export function extractAutoMetadata(file) {
//   return {
//     name: file.name,
//     fileType: getFileExtension(file.name),
//     sizeBytes: file.size,
//     lastModified: new Date(file.lastModified).toISOString(),
//   };
// }

// export const BADGE_COLORS = {
//   'badge-pdf':      { bg: 'rgba(239,68,68,0.12)',   color: '#fc8181',  border: 'rgba(239,68,68,0.2)' },
//   'badge-docx':     { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd',  border: 'rgba(59,130,246,0.2)' },
//   'badge-xlsx':     { bg: 'rgba(5,150,105,0.12)',   color: '#6ee7b7',  border: 'rgba(5,150,105,0.2)' },
//   'badge-pptx':     { bg: 'rgba(249,115,22,0.12)',  color: '#fdba74',  border: 'rgba(249,115,22,0.2)' },
//   'badge-zip':      { bg: 'rgba(168,85,247,0.12)',  color: '#d8b4fe',  border: 'rgba(168,85,247,0.2)' },
//   'badge-img':      { bg: 'rgba(234,179,8,0.12)',   color: '#fde68a',  border: 'rgba(234,179,8,0.2)' },
//   'badge-group':    { bg: 'rgba(34,211,238,0.1)',   color: '#22d3ee',  border: 'rgba(34,211,238,0.15)' },
//   'badge-personal': { bg: 'rgba(255,255,255,0.08)', color: '#64748b',  border: 'rgba(255,255,255,0.07)' },
// };
export const FILE_TYPE_CONFIG = {
  pdf:  { bg: 'rgba(239,68,68,0.15)',   color: '#fc8181',  label: 'PDF',  badgeClass: 'badge-pdf' },
  docx: { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd',  label: 'DOC',  badgeClass: 'badge-docx' },
  doc:  { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd',  label: 'DOC',  badgeClass: 'badge-docx' },
  xlsx: { bg: 'rgba(5,150,105,0.15)',   color: '#6ee7b7',  label: 'XLS',  badgeClass: 'badge-xlsx' },
  xls:  { bg: 'rgba(5,150,105,0.15)',   color: '#6ee7b7',  label: 'XLS',  badgeClass: 'badge-xlsx' },
  pptx: { bg: 'rgba(249,115,22,0.15)',  color: '#fdba74',  label: 'PPT',  badgeClass: 'badge-pptx' },
  ppt:  { bg: 'rgba(249,115,22,0.15)',  color: '#fdba74',  label: 'PPT',  badgeClass: 'badge-pptx' },
  zip:  { bg: 'rgba(168,85,247,0.15)',  color: '#d8b4fe',  label: 'ZIP',  badgeClass: 'badge-zip' },
  rar:  { bg: 'rgba(168,85,247,0.15)',  color: '#d8b4fe',  label: 'RAR',  badgeClass: 'badge-zip' },
  png:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
  jpg:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
  jpeg: { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
  gif:  { bg: 'rgba(234,179,8,0.15)',   color: '#fde68a',  label: 'IMG',  badgeClass: 'badge-img' },
  mp4:  { bg: 'rgba(236,72,153,0.15)',  color: '#f9a8d4',  label: 'VID',  badgeClass: 'badge-img' },
  txt:  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8',  label: 'TXT',  badgeClass: 'badge-personal' },
};

export function getFileConfig(ext: string) {
  return FILE_TYPE_CONFIG[ext?.toLowerCase() as keyof typeof FILE_TYPE_CONFIG] || {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: (ext || 'FILE').toUpperCase().slice(0, 4),
    badgeClass: 'badge-personal',
  };
}

export function getFileExtension(filename: string): string {
  return filename?.split('.').pop()?.toLowerCase() || '';
}

export function extractAutoMetadata(file: File) {
  return {
    name: file.name,
    fileType: getFileExtension(file.name),
    sizeBytes: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

export const BADGE_COLORS = {
  'badge-pdf':      { bg: 'rgba(239,68,68,0.12)',   color: '#fc8181',  border: 'rgba(239,68,68,0.2)' },
  'badge-docx':     { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd',  border: 'rgba(59,130,246,0.2)' },
  'badge-xlsx':     { bg: 'rgba(5,150,105,0.12)',   color: '#6ee7b7',  border: 'rgba(5,150,105,0.2)' },
  'badge-pptx':     { bg: 'rgba(249,115,22,0.12)',  color: '#fdba74',  border: 'rgba(249,115,22,0.2)' },
  'badge-zip':      { bg: 'rgba(168,85,247,0.12)',  color: '#d8b4fe',  border: 'rgba(168,85,247,0.2)' },
  'badge-img':      { bg: 'rgba(234,179,8,0.12)',   color: '#fde68a',  border: 'rgba(234,179,8,0.2)' },
  'badge-group':    { bg: 'rgba(34,211,238,0.1)',   color: '#22d3ee',  border: 'rgba(34,211,238,0.15)' },
  'badge-personal': { bg: 'rgba(255,255,255,0.08)', color: '#64748b',  border: 'rgba(255,255,255,0.07)' },
};