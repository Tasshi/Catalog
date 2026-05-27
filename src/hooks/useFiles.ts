import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import type { FileRecord } from '../components/layout/ui/cons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFiles(data: any[]): FileRecord[] {
  return data.map(f => ({
    ...f,
    ext:           getFileExtension(f.name),
    sizeFormatted: formatBytes(f.size_bytes),
    authorName:    f.uploaded_by_profile?.full_name ?? 'Unknown',
    groupName:     f.group?.name ?? null,
    groupIcon:     f.group?.icon ?? null,
  }));
}

async function fetchFilesQuery(userId: string, groupId: string | null): Promise<FileRecord[]> {
  const SELECT = `*, uploaded_by_profile:profiles!uploaded_by(full_name), group:groups(name, icon)`;

  if (groupId) {
    const { data, error } = await db
      .from('files').select(SELECT)
      .eq('is_deleted', false).eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return mapFiles(data ?? []);
  }

  const { data: ownFiles, error: e1 } = await db
    .from('files').select(SELECT)
    .eq('is_deleted', false).eq('uploaded_by', userId)
    .order('created_at', { ascending: false });
  if (e1) throw new Error(e1.message);

  // Use the same group visibility as useGroups — no user filter, RLS controls access.
  // This is intentional: group_members only tracks explicit membership rows, but the
  // groups table (and its RLS) is the authoritative source for what groups are visible.
  const { data: visibleGroups } = await db.from('groups').select('id');
  const visibleGroupIds: string[] = (visibleGroups ?? []).map((g: { id: string }) => g.id);

  let groupFiles: FileRecord[] = [];
  if (visibleGroupIds.length > 0) {
    const { data: gf, error: e2 } = await db
      .from('files').select(SELECT)
      .eq('is_deleted', false).in('group_id', visibleGroupIds)
      .order('created_at', { ascending: false });
    if (e2) throw new Error(e2.message);
    groupFiles = (gf ?? []) as FileRecord[];

    // Also pick up files uploaded into a subproject folder but with group_id = null.
    const { data: folderRows } = await db
      .from('subprojects').select('id').in('group_id', visibleGroupIds);
    const folderIds: string[] = (folderRows ?? []).map((r: { id: string }) => r.id);
    if (folderIds.length > 0) {
      const { data: ff } = await db
        .from('files').select(SELECT)
        .eq('is_deleted', false).in('folder_id', folderIds)
        .order('created_at', { ascending: false });
      groupFiles = [...groupFiles, ...((ff ?? []) as FileRecord[])];
    }
  }

  const merged = [...(ownFiles ?? []), ...groupFiles];
  const seen = new Set<string>();
  return mapFiles(merged.filter(f => { if (seen.has(f.id)) return false; seen.add(f.id); return true; }));
}

export function useFiles(groupId: string | null = null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['files', user?.id ?? null, groupId] as const;

  const { data: files = [], isLoading: loading, error: queryError } = useQuery({
    queryKey:  key,
    queryFn:   () => fetchFilesQuery(user!.id, groupId),
    enabled:   !!user,
    staleTime: 3 * 60 * 1000,
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to fetch files' : null;

  async function deleteFile(fileId: string): Promise<void> {
    const { error: deleteError } = await db.from('files').update({ is_deleted: true }).eq('id', fileId);
    if (deleteError) throw new Error(deleteError.message);
    queryClient.setQueryData(key, (old: FileRecord[] = []) => old.filter(f => f.id !== fileId));
  }

  async function logAction(fileId: string, action: string): Promise<void> {
    if (!user) return;
    const { error: logError } = await db.from('audit_logs').insert({ file_id: fileId, user_id: user.id, action });
    if (logError) console.error('[logAction]', logError);
  }

  function refetch() {
    return queryClient.invalidateQueries({ queryKey: key });
  }

  return { files, loading, error, deleteFile, logAction, refetch };
}