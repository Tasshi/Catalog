
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  color?: string;
  icon?: string;
  owner_id: string;
  created_at: string;
  mini_cohort_id?: string | null;  // FK to mini_cohorts
  group_members?: { count: number }[];
  files?: { count: number }[];
}

// ── SubGroup ────────────────────────────────────────────────────────────────
export interface SubGroup {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
}

export interface GroupCardProps {
  group: Group;
  onClick: (group: Group) => void;
}

export interface MetadataPanelProps {
  file: File | null;
  onSubmit: (data: {
    file: File;
    description: string;
    tags: string[];
    groupId: string | null;
    subGroupId: string | null;
  }) => void;
  uploading: boolean;
  progress: number;
}

export interface FileItem {
  id: string;
  name: string;
  ext?: string;
  file_type?: string;
  storage_path: string;
  sizeFormatted?: string;
  created_at?: string;
  groupName?: string;
  groupIcon?: string;
  authorName?: string;
  size_bytes?: number;
  group_id?: string | null;
  folder_id?: string | null;
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

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  created_at?: string;
  joined_at: string | null;
  profile?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
};

export interface FileDetail {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  storage_path: string;
  description?: string | null;
  tags?: string[];
  version?: number;
  created_at: string;
  group_id?: string | null;
  uploaded_by: string;
  uploaded_by_profile?: { full_name: string } | null;
  group?: { name: string; icon: string; description?: string } | null;
}

export interface UploadPayload {
  file:        File;
  projectName: string;
  description: string;
  tags:        string[];
  groupId:     string | null;
  subGroupId:  string | null;
  folderId:    string | null;
}

export interface FileRecord {
  id: string;
  name: string;
  size_bytes: number;
  is_deleted: boolean;
  created_at: string;
  group_id: string | null;
  folder_id: string | null;
  uploaded_by: string;
  storage_path: string;
  ext: string;
  sizeFormatted: string;
  authorName: string;
  groupName?: string;
  groupIcon?: string;
}
export interface MiniCohort {
  id:           string;
  name:         string;
  group_id:     string | null;
  project_name: string | null;
}

export interface Invitation {
  id:        string;
  email:     string;
  full_name: string | null;
  phone:     string | null;
  role:      string;
}