import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { detectFileType, AUTO_FOLDER_META } from '../types/folder';
import type { FolderRecord, FileType } from '../types/folder';

// ── Tree builder ──────────────────────────────────────────────────────────────

function buildTree(flat: FolderRecord[]): FolderRecord[] {
  const map = new Map<string, FolderRecord>();
  flat.forEach(f => map.set(f.id, { ...f, children: [] }));

  const roots: FolderRecord[] = [];
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFolderTree(groupId: string) {
  const { user } = useAuth();
  const [roots,   setRoots]   = useState<FolderRecord[]>([]);
  // Start as true when groupId already present — no loading=false flash before fetch
  const [loading, setLoading] = useState(!!groupId);
  const [error,   setError]   = useState<string | null>(null);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchFolders = useCallback(async (gid: string) => {
    const u = userRef.current;

    if (!u || !gid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await db
        .from('subprojects')
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
  }, []);

  useEffect(() => {
    if (!user || !groupId) {
      setRoots([]);
      setLoading(false);
      return;
    }

    // Set synchronously before async fetch — closes the flash gap
    setLoading(true);
    fetchFolders(groupId);
  }, [user, groupId, fetchFolders]);

  const refetch = useCallback(() => fetchFolders(groupId), [fetchFolders, groupId]);

  // ── createFolder ──────────────────────────────────────────────────────────

  const createFolder = useCallback(async (
    name: string,
    parentId: string | null,
    _icon = '📁',
  ): Promise<string | null> => {
    const u = userRef.current;
    if (!u || !groupId) return null;

    const payload: Record<string, unknown> = {
      group_id:   groupId,
      name,
      created_by: u.id,
    };
    if (parentId) payload.parent_id = parentId;

    try {
      const { data, error: insertError } = await db
        .from('subprojects')
        .insert(payload)
        .select()
        .single() as { data: FolderRecord; error: unknown };

      if (insertError) {
        const msg = (insertError as { message?: string }).message ?? JSON.stringify(insertError);
        console.error('[createFolder] insert failed:', msg, '| payload:', payload);
        setError(`Failed to create folder: ${msg}`);
        return null;
      }

      await fetchFolders(groupId);
      return data.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[createFolder] exception:', msg);
      setError(`Failed to create folder: ${msg}`);
      return null;
    }
  }, [groupId, fetchFolders]);

  // ── ensureAutoFolder ──────────────────────────────────────────────────────

  const ensureAutoFolder = useCallback(async (
    type: FileType,
    parentId: string | null,
  ): Promise<string | null> => {
    const u = userRef.current;
    if (!u || !groupId) return null;

    const meta = AUTO_FOLDER_META[type];

    let query = db
      .from('subprojects')
      .select('id')
      .eq('group_id', groupId)
      .eq('name', meta.label);

    query = parentId
      ? query.eq('parent_id', parentId)
      : query.is('parent_id', null);

    const { data: existing } = await query.maybeSingle() as { data: { id: string } | null };
    if (existing) return existing.id;

    const payload: Record<string, unknown> = {
      group_id:   groupId,
      name:       meta.label,
      created_by: u.id,
    };
    if (parentId) payload.parent_id = parentId;

    const { data, error: insertError } = await db
      .from('subprojects')
      .insert(payload)
      .select()
      .single() as { data: FolderRecord; error: unknown };

    if (insertError) {
      console.error('[ensureAutoFolder]', insertError);
      return null;
    }
    return data.id;
  }, [groupId]);

  // ── renameFolder ──────────────────────────────────────────────────────────

  const renameFolder = useCallback(async (id: string, name: string) => {
    if (!userRef.current) return;

    const { error: updateError } = await db
      .from('subprojects')
      .update({ name })
      .eq('id', id);

    if (updateError) { console.error('[renameFolder]', updateError); return; }
    await fetchFolders(groupId);
  }, [groupId, fetchFolders]);

  // ── deleteFolder ──────────────────────────────────────────────────────────

  const deleteFolder = useCallback(async (id: string) => {
    if (!userRef.current) return;

    const { error: deleteError } = await db
      .from('subprojects')
      .delete()
      .eq('id', id);

    if (deleteError) { console.error('[deleteFolder]', deleteError); return; }
    await fetchFolders(groupId);
  }, [groupId, fetchFolders]);

  // ── moveFileToFolder ──────────────────────────────────────────────────────

  const moveFileToFolder = useCallback(async (
    fileId: string,
    folderId: string,
  ) => {
    const { error: updateError } = await db
      .from('files')
      .update({ folder_id: folderId })
      .eq('id', fileId);

    if (updateError) { console.error('[moveFileToFolder]', updateError); return; }
    await fetchFolders(groupId);
  }, [groupId, fetchFolders]);

  // ── autoSortFile ──────────────────────────────────────────────────────────

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
    refetch,
    createFolder,
    ensureAutoFolder,
    renameFolder,
    deleteFolder,
    moveFileToFolder,
    autoSortFile,
  };
}