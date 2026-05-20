// // import { useState, useCallback, Component } from 'react';
// // import type { ReactNode } from 'react';
// // import FolderTree from './FolderTree';
// // import { useFolderTree } from '../../hooks/useFolderTree';
// // import { useFiles } from '../../hooks/useFiles';
// // import { useUpload } from '../../hooks/useUpload';
// // import type { Group } from '../layout/ui/cons';
// // import type { FileRecord } from '../layout/ui/cons';
// // import type { FolderRecord } from '../../types/folder';

// // interface GroupDetailProps {
// //   group:     Group;
// //   onBack:    () => void;
// //   onMembers: () => void;
// // }

// // // ── Error boundary — shows a message instead of blank page ───────────────────

// // interface EBState { error: Error | null }
// // class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
// //   state: EBState = { error: null };
// //   static getDerivedStateFromError(error: Error) { return { error }; }
// //   render() {
// //     if (this.state.error) {
// //       return (
// //         <div style={{ padding: 32, color: '#991b1b', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13 }}>
// //           <strong>Something went wrong loading this project.</strong>
// //           <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 11, color: '#7f1d1d' }}>
// //             {this.state.error.message}
// //           </pre>
// //           <button
// //             onClick={() => this.setState({ error: null })}
// //             style={{ marginTop: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', cursor: 'pointer', fontSize: 12 }}
// //           >
// //             Try again
// //           </button>
// //         </div>
// //       );
// //     }
// //     return this.props.children;
// //   }
// // }

// // // ── Inner component (hooks live here) ─────────────────────────────────────────

// // function GroupDetailInner({ group }: GroupDetailProps) {
// //   const {
// //     roots, loading, error,
// //     createFolder, renameFolder, deleteFolder,
// //     autoSortFile, moveFileToFolder, refetch: refetchFolders,
// //   } = useFolderTree(group.id);

// //   const { files, refetch: refetchFiles } = useFiles(group.id);
// //   const { uploadFile } = useUpload();

// //   const [movingFile, setMovingFile] = useState<FileRecord | null>(null);

// //   // ── Upload to a specific folder ───────────────────────────────────────────
// //   const handleUploadToFolder = useCallback(
// //     async (folderId: string | null, fileList: FileList) => {
// //       for (const file of Array.from(fileList)) {
// //         try {
// //           const data = await uploadFile({
// //             file,
// //             description: '',
// //             tags:        [],
// //             groupId:     group.id,
// //             folderId:    folderId ?? null,
// //           }) as { id: string } | undefined;

// //           if (!data?.id) continue;

// //           // ✅ Only auto-sort when uploading to root (no folder selected).
// //           // If a folderId is already provided, the file is already assigned to
// //           // that folder via the DB insert — calling autoSortFile would
// //           // unnecessarily create or reassign folders.
// //           if (!folderId) {
// //             await autoSortFile(data.id, file.name, null);
// //           }
// //         } catch (err) {
// //           console.error('[handleUploadToFolder] failed for', file.name, err);
// //         }
// //       }

// //       await refetchFiles();
// //       await refetchFolders();
// //     },
// //     [uploadFile, group.id, autoSortFile, refetchFiles, refetchFolders],
// //   );

// //   const handleConfirmMove = useCallback(
// //     async (targetFolderId: string) => {
// //       if (!movingFile) return;
// //       await moveFileToFolder(movingFile.id, targetFolderId);
// //       await refetchFiles();
// //       setMovingFile(null);
// //     },
// //     [movingFile, moveFileToFolder, refetchFiles],
// //   );

// //   const handleRemoveFromFolder = useCallback(
// //     async (fileId: string) => {
// //       await moveFileToFolder(fileId, '');
// //       await refetchFiles();
// //     },
// //     [moveFileToFolder, refetchFiles],
// //   );

// //   const handleAddSubFolder = useCallback(
// //     async (name: string, parentId: string, icon?: string) => {
// //       await createFolder(name, parentId, icon);
// //     },
// //     [createFolder],
// //   );

// //   if (error) {
// //     return (
// //       <div className="flex items-center justify-center py-12 text-red-500 text-sm">
// //         {error}
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex flex-col h-full">
// //       {group.description && (
// //         <p className="text-sm text-slate-500 mb-4">{group.description}</p>
// //       )}

