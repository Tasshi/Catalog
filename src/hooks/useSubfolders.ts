import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../lib/storage';
import { getFileExtension } from '../lib/metadata';
import type { SubGroup, FileRecord } from '../components/layout/ui/cons';

// ─── useSubfolders ────────────────────────────────────────────────────────────
// Fetches all sub-folders (subprojects) belonging to a group.

export function useSubfolders(groupId: string | null) {
  const { user } = useAuth();
  const [subfolders, setSubfolders] = useState<SubGroup[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!user || !groupId) {
      setSubfolders([]);
      setLoading(false);
      return;
    }

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

// ─── useSubfolderFiles ────────────────────────────────────────────────────────
// Fetches all non-deleted files in a given sub-folder (subproject).
// Joins uploader profile and group for display in FileRow / FileCard / FileDetail.

export function useSubfolderFiles(subGroupId: string | null) {
  const { user } = useAuth();
  const [files,   setFiles]   = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user || !subGroupId) {
      setFiles([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('files')
          .select(`
            *,
            uploaded_by_profile:profiles!uploaded_by(full_name, email, avatar_url),
            group:groups(id, name, icon)
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

  return { files, loading, error };
}

// ─── mapFiles ─────────────────────────────────────────────────────────────────
// Normalises raw Supabase rows into FileRecord shape used across the UI.
// Exposed separately so other hooks/pages can reuse the same mapping logic.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFiles(data: any[]): FileRecord[] {
  return data.map(f => ({
    ...f,
    // Derived display fields
    ext:           getFileExtension(f.name),
    file_type:     getFileExtension(f.name),   // alias used by FileRow / FileCard
    sizeFormatted: formatBytes(f.size_bytes ?? 0),

    // Uploader
    authorName:   f.uploaded_by_profile?.full_name ?? 'Unknown',
    authorEmail:  f.uploaded_by_profile?.email     ?? null,
    authorAvatar: f.uploaded_by_profile?.avatar_url ?? null,

    // Group — keep raw join AND flat fields so FileDetail's group query
    // can be skipped if the file was loaded through this hook.
    groupId:   f.group?.id   ?? f.group_id  ?? null,
    groupName: f.group?.name ?? null,
    groupIcon: f.group?.icon ?? null,
  }));
}