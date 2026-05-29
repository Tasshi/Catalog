import { supabase } from './supabase';

export const BUCKET = 'filevault';
// Use the URL the supabase client was initialised with — guaranteed to be correct
// regardless of whether VITE_SUPABASE_URL is set in the deployment environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SUPABASE_URL: string = (supabase as any).supabaseUrl as string;

// ── Upload ─────────────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  userId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  //const ext  = file.name.split('.').pop() ?? 'bin';
  // Stronger unique path: userId / timestamp + random + original sanitised name
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${crypto.randomUUID()}_${safe}`;

  if (onProgress) {
    await uploadWithProgress(file, path, onProgress);
  } else {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true }); // upsert:true avoids 409

    if (error) throw new Error(error.message);
  }

  return path;
}

async function uploadWithProgress(
  file: File,
  path: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('x-upsert', 'true'); // ← was 'false', caused 409 on retry
    xhr.setRequestHeader('cache-control', '3600');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body?.error ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    const form = new FormData();
    form.append('', file);
    xhr.send(form);
  });
}

// ── URLs ───────────────────────────────────────────────────────────────────────

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// ── Delete ─────────────────────────────────────────────────────────────────────

export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

// ── Download ───────────────────────────────────────────────────────────────────
export async function downloadFile(path: string, filename: string): Promise<void> {
  const cleanPath = path.startsWith(`${BUCKET}/`) ? path.slice(BUCKET.length + 1) : path;

  const { data, error } = await supabase.storage.from(BUCKET).download(cleanPath);
  if (error) throw new Error(error.message);

  const url = URL.createObjectURL(data);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
