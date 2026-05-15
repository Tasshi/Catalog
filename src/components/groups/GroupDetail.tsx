// // src/components/groups/GroupDetail.tsx
// import { useState, useCallback } from 'react';
// import FolderTree from './FolderTree';
// import { useFolderTree } from '../../hooks/useFolderTree';
// import { useFiles } from '../../hooks/useFiles';
// import { useUpload } from '../../hooks/useUpload';
// import type { Group } from '../ui/cons';
// import type { FileRecord } from '../ui/cons';

// interface GroupDetailProps {
//   group:     Group;
//   onBack:    () => void;
//   onMembers: () => void;
// }

// export default function GroupDetail({ group }: GroupDetailProps) {
//   const {
//     roots, loading, error,
//     createFolder, renameFolder, deleteFolder,
//     autoSortFile, moveFileToFolder, refetch: refetchFolders,
//   } = useFolderTree(group.id);

//   const {
//     files, refetch: refetchFiles,
//   } = useFiles(group.id);

//   const { uploadFile } = useUpload();

//   // ── Move-file picker state ────────────────────────────────────────────────
//   const [movingFile, setMovingFile] = useState<FileRecord | null>(null);

//   // ── Upload to a specific folder (with auto-sort by type) ─────────────────
//   const handleUploadToFolder = useCallback(
//     async (folderId: string | null, fileList: FileList) => {
//       for (const file of Array.from(fileList)) {
//         // 1. Upload file to Supabase storage + insert into `files` table
//         const data = await uploadFile({ file, description: '', tags: [], groupId: group.id });
//         if (!data?.id) continue;

//         // 2. Auto-sort into typed sub-folder (e.g. 📕 PDFs, 📝 Documents…)
//         await autoSortFile(data.id, file.name, folderId);
//       }
//       await refetchFiles();
//       await refetchFolders();
//     },
//     [uploadFile, group.id, autoSortFile, refetchFiles, refetchFolders],
//   );

//   // ── Move file to another folder ───────────────────────────────────────────
//   const handleConfirmMove = useCallback(
//     async (targetFolderId: string) => {
//       if (!movingFile) return;
//       await moveFileToFolder(movingFile.id, targetFolderId);
//       await refetchFiles();
//       setMovingFile(null);
//     },
//     [movingFile, moveFileToFolder, refetchFiles],
//   );

//   // ── Remove file from its folder (set folder_id = null) ───────────────────
//   const handleRemoveFromFolder = useCallback(
//     async (fileId: string) => {
//       await moveFileToFolder(fileId, ''); // empty string → null in hook
//       await refetchFiles();
//     },
//     [moveFileToFolder, refetchFiles],
//   );

//   // ── Wrap async folder ops for FolderTree props ────────────────────────────
//   const handleAddSubFolder = useCallback(
//     async (parentId: string, name: string, icon: string) => {
//       await createFolder(name, parentId, icon);
//     },
//     [createFolder],
//   );

//   if (error) {
//     return (
//       <div className="flex items-center justify-center py-12 text-red-500 text-sm">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full">
//       {/* Description */}
//       {group.description && (
//         <p className="text-sm text-slate-500 mb-4">{group.description}</p>
//       )}

//       {/* Folder tree */}
//       <FolderTree
//         roots={roots}
//         files={files}
//         loading={loading}
//         onCreateFolder={createFolder}
//         onAddSubFolder={handleAddSubFolder}
//         onRename={renameFolder}
//         onDelete={deleteFolder}
//         onUploadToFolder={handleUploadToFolder}
//         onMoveFile={setMovingFile}
//         onRemoveFromFolder={handleRemoveFromFolder}
//       />

//       {/* ── Move-file modal ── */}
//       {movingFile && (
//         <MoveFolderPicker
//           file={movingFile}
//           roots={roots}
//           onPick={handleConfirmMove}
//           onClose={() => setMovingFile(null)}
//         />
//       )}
//     </div>
//   );
// }

// // ── MoveFolderPicker modal ────────────────────────────────────────────────────

// import type { FolderRecord } from '../../types/folder';

// function FolderOption({
//   node,
//   depth,
//   onPick,
// }: {
//   node:   FolderRecord;
//   depth:  number;
//   onPick: (id: string) => void;
// }) {
//   return (
//     <>
//       <button
//         className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-left"
//         style={{ paddingLeft: 12 + depth * 16 }}
//         onClick={() => onPick(node.id)}
//       >
//         <span>{node.icon}</span>
//         <span>{node.name}</span>
//       </button>
//       {node.children.map(c => (
//         <FolderOption key={c.id} node={c} depth={depth + 1} onPick={onPick} />
//       ))}
//     </>
//   );
// }

// function MoveFolderPicker({
//   file,
//   roots,
//   onPick,
//   onClose,
// }: {
//   file:    FileRecord;
//   roots:   FolderRecord[];
//   onPick:  (folderId: string) => void;
//   onClose: () => void;
// }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5"
//         onClick={e => e.stopPropagation()}
//       >
//         <h3 className="text-base font-semibold text-slate-800 mb-1">Move file</h3>
//         <p className="text-xs text-slate-500 mb-4 truncate">"{file.name}"</p>

