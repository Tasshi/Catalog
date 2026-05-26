import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile as storageUpload } from '../lib/storage';
import { extractAutoMetadata } from '../lib/metadata';
import { useAuth } from '../contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile({
  file,
  description,
  tags,
  groupId,
  folderId,
  miniCohortId,
}: {
  file:          File;
  description?:  string;
  tags?:         string[];
  groupId?:      string | null;
  folderId?:     string | null;
  miniCohortId?: string | null;  // ← add this
}) {
    if (!user || !file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const storagePath = await storageUpload(file, user.id, setProgress);
      const auto = extractAutoMetadata(file);

      // storage_path is always unique (userId/timestamp/uuid/filename),
      // so a plain insert is safe. No upsert needed — each upload produces
      // a brand-new path, so duplicates cannot occur at the DB level.
      // folder_id is set only when explicitly provided; null = file stays
      // at root without triggering autoSortFile to create an unwanted folder.
      const { data, error: insertError } = await db
        .from('files')
        .insert({
            name:           auto.name,
            file_type:      auto.fileType,
            size_bytes:     auto.sizeBytes,
            storage_path:   storagePath,
            description:    description || null,
            tags:           tags || [],
            group_id:       groupId       || null,
            folder_id:      folderId      || null,
            mini_cohort_id: miniCohortId  || null,  // ← add this
            uploaded_by:    user.id,
            version:        1,
          })
        .select()
        .single() as { data: { id: string } | null; error: unknown };

      if (insertError) throw insertError;

      await db.from('audit_logs').insert({
        file_id: data!.id,
        user_id: user.id,
        action:  'upload',
      });

      setProgress(100);
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading, progress, error };
}