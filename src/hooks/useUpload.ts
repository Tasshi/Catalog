import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile as storageUpload } from '../lib/storage';
import { getFileExtension, extractAutoMetadata } from '../lib/metadata';
import { useAuth } from '../contexts/AuthContext';

export function useUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function uploadFile({ file, description, tags, groupId }) {
    if (!user || !file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const storagePath = await storageUpload(file, user.id, setProgress);
      const auto = extractAutoMetadata(file);

      const { data, error } = await supabase.from('files').insert({
        name: auto.name,
        file_type: auto.fileType,
        size_bytes: auto.sizeBytes,
        storage_path: storagePath,
        description: description || null,
        tags: tags || [],
        group_id: groupId || null,
        uploaded_by: user.id,
        version: 1,
      }).select().single();

      if (error) throw error;

      // Log upload action
      await supabase.from('audit_logs').insert({
        file_id: data.id,
        user_id: user.id,
        action: 'upload',
      });

      setProgress(100);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading, progress, error };
}
