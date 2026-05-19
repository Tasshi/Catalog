import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import type { FileRecord } from '../components/layout/ui/cons';

export function useFiles(groupId: string | null = null) {
  const { user } = useAuth();
  const [files,   setFiles]   = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── Map raw rows to FileRecord ────────────────────────────────────────────
  // Declared before useEffect / fetchFiles so it is available when called.

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

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchFiles(): Promise<void> {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (groupId) {
        // ── Group view: all files in this specific group ──────────────────
        const { data, error: fetchError } = await supabase
          .from('files')
          .select(`
            *,
            uploaded_by_profile:profiles!uploaded_by(full_name),
            group:groups(name, icon)
          `)
          .eq('is_deleted', false)
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setFiles(mapFiles(data ?? []));

      } else {
        // ── Catalog view: own files + files in groups user belongs to ─────

        // Step 1: get all group_ids this user is a member of
        const { data: memberships, error: memberError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        const memberGroupIds: string[] = (memberships ?? []).map(m => m.group_id);

        const SELECT = `
          *,
          uploaded_by_profile:profiles!uploaded_by(full_name),
          group:groups(name, icon)
        `;

        // Step 2a: fetch files uploaded by user
        const { data: ownFiles, error: e1 } = await supabase
          .from('files')
          .select(SELECT)
          .eq('is_deleted', false)
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false });

        if (e1) throw e1;

        let groupFiles: FileRecord[] = [];

        if (memberGroupIds.length > 0) {
          // Step 2b: fetch files in user's groups
          const { data: gf, error: e2 } = await supabase
            .from('files')
            .select(SELECT)
            .eq('is_deleted', false)
            .in('group_id', memberGroupIds)
            .order('created_at', { ascending: false });

          if (e2) throw e2;
          groupFiles = (gf ?? []) as FileRecord[];
        }

        // Step 2c: merge and deduplicate by id
        const merged = [...(ownFiles ?? []), ...groupFiles];
        const seen = new Set<string>();
        const deduped = merged.filter(f => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });

        setFiles(mapFiles(deduped));
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch files';
      console.error('[fetchFiles]', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => { await fetchFiles(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupId]);

  // ── Mutations ─────────────────────────────────────────────────────────────

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

  return { files, loading, error, deleteFile, logAction, refetch: fetchFiles };
}