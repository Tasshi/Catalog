import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

// ── Query fn ──────────────────────────────────────────────────────────────────

async function loadFolderTree(groupId: string): Promise<FolderRecord[]> {
  const { data, error: fetchError } = await db
    .from('subprojects')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (fetchError) throw new Error(fetchError.message);

  const flat: FolderRecord[] = (data ?? []).map((f: FolderRecord) => ({
    ...f,
    children:        [],
    file_count:      0,
    mini_cohort_ids: f.mini_cohort_id ? [f.mini_cohort_id] : [],
  }));

  const folderIds = flat.map(f => f.id);
  const countMap:     Record<string, number>   = {};
  const cohortIdsMap: Record<string, Set<string>> = {};

  if (folderIds.length > 0) {
    const { data: fileData } = await db
      .from('files')
      .select('folder_id, mini_cohort_id')
      .in('folder_id', folderIds)
      .eq('is_deleted', false);

    (fileData ?? []).forEach((f: { folder_id: string | null; mini_cohort_id: string | null }) => {
      if (!f.folder_id) return;
      countMap[f.folder_id] = (countMap[f.folder_id] ?? 0) + 1;
      if (f.mini_cohort_id) {
        if (!cohortIdsMap[f.folder_id]) cohortIdsMap[f.folder_id] = new Set();
        cohortIdsMap[f.folder_id].add(f.mini_cohort_id);
      }
    });
  }

  flat.forEach(f => {
    f.file_count = countMap[f.id] ?? 0;
    const fromFiles = Array.from(cohortIdsMap[f.id] ?? []);
    // Merge: direct folder assignment + ids derived from files (deduplicated)
    f.mini_cohort_ids = Array.from(new Set([...f.mini_cohort_ids, ...fromFiles]));
  });
  return buildTree(flat);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFolderTree(groupId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const key = ['folder-tree', groupId] as const;

  const { data: roots = [], isLoading: loading } = useQuery({
    queryKey:  key,
    queryFn:   () => loadFolderTree(groupId),
    enabled:   !!user && !!groupId,
    staleTime: 3 * 60 * 1000,
  });

  const error = mutationError;

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: key }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, groupId],
  );

  // ── createFolder ──────────────────────────────────────────────────────────

  const createFolder = useCallback(async (
    name: string,
    parentId: string | null,
    icon?: string,
  ): Promise<string | null> => {
    const u = userRef.current;
    if (!u || !groupId) return null;

    const payload: Record<string, unknown> = { group_id: groupId, name, created_by: u.id };
    if (parentId) payload.parent_id = parentId;
    if (icon)     payload.icon      = icon;

    try {
      const { data, error: insertError } = await db
        .from('subprojects').insert(payload).select().single() as { data: FolderRecord; error: unknown };

      if (insertError) {
        const msg = (insertError as { message?: string }).message ?? JSON.stringify(insertError);
        console.error('[createFolder] insert failed:', msg, '| payload:', payload);
        setMutationError(`Failed to create folder: ${msg}`);
        return null;
      }

      await queryClient.invalidateQueries({ queryKey: key });
      return data.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[createFolder] exception:', msg);
      setMutationError(`Failed to create folder: ${msg}`);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, queryClient]);

  // ── ensureAutoFolder ──────────────────────────────────────────────────────

  const ensureAutoFolder = useCallback(async (
    type: FileType,
    parentId: string | null,
  ): Promise<string | null> => {
    const u = userRef.current;
    if (!u || !groupId) return null;

    const meta = AUTO_FOLDER_META[type];

    let query = db.from('subprojects').select('id').eq('group_id', groupId).eq('name', meta.label);
    query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);

    const { data: existing } = await query.maybeSingle() as { data: { id: string } | null };
    if (existing) return existing.id;

    const payload: Record<string, unknown> = { group_id: groupId, name: meta.label, created_by: u.id };
    if (parentId) payload.parent_id = parentId;

    const { data, error: insertError } = await db
      .from('subprojects').insert(payload).select().single() as { data: FolderRecord; error: unknown };

    if (insertError) { console.error('[ensureAutoFolder]', insertError); return null; }
    return data.id;
  }, [groupId]);

  // ── renameFolder ──────────────────────────────────────────────────────────

  const renameFolder = useCallback(async (id: string, name: string) => {
    if (!userRef.current) return;
    const { error: updateError } = await db.from('subprojects').update({ name }).eq('id', id);
    if (updateError) { console.error('[renameFolder]', updateError); return; }
    await queryClient.invalidateQueries({ queryKey: key });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, queryClient]);

  // ── deleteFolder ──────────────────────────────────────────────────────────

  const deleteFolder = useCallback(async (id: string) => {
    if (!userRef.current) return;
    const { error: deleteError } = await db.from('subprojects').delete().eq('id', id);
    if (deleteError) { console.error('[deleteFolder]', deleteError); return; }
    await queryClient.invalidateQueries({ queryKey: key });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, queryClient]);

  // ── moveFileToFolder ──────────────────────────────────────────────────────

  const moveFileToFolder = useCallback(async (fileId: string, folderId: string) => {
    const { error: updateError } = await db.from('files').update({ folder_id: folderId }).eq('id', fileId);
    if (updateError) { console.error('[moveFileToFolder]', updateError); return; }
    await queryClient.invalidateQueries({ queryKey: key });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, queryClient]);

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