import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import { FileRecord } from '../components/ui/cons';

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useFiles(groupId: string | null = null) {
  const { user } = useAuth();
  const [files, setFiles]     = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('files')
        .select(`
          *,
          uploaded_by_profile:profiles!uploaded_by(full_name),
          group:groups(name, icon)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (groupId) query = query.eq('group_id', groupId);
      else         query = query.eq('uploaded_by', user.id);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setFiles(
        (data || []).map(f => ({
          ...f,
          ext:          getFileExtension(f.name),
          sizeFormatted: formatBytes(f.size_bytes),
          authorName:   f.uploaded_by_profile?.full_name ?? 'Unknown',
          groupName:    f.group?.name    ?? null,
          groupIcon:    f.group?.icon    ?? null,
        }))
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch files';
      console.error('[fetchFiles]', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function deleteFile(fileId: string): Promise<void> {
    const { error: deleteError } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', fileId);

    if (deleteError) throw new Error(deleteError.message);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }

  async function logAction(fileId: string, action: string): Promise<void> {
    if (!user) return;
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({ file_id: fileId, user_id: user.id, action });

    if (logError) console.error('[logAction]', logError);
  }

  return { files, loading, error, refetch: fetchFiles, deleteFile, logAction };
}