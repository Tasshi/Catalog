import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { detectFileType, AUTO_FOLDER_META } from '../types/folder';
import type { FolderRecord, FileType } from '../types/folder';

// ── Tree builder ───────────────────────────────────────────────────────────────

function buildTree(flat: FolderRecord[]): FolderRecord[] {
  const map = new Map<string, FolderRecord>();
  flat.forEach(f => map.set(f.id, { ...f, children: [] }));

  const roots: FolderRecord[] = [];
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ── Typed supabase helper — bypasses missing generated types ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFolderTree(groupId: string) {
  const { user } = useAuth();
  const [roots,   setRoots]   = useState<FolderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Keep latest user/groupId in a ref so the effect never needs them as deps
  const ctxRef = useRef({ user, groupId });
  useEffect(() => { ctxRef.current = { user, groupId }; });

  // ── fetch all folders for this group (flat, then build tree) ──────────────

  const fetchFolders = useCallback(async () => {
    const { user: u, groupId: gid } = ctxRef.current;
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db
        .from('folders')
        .select('*')
        .eq('group_id', gid)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const flat: FolderRecord[] = (data ?? []).map((f: FolderRecord) => ({
        ...f,
        children:   [],
        file_count: 0,
      }));

      const folderIds = flat.map(f => f.id);
      const countMap: Record<string, number> = {};

      if (folderIds.length > 0) {
        const { data: fileCounts } = await db
          .from('files')
          .select('folder_id')
          .in('folder_id', folderIds)
          .eq('is_deleted', false);

        (fileCounts ?? []).forEach((f: { folder_id: string | null }) => {
          if (f.folder_id) countMap[f.folder_id] = (countMap[f.folder_id] ?? 0) + 1;
        });
      }

      flat.forEach(f => { f.file_count = countMap[f.id] ?? 0; });
      setRoots(buildTree(flat));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load folders';
      console.error('[fetchFolders]', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []); // ← stable: no deps, reads live values from ctxRef

  // ── Fetch on mount and whenever user or groupId changes ───────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const { user: u, groupId: gid } = ctxRef.current;
      if (!u) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await db
          .from('folders')
          .select('*')
          .eq('group_id', gid)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        const flat: FolderRecord[] = (data ?? []).map((f: FolderRecord) => ({
          ...f,
          children:   [],
          file_count: 0,
        }));

        const folderIds = flat.map(f => f.id);
        const countMap: Record<string, number> = {};

        if (folderIds.length > 0) {
          const { data: fileCounts } = await db
            .from('files')
            .select('folder_id')
            .in('folder_id', folderIds)
            .eq('is_deleted', false);

          (fileCounts ?? []).forEach((f: { folder_id: string | null }) => {
            if (f.folder_id) countMap[f.folder_id] = (countMap[f.folder_id] ?? 0) + 1;
          });
        }

        flat.forEach(f => { f.file_count = countMap[f.id] ?? 0; });
        if (!cancelled) setRoots(buildTree(flat));
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to load folders';
          console.error('[fetchFolders effect]', e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, groupId]); // ✅ primitive deps, no fetchFolders in dep chain

  // ── createFolder ──────────────────────────────────────────────────────────

  const createFolder = useCallback(async (
    name: string,
    parentId: string | null,
    icon = '📁',
  ): Promise<string | null> => {
    const { user: u, groupId: gid } = ctxRef.current;
    if (!u) return null;
    try {
      const { data, error: insertError } = await db
        .from('folders')
        .insert({
          group_id:   gid,
          parent_id:  parentId,
          name,
          icon,
          is_auto:    false,
          auto_type:  null,
          created_by: u.id,
        })
        .select()
        .single() as { data: FolderRecord; error: unknown };

      if (insertError) throw insertError;
      await fetchFolders();
      return data.id;
    } catch (e: unknown) {
      console.error('[createFolder]', e);
      return null;
    }
  }, [fetchFolders]);

  // ── ensureAutoFolder — finds or creates a typed bucket ────────────────────

  const ensureAutoFolder = useCallback(async (
    type: FileType,
    parentId: string | null,
  ): Promise<string | null> => {
    const { user: u, groupId: gid } = ctxRef.current;
    if (!u) return null;

    const { data: existing } = await db
      .from('folders')
      .select('id')
      .eq('group_id', gid)
      .eq('is_auto', true)
      .eq('auto_type', type)
      .eq(parentId ? 'parent_id' : 'is_auto', parentId ?? true)
      .maybeSingle() as { data: { id: string } | null };

    if (existing) return existing.id;

    const meta = AUTO_FOLDER_META[type];
    const { data, error: insertError } = await db
      .from('folders')
      .insert({
        group_id:   gid,
        parent_id:  parentId,
        name:       meta.label,
        icon:       meta.icon,
        is_auto:    true,
        auto_type:  type,
        created_by: u.id,
      })
      .select()
      .single() as { data: FolderRecord; error: unknown };

    if (insertError) {
      console.error('[ensureAutoFolder]', insertError);
      return null;
    }
    return data.id;
  }, []);

  // ── renameFolder ──────────────────────────────────────────────────────────

  const renameFolder = useCallback(async (id: string, name: string) => {
    const { error: updateError } = await db
      .from('folders')
      .update({ name })
      .eq('id', id);

    if (updateError) { console.error('[renameFolder]', updateError); return; }
    await fetchFolders();
  }, [fetchFolders]);

  // ── deleteFolder ──────────────────────────────────────────────────────────

  const deleteFolder = useCallback(async (id: string) => {
    const { error: deleteError } = await db
      .from('folders')
      .delete()
      .eq('id', id);

    if (deleteError) { console.error('[deleteFolder]', deleteError); return; }
    await fetchFolders();
  }, [fetchFolders]);

  // ── moveFileToFolder — sets folder_id on an existing file ─────────────────

  const moveFileToFolder = useCallback(async (
    fileId: string,
    folderId: string,
  ) => {
    const { error: updateError } = await db
      .from('files')
      .update({ folder_id: folderId })
      .eq('id', fileId);

    if (updateError) { console.error('[moveFileToFolder]', updateError); return; }
    await fetchFolders();
  }, [fetchFolders]);

  // ── autoSortFile — detect type, ensure bucket, assign file ───────────────

  const autoSortFile = useCallback(async (
    fileId: string,
    filename: string,
    parentId: string | null = null,
  ) => {
    const type     = detectFileType(filename);
    const folderId = await ensureAutoFolder(type, parentId);
    if (!folderId) return;
    await moveFileToFolder(fileId, folderId);
  }, [ensureAutoFolder, moveFileToFolder]);

  return {
    roots,
    loading,
    error,
    refetch:          fetchFolders,
    createFolder,
    ensureAutoFolder,
    renameFolder,
    deleteFolder,
    moveFileToFolder,
    autoSortFile,
  };
}