// //       <FolderTree
// //         group={group}
// //         roots={roots}
// //         files={files}
// //         loading={loading}
// //         onCreateFolder={createFolder}
// //         onAddSubFolder={handleAddSubFolder}
// //         onRename={renameFolder}
// //         onDelete={deleteFolder}
// //         onUploadToFolder={handleUploadToFolder}
// //         onMoveFile={setMovingFile}
// //         onRemoveFromFolder={handleRemoveFromFolder}
// //         onExport={() => {}}
// //       />

// //       {movingFile && (
// //         <MoveFolderPicker
// //           file={movingFile}
// //           roots={roots}
// //           onPick={handleConfirmMove}
// //           onClose={() => setMovingFile(null)}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// // // ── Public export — wraps inner in error boundary ─────────────────────────────

// // export default function GroupDetail(props: GroupDetailProps) {
// //   return (
// //     <ErrorBoundary>
// //       <GroupDetailInner {...props} />
// //     </ErrorBoundary>
// //   );
// // }

// // // ── MoveFolderPicker modal ────────────────────────────────────────────────────

// // function FolderOption({ node, depth, onPick }: { node: FolderRecord; depth: number; onPick: (id: string) => void; }) {
// //   return (
// //     <>
// //       <button
// //         className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-left"
// //         style={{ paddingLeft: 12 + depth * 16 }}
// //         onClick={() => onPick(node.id)}
// //       >
// //         <span>{node.icon}</span>
// //         <span>{node.name}</span>
// //       </button>
// //       {node.children.map(c => (
// //         <FolderOption key={c.id} node={c} depth={depth + 1} onPick={onPick} />
// //       ))}
// //     </>
// //   );
// // }

// // function MoveFolderPicker({ file, roots, onPick, onClose }: { file: FileRecord; roots: FolderRecord[]; onPick: (folderId: string) => void; onClose: () => void; }) {
// //   return (
// //     <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
// //       <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
// //         <h3 className="text-base font-semibold text-slate-800 mb-1">Move file</h3>
// //         <p className="text-xs text-slate-500 mb-4 truncate">"{file.name}"</p>
// //         {roots.length === 0 ? (
// //           <p className="text-sm text-slate-400 text-center py-6">No folders available</p>
// //         ) : (
// //           <div className="max-h-64 overflow-y-auto">
// //             {roots.map(n => <FolderOption key={n.id} node={n} depth={0} onPick={onPick} />)}
// //           </div>
// //         )}
// //         <button className="mt-4 w-full h-9 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose}>
// //           Cancel
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }
// import { useState, useCallback, Component } from 'react';
// import type { ReactNode } from 'react';
// import FolderTree from './FolderTree';
// import { useFolderTree } from '../../hooks/useFolderTree';
// import { useFiles } from '../../hooks/useFiles';
// import { useUpload } from '../../hooks/useUpload';
// import { useUserGroupIds } from '../../hooks/useGroups';
// import { ShieldAlert } from 'lucide-react';
// import type { Group } from '../layout/ui/cons';
// import type { FileRecord } from '../layout/ui/cons';
// import type { FolderRecord } from '../../types/folder';

// interface GroupDetailProps {
//   group:     Group;
//   onBack:    () => void;
//   onMembers: () => void;
// }

// // ── Error boundary — shows a message instead of blank page ───────────────────

// interface EBState { error: Error | null }
// class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
//   state: EBState = { error: null };
//   static getDerivedStateFromError(error: Error) { return { error }; }
//   render() {
//     if (this.state.error) {
//       return (
//         <div style={{ padding: 32, color: '#991b1b', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13 }}>
//           <strong>Something went wrong loading this project.</strong>
//           <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 11, color: '#7f1d1d' }}>
//             {this.state.error.message}
//           </pre>
//           <button
//             onClick={() => this.setState({ error: null })}
//             style={{ marginTop: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', cursor: 'pointer', fontSize: 12 }}
//           >
//             Try again
//           </button>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// // ── Inner component (hooks live here) ─────────────────────────────────────────

// function GroupDetailInner({ group }: GroupDetailProps) {
//   const {
//     roots, loading, error,
//     createFolder, renameFolder, deleteFolder,
//     autoSortFile, moveFileToFolder, refetch: refetchFolders,
//   } = useFolderTree(group.id);

//   const { files, refetch: refetchFiles } = useFiles(group.id);
//   const { uploadFile } = useUpload();

//   // ── Permission: only members of this group can mutate ────────────────────
//   const { userGroupIds, loading: permLoading } = useUserGroupIds();
//   const isMember = userGroupIds.has(group.id);
//   // ─────────────────────────────────────────────────────────────────────────

