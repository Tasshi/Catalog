import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile as storageUpload } from '../lib/storage';
import { extractAutoMetadata } from '../lib/metadata';
import { useAuth } from '../contexts/AuthContext';

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
    folderId,       // ← subproject/folder to store the file under
  }: {
    file: File;
    description?: string;
    tags?: string[];
    groupId?: string | null;
    folderId?: string | null;   // ← added
  }) {
    if (!user || !file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const storagePath = await storageUpload(file, user.id, setProgress);
      const auto = extractAutoMetadata(file);

      const { data, error: insertError } = await supabase
        .from('files')
        .insert({
          name:         auto.name,
          file_type:    auto.fileType,
          size_bytes:   auto.sizeBytes,
          storage_path: storagePath,
          description:  description || null,
          tags:         tags || [],
          group_id:     groupId  || null,
          folder_id:    folderId || null,   // ← saves into the subproject folder
          uploaded_by:  user.id,
          version:      1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log upload action
      await supabase.from('audit_logs').insert({
        file_id: data.id,
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