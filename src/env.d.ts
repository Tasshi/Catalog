export type Profile = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'member';
  created_at: string;
};

export type FileRecord = {
  id: string;
  name: string;
  storage_path: string;
  group_id: string | null;
  uploaded_by: string;
};