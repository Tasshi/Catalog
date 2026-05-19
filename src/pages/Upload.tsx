// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import UploadZone from '../components/upload/UploadZone';
// import MetadataPanel from '../components/upload/MetadataPanel';
// import { useUpload } from '../hooks/useUpload';
// import { useApp } from '../contexts/AppContext';
// import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabase';

// export default function Upload() {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const { uploadFile, uploading, progress } = useUpload();
//   const { showToast } = useApp();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   function handleFilesSelected(incoming: File[]) {
//     setSelectedFiles(prev => {
//       // Deduplicate by name+size
//       const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
//       const fresh = incoming.filter(f => !existing.has(`${f.name}-${f.size}`));
//       return [...prev, ...fresh];
//     });
//   }

//   function handleRemove(index: number) {
//     setSelectedFiles(prev => prev.filter((_, i) => i !== index));
//   }

//   async function handleSubmit(meta: {
//     projectName: string;
//     description: string;
//     tags:        string[];
//     groupId:     string | null;
//     subGroupId:  string | null;
//     folderId:    string | null;
//   }) {
//     if (selectedFiles.length === 0) return;

//     try {
//       let targetFolderId = meta.folderId;

//       // ── Step 1: create a new top-level subproject if project name given ──
//       if (meta.projectName.trim() && meta.groupId) {
//         const { data: newFolder, error: folderError } = await supabase
//           .from('subprojects')
//           .insert({
//             group_id:    meta.groupId,
//             name:        meta.projectName.trim(),
//             description: meta.description.trim() || null,
//             tags:        meta.tags.length > 0 ? meta.tags : [],
//             created_by:  user?.id ?? null,
//           })
//           .select('id')
//           .single();

//         if (folderError) throw new Error(`Failed to create project: ${folderError.message}`);
//         targetFolderId = newFolder.id;
//       }

//       // ── Step 2: upload all files into that folder ────────────────────────
//       const results = await Promise.allSettled(
//         selectedFiles.map(file =>
//           uploadFile({
//             file,
//             description: meta.description,
//             tags:        meta.tags,
//             groupId:     meta.groupId,
//             folderId:    targetFolderId,
//           })
//         )
//       );

//       const succeeded = results.filter(r => r.status === 'fulfilled').length;
//       const failed    = results.filter(r => r.status === 'rejected').length;

//       if (succeeded > 0 && failed === 0) {
//         showToast(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded successfully!`);
//       } else if (succeeded > 0 && failed > 0) {
//         showToast(`${succeeded} uploaded, ${failed} failed.`, 'error');
//       } else {
//         showToast('All uploads failed.', 'error');
//         return; // don't navigate
//       }

//       // ── Step 3: navigate to the cohort, or catalog ───────────────────────
//       if (meta.groupId) {
//         navigate(`/groups/${meta.groupId}`);
//       } else {
//         navigate('/catalog');
//       }
//     } catch (e: unknown) {
//       showToast(e instanceof Error ? e.message : 'Upload failed', 'error');
//     }
//   }

//   return (
//     <Layout>
//       <Header title="Upload Files" />
//       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
//         <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 380px' }}>
//           <UploadZone
//             files={selectedFiles}
//             onFilesSelected={handleFilesSelected}
//             onRemove={handleRemove}
//             onClear={() => setSelectedFiles([])}
//           />
//           <MetadataPanel
//             files={selectedFiles}
//             onSubmit={handleSubmit}
//             uploading={uploading}
//             progress={progress}
//           />
//         </div>
//       </div>
//     </Layout>
//   );
// }
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import UploadZone from '../components/upload/UploadZone';
// import MetadataPanel from '../components/upload/MetadataPanel';
// import { useUpload } from '../hooks/useUpload';
// import { useApp } from '../contexts/AppContext';
// import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabase';

// export default function Upload() {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const { uploadFile, uploading, progress } = useUpload();
//   const { showToast } = useApp();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   function handleFilesSelected(incoming: File[]) {
//     setSelectedFiles(prev => {
//       // Deduplicate by name+size
//       const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
//       const fresh = incoming.filter(f => !existing.has(`${f.name}-${f.size}`));
//       return [...prev, ...fresh];
//     });
//   }

//   function handleRemove(index: number) {
//     setSelectedFiles(prev => prev.filter((_, i) => i !== index));
//   }

//   async function handleSubmit(meta: {
//     projectName: string;
//     description: string;
//     tags:        string[];
//     groupId:     string | null;
//     subGroupId:  string | null;
//     folderId:    string | null;
//   }) {
//     if (selectedFiles.length === 0) return;

//     try {
//       let targetFolderId = meta.folderId;

