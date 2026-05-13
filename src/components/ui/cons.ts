export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

export interface AvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  children: React.ReactNode;
  className?: string;
}
export interface BadgeProps {
  type?: string;
  children: React.ReactNode;
}
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}


export interface ToastProps {
  toast: ToastData | null;
}
export interface FormFieldProps {
  label: string;
  auto?: boolean;
  children: React.ReactNode;
}

export interface GroupMemberCount {
  count: number;
}

export interface FileCount {
  count: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  owner_id: string;
  created_at: string;
  group_members?: { count: number }[];
  files?: { count: number }[];  // optional — may not exist yet
}

export interface GroupCardProps {
  group: Group;
  onClick: (group: Group) => void;
}

export interface MetadataPanelProps {
  file: File | null;
  onSubmit: (data: { file: File; description: string; tags: string[]; groupId: string | null }) => void;
  uploading: boolean;
  progress: number;
}

export interface FileItem {
  id: string;
  name: string;
  ext?: string;
  file_type?: string;
  sizeFormatted?: string;
  created_at?: string;
  groupName?: string;
  groupIcon?: string;
  authorName?: string;
  size_bytes?: string;
}

export type IconSize = 'sm' | 'md' | 'lg';

export interface FileIconProps {
  ext: string;
  size?: IconSize;
}

export interface FileRowProps {
  file: FileItem;
  onView: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
}

export interface FileCardProps {
  file: FileItem;
  onView: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
}
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  profile?: { full_name: string; avatar_url: string };
}
export interface FileRecord {
  id: string;
  name: string;
  size_bytes: number;
  is_deleted: boolean;
  created_at: string;
  group_id: string | null;
  uploaded_by: string;
  // joined
  ext: string;
  sizeFormatted: string;
  authorName: string;
  groupName: string | null;
  groupIcon: string | null;
}