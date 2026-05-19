import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import type { SubGroup, FileRecord } from '../components/layout/ui/cons';

export function useSubfolders(groupId: string | null) {
  const { user } = useAuth();
  const [subfolders, setSubfolders] = useState<SubGroup[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!user || !groupId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('sub_groups')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) setSubfolders(data ?? []);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to fetch subfolders';
          console.error('[useSubfolders]', e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, groupId]);

  return { subfolders, loading, error };
}

export function useSubfolderFiles(subGroupId: string | null) {
  const { user } = useAuth();
  const [files,   setFiles]   = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user || !subGroupId) { setFiles([]); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('files')
          .select(`
            *,
            uploaded_by_profile:profiles!uploaded_by(full_name),
            group:groups(name, icon)
          `)
          .eq('is_deleted', false)
          .eq('folder_id', subGroupId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) setFiles(mapFiles(data ?? []));
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to fetch files';
          console.error('[useSubfolderFiles]', e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, subGroupId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapFiles(data: any[]): FileRecord[] {
    return data.map(f => ({
      ...f,
      ext:           getFileExtension(f.name),
      sizeFormatted: formatBytes(f.size_bytes),
      authorName:    f.uploaded_by_profile?.full_name ?? 'Unknown',
      groupName:     f.group?.name  ?? null,
      groupIcon:     f.group?.icon  ?? null,
    }));
  }

  return { files, loading, error };
}