//       // ── Step 1: create a new subproject only if no existing folder is selected ──
//       if (meta.projectName.trim() && meta.groupId && !meta.folderId) {
//         const { data: newFolder, error: folderError } = await supabase
//           .from('subprojects')
//           .insert({
//             group_id:    meta.groupId,
//             name:        meta.projectName.trim(),
//             description: meta.description.trim() || null,
//             tags:        meta.tags.length > 0 ? meta.tags : [],
//             created_by:  user?.id ?? null,
//           })
//           .select('id')
//           .single();

//         if (folderError) throw new Error(`Failed to create project: ${folderError.message}`);
//         targetFolderId = newFolder.id;
//       }

//       // ── Step 2: upload all files into that folder ────────────────────────
//       const results = await Promise.allSettled(
//         selectedFiles.map(file =>
//           uploadFile({
//             file,
//             description: meta.description,
//             tags:        meta.tags,
//             groupId:     meta.groupId,
//             folderId:    targetFolderId,
//           })
//         )
//       );

//       const succeeded = results.filter(r => r.status === 'fulfilled').length;
//       const failed    = results.filter(r => r.status === 'rejected').length;

//       if (succeeded > 0 && failed === 0) {
//         showToast(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded successfully!`);
//       } else if (succeeded > 0 && failed > 0) {
//         showToast(`${succeeded} uploaded, ${failed} failed.`, 'error');
//       } else {
//         showToast('All uploads failed.', 'error');
//         return; // don't navigate
//       }

//       // ── Step 3: navigate to the cohort, or catalog ───────────────────────
//       if (meta.groupId) {
//         navigate(`/groups/${meta.groupId}`);
//       } else {
//         navigate('/catalog');
//       }
//     } catch (e: unknown) {
//       showToast(e instanceof Error ? e.message : 'Upload failed', 'error');
//     }
//   }

//   return (
//     <Layout>
//       <Header title="Upload Files" />
//       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
//         <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 380px' }}>
//           <UploadZone
//             files={selectedFiles}
//             onFilesSelected={handleFilesSelected}
//             onRemove={handleRemove}
//             onClear={() => setSelectedFiles([])}
//           />
//           <MetadataPanel
//             files={selectedFiles}
//             onSubmit={handleSubmit}
//             uploading={uploading}
//             progress={progress}
//           />
//         </div>
//       </div>
//     </Layout>
//   );
// }
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import UploadZone from '../components/upload/UploadZone';
import MetadataPanel from '../components/upload/MetadataPanel';
import { useUpload } from '../hooks/useUpload';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploadFile, uploading, progress } = useUpload();
  const { showToast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleFilesSelected(incoming: File[]) {
    setSelectedFiles(prev => {
      // Deduplicate by name+size
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
      const fresh = incoming.filter(
        f => !existing.has(`${f.name}-${f.size}`)
      );

      return [...prev, ...fresh];
    });
  }

  function handleRemove(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(meta: {
    projectName: string;
    description: string;
    tags: string[];
    groupId: string | null;
    subGroupId: string | null;
    folderId: string | null;
  }) {
    if (selectedFiles.length === 0) return;

    // ✅ Prevent upload without selecting existing folder
    if (!meta.folderId) {
      showToast('Please select a folder before uploading.', 'error');
      return;
    }

    try {
      // ✅ Upload directly into selected folder
      const results = await Promise.allSettled(
        selectedFiles.map(file =>
          uploadFile({
            file,
            description: meta.description,
            tags: meta.tags,
            groupId: meta.groupId,
            folderId: meta.folderId,
          })
        )
      );

      const succeeded = results.filter(
        r => r.status === 'fulfilled'
      ).length;

      const failed = results.filter(
        r => r.status === 'rejected'
      ).length;

      if (succeeded > 0 && failed === 0) {
        showToast(
          `${succeeded} file${succeeded > 1 ? 's' : ''} uploaded successfully!`
        );
      } else if (succeeded > 0 && failed > 0) {
        showToast(
          `${succeeded} uploaded, ${failed} failed.`,
          'error'
        );
      } else {
        showToast('All uploads failed.', 'error');
        return;
      }

      // ✅ Redirect back
      if (meta.groupId) {
        navigate(`/groups/${meta.groupId}`);
      } else {
        navigate('/catalog');
      }
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : 'Upload failed',
        'error'
      );
    }
  }

  return (
    <Layout>
      <Header title="Upload Files" />

      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: '1fr 380px' }}
        >
          <UploadZone
            files={selectedFiles}
            onFilesSelected={handleFilesSelected}
            onRemove={handleRemove}
            onClear={() => setSelectedFiles([])}
          />

          <MetadataPanel
            files={selectedFiles}
            onSubmit={handleSubmit}
            uploading={uploading}
            progress={progress}
          />
        </div>
      </div>
    </Layout>
  );
}