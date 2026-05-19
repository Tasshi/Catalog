export const EXT_ICON: Record<string, string> = {
  pdf: '📕', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
  pptx: '📽️', ppt: '📽️', zip: '🗜️', rar: '🗜️',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
  mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵', other: '📄',
};
export const EXT_COLOR: Record<string, string> = {
  pdf: '#ef4444', docx: '#3b82f6', doc: '#3b82f6',
  xlsx: '#22c55e', xls: '#22c55e', pptx: '#f97316', ppt: '#f97316',
  zip: '#8b5cf6', rar: '#8b5cf6',
  jpg: '#ec4899', jpeg: '#ec4899', png: '#ec4899', gif: '#ec4899',
  webp: '#ec4899', svg: '#ec4899',
  mp4: '#06b6d4', mov: '#06b6d4', mp3: '#f59e0b', wav: '#f59e0b',
  other: '#94a3b8',
};
export const PALETTES = [
  { tab: '#b45309', body: '#d97706' },
  { tab: '#1d4ed8', body: '#3b82f6' },
  { tab: '#047857', body: '#10b981' },
  { tab: '#6d28d9', body: '#8b5cf6' },
  { tab: '#b91c1c', body: '#ef4444' },
  { tab: '#065f46', body: '#059669' },
  { tab: '#0369a1', body: '#0ea5e9' },
  { tab: '#9d174d', body: '#ec4899' },
] as const;

export const ICONS = ['📁', '📂', '📊', '🗂️', '🗃️', '📋', '📌', '🏷️'];

export const ROLE_STYLES = {
  owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
  editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
  viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
};