//   const [movingFile, setMovingFile] = useState<FileRecord | null>(null);

//   // ── Upload to a specific folder ───────────────────────────────────────────
//   const handleUploadToFolder = useCallback(
//     async (folderId: string | null, fileList: FileList) => {
//       if (!isMember) return;

//       for (const file of Array.from(fileList)) {
//         try {
//           const data = await uploadFile({
//             file,
//             description: '',
//             tags:        [],
//             groupId:     group.id,
//             folderId:    folderId ?? null,
//           }) as { id: string } | undefined;

//           if (!data?.id) continue;

//           if (!folderId) {
//             await autoSortFile(data.id, file.name, null);
//           }
//         } catch (err) {
//           console.error('[handleUploadToFolder] failed for', file.name, err);
//         }
//       }

//       await refetchFiles();
//       await refetchFolders();
//     },
//     [uploadFile, group.id, autoSortFile, refetchFiles, refetchFolders, isMember],
//   );

//   const handleConfirmMove = useCallback(
//     async (targetFolderId: string) => {
//       if (!movingFile || !isMember) return;
//       await moveFileToFolder(movingFile.id, targetFolderId);
//       await refetchFiles();
//       setMovingFile(null);
//     },
//     [movingFile, moveFileToFolder, refetchFiles, isMember],
//   );

//   const handleRemoveFromFolder = useCallback(
//     async (fileId: string) => {
//       if (!isMember) return;
//       await moveFileToFolder(fileId, '');
//       await refetchFiles();
//     },
//     [moveFileToFolder, refetchFiles, isMember],
//   );

//   const handleAddSubFolder = useCallback(
//     async (name: string, parentId: string, icon?: string) => {
//       if (!isMember) return;
//       await createFolder(name, parentId, icon);
//     },
//     [createFolder, isMember],
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
//       {group.description && (
//         <p className="text-sm text-slate-500 mb-4">{group.description}</p>
//       )}

//       {/* ── View-only banner for non-members ── */}
//       {!permLoading && !isMember && (
//         <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
//           <ShieldAlert size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="text-xs font-semibold text-amber-700">View &amp; download only</p>
//             <p className="text-xs text-amber-600 mt-0.5">
//               Oops! Please choose a <b>COHORT</b> before continuing
//             </p>
//           </div>
//         </div>
//       )}

//       <FolderTree
//         group={group}
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
//         onExport={() => {}}
//       />

//       {movingFile && isMember && (
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

// // ── Public export — wraps inner in error boundary ─────────────────────────────

// export default function GroupDetail(props: GroupDetailProps) {
//   return (
//     <ErrorBoundary>
//       <GroupDetailInner {...props} />
//     </ErrorBoundary>
//   );
// }

// // ── MoveFolderPicker modal ────────────────────────────────────────────────────

// function FolderOption({ node, depth, onPick }: { node: FolderRecord; depth: number; onPick: (id: string) => void; }) {
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

// function MoveFolderPicker({ file, roots, onPick, onClose }: { file: FileRecord; roots: FolderRecord[]; onPick: (folderId: string) => void; onClose: () => void; }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
//         <h3 className="text-base font-semibold text-slate-800 mb-1">Move file</h3>
//         <p className="text-xs text-slate-500 mb-4 truncate">"{file.name}"</p>
//         {roots.length === 0 ? (
//           <p className="text-sm text-slate-400 text-center py-6">No folders available</p>
//         ) : (
//           <div className="max-h-64 overflow-y-auto">
//             {roots.map(n => <FolderOption key={n.id} node={n} depth={0} onPick={onPick} />)}
//           </div>
//         )}
//         <button className="mt-4 w-full h-9 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose}>
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }
import { useState, useCallback, Component, useEffect } from 'react';
import type { ReactNode } from 'react';
import FolderTree from './FolderTree';
import { useFolderTree } from '../../hooks/useFolderTree';
import { useFiles } from '../../hooks/useFiles';
import { useUpload } from '../../hooks/useUpload';
import { useUserGroupIds } from '../../hooks/useGroups';
import { ShieldAlert } from 'lucide-react';
import type { Group } from '../layout/ui/cons';
import type { FileRecord } from '../layout/ui/cons';
import type { FolderRecord } from '../../types/folder';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface GroupDetailProps {
  group:     Group;
  onBack:    () => void;
  onMembers: () => void;
}

