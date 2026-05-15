// src/types/folder.ts

export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'img' | 'other';

export interface FolderRecord {
  id:         string;
  group_id:   string;
  parent_id:  string | null;
  name:       string;
  icon:       string;
  is_auto:    boolean;
  auto_type:  FileType | null;
  created_by: string;
  created_at: string;
  // client-side only (built after fetch)
  children:   FolderRecord[];
  file_count: number;
}

export const AUTO_FOLDER_META: Record<FileType, { label: string; icon: string }> = {
  pdf:   { label: 'PDFs',         icon: '📕' },
  docx:  { label: 'Documents',    icon: '📝' },
  xlsx:  { label: 'Spreadsheets', icon: '📊' },
  pptx:  { label: 'Slides',       icon: '📽️' },
  zip:   { label: 'Archives',     icon: '🗜️' },
  img:   { label: 'Images',       icon: '🖼️' },
  other: { label: 'Other',        icon: '📄' },
};

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                                               return 'pdf';
  if (['doc', 'docx'].includes(ext))                              return 'docx';
  if (['xls', 'xlsx'].includes(ext))                              return 'xlsx';
  if (['ppt', 'pptx'].includes(ext))                              return 'pptx';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))            return 'zip';
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'img';
  return 'other';
}