//         {roots.length === 0 ? (
//           <p className="text-sm text-slate-400 text-center py-6">No folders available</p>
//         ) : (
//           <div className="max-h-64 overflow-y-auto">
//             {roots.map(n => (
//               <FolderOption key={n.id} node={n} depth={0} onPick={onPick} />
//             ))}
//           </div>
//         )}

//         <button
//           className="mt-4 w-full h-9 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
//           onClick={onClose}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }
// src/components/groups/GroupDetail.tsx
import { useState, useCallback } from 'react';
import FolderTree from './FolderTree';
import { useFolderTree } from '../../hooks/useFolderTree';
import { useFiles } from '../../hooks/useFiles';
import { useUpload } from '../../hooks/useUpload';
import type { Group } from '../ui/cons';
import type { FileRecord } from '../ui/cons';

interface GroupDetailProps {
  group:     Group;
  onBack:    () => void;
  onMembers: () => void;
}

export default function GroupDetail({ group }: GroupDetailProps) {
  const {
    roots, loading, error,
    createFolder, renameFolder, deleteFolder,
    autoSortFile, moveFileToFolder, refetch: refetchFolders,
  } = useFolderTree(group.id);

  const {
    files, refetch: refetchFiles,
  } = useFiles(group.id);

  const { uploadFile } = useUpload();

  // ── Move-file picker state ────────────────────────────────────────────────
  const [movingFile, setMovingFile] = useState<FileRecord | null>(null);

  // ── Upload to a specific folder (with auto-sort by type) ─────────────────
  const handleUploadToFolder = useCallback(
    async (folderId: string | null, fileList: FileList) => {
      for (const file of Array.from(fileList)) {
        // 1. Upload file to Supabase storage + insert into `files` table
        const data = await uploadFile({ file, description: '', tags: [], groupId: group.id }) as { id: string } | undefined;
        if (!data?.id) continue;

        // 2. Auto-sort into typed sub-folder (e.g. 📕 PDFs, 📝 Documents…)
        await autoSortFile(data.id, file.name, folderId);
      }
      await refetchFiles();
      await refetchFolders();
    },
    [uploadFile, group.id, autoSortFile, refetchFiles, refetchFolders],
  );

  // ── Move file to another folder ───────────────────────────────────────────
  const handleConfirmMove = useCallback(
    async (targetFolderId: string) => {
      if (!movingFile) return;
      await moveFileToFolder(movingFile.id, targetFolderId);
      await refetchFiles();
      setMovingFile(null);
    },
    [movingFile, moveFileToFolder, refetchFiles],
  );

  // ── Remove file from its folder (set folder_id = null) ───────────────────
  const handleRemoveFromFolder = useCallback(
    async (fileId: string) => {
      await moveFileToFolder(fileId, ''); // empty string → null in hook
      await refetchFiles();
    },
    [moveFileToFolder, refetchFiles],
  );

  // ── Wrap async folder ops for FolderTree props ────────────────────────────
  const handleAddSubFolder = useCallback(
    async (parentId: string, name: string, icon: string) => {
      await createFolder(name, parentId, icon);
    },
    [createFolder],
  );

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Description */}
      {group.description && (
        <p className="text-sm text-slate-500 mb-4">{group.description}</p>
      )}

      {/* Folder tree */}
      <FolderTree
        roots={roots}
        files={files}
        loading={loading}
        onCreateFolder={createFolder}
        onAddSubFolder={handleAddSubFolder}
        onRename={renameFolder}
        onDelete={deleteFolder}
        onUploadToFolder={handleUploadToFolder}
        onMoveFile={setMovingFile}
        onRemoveFromFolder={handleRemoveFromFolder}
      />

      {/* ── Move-file modal ── */}
      {movingFile && (
        <MoveFolderPicker
          file={movingFile}
          roots={roots}
          onPick={handleConfirmMove}
          onClose={() => setMovingFile(null)}
        />
      )}
    </div>
  );
}

// ── MoveFolderPicker modal ────────────────────────────────────────────────────

import type { FolderRecord } from '../../types/folder';

function FolderOption({
  node,
  depth,
  onPick,
}: {
  node:   FolderRecord;
  depth:  number;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-left"
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onPick(node.id)}
      >
        <span>{node.icon}</span>
        <span>{node.name}</span>
      </button>
      {node.children.map(c => (
        <FolderOption key={c.id} node={c} depth={depth + 1} onPick={onPick} />
      ))}
    </>
  );
}

function MoveFolderPicker({
  file,
  roots,
  onPick,
  onClose,
}: {
  file:    FileRecord;
  roots:   FolderRecord[];
  onPick:  (folderId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-800 mb-1">Move file</h3>
        <p className="text-xs text-slate-500 mb-4 truncate">"{file.name}"</p>

        {roots.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No folders available</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {roots.map(n => (
              <FolderOption key={n.id} node={n} depth={0} onPick={onPick} />
            ))}
          </div>
        )}

        <button
          className="mt-4 w-full h-9 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}