// ── Error boundary — shows a message instead of blank page ───────────────────

interface EBState { error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#991b1b', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13 }}>
          <strong>Something went wrong loading this project.</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 11, color: '#7f1d1d' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', cursor: 'pointer', fontSize: 12 }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── useIsAdmin hook — checks profiles.role === 'admin' ───────────────────────

function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setIsAdmin(data?.role === 'admin');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  return { isAdmin, loading };
}

// ── Inner component (hooks live here) ─────────────────────────────────────────

function GroupDetailInner({ group }: GroupDetailProps) {
  const {
    roots, loading, error,
    createFolder, renameFolder, deleteFolder,
    autoSortFile, moveFileToFolder, refetch: refetchFolders,
  } = useFolderTree(group.id);

  const { files, refetch: refetchFiles } = useFiles(group.id);
  const { uploadFile } = useUpload();

  // ── Permission: members OR admins can mutate ──────────────────────────────
  const { userGroupIds, loading: permLoading } = useUserGroupIds();
  const { isAdmin, loading: adminLoading }      = useIsAdmin();
  const isMember  = userGroupIds.has(group.id);
  const canEdit   = isMember || isAdmin;          // ← admins always can edit
  const showBanner = !permLoading && !adminLoading && !canEdit; // ← hide for admins
  // ─────────────────────────────────────────────────────────────────────────

  const [movingFile, setMovingFile] = useState<FileRecord | null>(null);

  // ── Upload to a specific folder ───────────────────────────────────────────
  const handleUploadToFolder = useCallback(
    async (folderId: string | null, fileList: FileList) => {
      if (!canEdit) return;

      for (const file of Array.from(fileList)) {
        try {
          const data = await uploadFile({
            file,
            description: '',
            tags:        [],
            groupId:     group.id,
            folderId:    folderId ?? null,
          }) as { id: string } | undefined;

          if (!data?.id) continue;

          if (!folderId) {
            await autoSortFile(data.id, file.name, null);
          }
        } catch (err) {
          console.error('[handleUploadToFolder] failed for', file.name, err);
        }
      }

      await refetchFiles();
      await refetchFolders();
    },
    [uploadFile, group.id, autoSortFile, refetchFiles, refetchFolders, canEdit],
  );

  const handleConfirmMove = useCallback(
    async (targetFolderId: string) => {
      if (!movingFile || !canEdit) return;
      await moveFileToFolder(movingFile.id, targetFolderId);
      await refetchFiles();
      setMovingFile(null);
    },
    [movingFile, moveFileToFolder, refetchFiles, canEdit],
  );

  const handleRemoveFromFolder = useCallback(
    async (fileId: string) => {
      if (!canEdit) return;
      await moveFileToFolder(fileId, '');
      await refetchFiles();
    },
    [moveFileToFolder, refetchFiles, canEdit],
  );

  const handleAddSubFolder = useCallback(
    async (name: string, parentId: string, icon?: string) => {
      if (!canEdit) return;
      await createFolder(name, parentId, icon);
    },
    [createFolder, canEdit],
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
      {group.description && (
        <p className="text-sm text-slate-500 mb-4">{group.description}</p>
      )}

      {/* ── View-only banner — hidden for admins, shown only for non-members ── */}
      {showBanner && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <ShieldAlert size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">View &amp; download only</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Oops! Please choose a <b>COHORT</b> before continuing
            </p>
          </div>
        </div>
      )}

      <FolderTree
        group={group}
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
        onExport={() => {}}
      />

      {movingFile && canEdit && (
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

// ── Public export — wraps inner in error boundary ─────────────────────────────

export default function GroupDetail(props: GroupDetailProps) {
  return (
    <ErrorBoundary>
      <GroupDetailInner {...props} />
    </ErrorBoundary>
  );
}

// ── MoveFolderPicker modal ────────────────────────────────────────────────────

function FolderOption({ node, depth, onPick }: { node: FolderRecord; depth: number; onPick: (id: string) => void; }) {
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

function MoveFolderPicker({ file, roots, onPick, onClose }: { file: FileRecord; roots: FolderRecord[]; onPick: (folderId: string) => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Move file</h3>
        <p className="text-xs text-slate-500 mb-4 truncate">"{file.name}"</p>
        {roots.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No folders available</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {roots.map(n => <FolderOption key={n.id} node={n} depth={0} onPick={onPick} />)}
          </div>
        )}
        <button className="mt-4 w-full h-9 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}