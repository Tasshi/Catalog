import { useState, useRef } from 'react';
import type { FolderRecord } from '../../types/folder';
import type { FileRecord } from '../ui/cons';

// ── Palette — hashed from folder id ──────────────────────────────────────────

const PALETTES = [
  { tab: '#b45309', body: '#d97706' },
  { tab: '#1d4ed8', body: '#3b82f6' },
  { tab: '#047857', body: '#10b981' },
  { tab: '#6d28d9', body: '#8b5cf6' },
  { tab: '#b91c1c', body: '#ef4444' },
  { tab: '#065f46', body: '#059669' },
  { tab: '#0369a1', body: '#0ea5e9' },
  { tab: '#9d174d', body: '#ec4899' },
] as const;

function getPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// ── Recursive folder finder ───────────────────────────────────────────────────

function findFolder(nodes: FolderRecord[], id: string): FolderRecord | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findFolder(n.children, id);
    if (found) return found;
  }
  return null;
}

// ── File type helpers ─────────────────────────────────────────────────────────

const EXT_ICON: Record<string, string> = {
  pdf: '📕', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
  pptx: '📽️', ppt: '📽️', zip: '🗜️', rar: '🗜️',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
  mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵',
  other: '📄',
};
const EXT_COLOR: Record<string, string> = {
  pdf: '#ef4444', docx: '#3b82f6', doc: '#3b82f6',
  xlsx: '#22c55e', xls: '#22c55e', pptx: '#f97316', ppt: '#f97316',
  zip: '#8b5cf6', rar: '#8b5cf6',
  jpg: '#ec4899', jpeg: '#ec4899', png: '#ec4899', gif: '#ec4899',
  webp: '#ec4899', svg: '#ec4899',
  mp4: '#06b6d4', mov: '#06b6d4', mp3: '#f59e0b', wav: '#f59e0b',
  other: '#94a3b8',
};

function extOf(file: FileRecord) { return (file.ext ?? 'other').toLowerCase(); }

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcoChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IcoPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoMove = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/>
    <polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

// ── FolderTile — OS-style folder icon ─────────────────────────────────────────

function FolderTile({
  node, fileCount, onOpen, onRename, onDelete, onUpload,
}: {
  node:      FolderRecord;
  fileCount: number;
  onOpen:    () => void;
  onRename:  (id: string, name: string) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
  onUpload:  (id: string, files: FileList) => void;
}) {
  const [hov,       setHov]       = useState(false);
  const [renaming,  setRenaming]  = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const fileRef = useRef<HTMLInputElement>(null);
  const { tab, body } = getPalette(node.id);

  async function commitRename() {
    const v = renameVal.trim();
    if (v && v !== node.name) await onRename(node.id, v);
    else setRenameVal(node.name);
    setRenaming(false);
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 96, cursor: 'pointer', position: 'relative' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {hov && !renaming && !node.is_auto && (
        <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 10, display: 'flex', gap: 2 }}>
          <button style={{ ...iconBtn, background: '#fef3c7', color: '#92400e' }} title="Rename"
            onClick={e => { e.stopPropagation(); setRenaming(true); }}><IcoPencil /></button>
          <button style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }} title="Delete"
            onClick={e => { e.stopPropagation(); onDelete(node.id); }}><IcoTrash /></button>
        </div>
      )}
      {hov && !renaming && (
        <div style={{ position: 'absolute', top: -6, left: -6, zIndex: 10 }}>
          <button style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }} title="Upload to folder"
            onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}><IcoUpload /></button>
        </div>
      )}
      <div onClick={onOpen} style={{ position: 'relative', width: 80, height: 64, transition: 'transform 0.12s', transform: hov ? 'translateY(-3px)' : 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 34, height: 12, borderRadius: '4px 4px 0 0', background: tab }} />
        <div style={{
          position: 'absolute', top: 9, left: 0, width: 80, height: 55,
          borderRadius: '2px 7px 7px 7px', background: body, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 20, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{node.icon ?? '📁'}</span>
          {fileCount > 0 && (
            <div style={{
              position: 'absolute', bottom: 4, right: 5, fontSize: 9, fontWeight: 700,
              color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px',
            }}>{fileCount}</div>
          )}
          {/* Sub-folder indicator */}
          {node.children.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 4, left: 5, fontSize: 9, fontWeight: 700,
              color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '1px 5px',
            }}>📁 {node.children.length}</div>
          )}
        </div>
      </div>
      {renaming ? (
        <input autoFocus
          style={{ width: 88, fontSize: 11, textAlign: 'center', padding: '2px 4px', borderRadius: 4, border: '1.5px solid #6366f1', outline: 'none', background: '#fff', color: '#1e293b' }}
          value={renameVal}
          onChange={e => setRenameVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenameVal(node.name); setRenaming(false); } }}
          onBlur={commitRename}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span onClick={onOpen} style={{ fontSize: 11, fontWeight: 500, color: '#334155', textAlign: 'center', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {node.name}
        </span>
      )}
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.length) { onUpload(node.id, e.target.files); e.target.value = ''; } }}
      />
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 4, border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
};

// ── FileTile — kept for root grid view ───────────────────────────────────────

function FileTile({ file, onMove, onDelete }: { file: FileRecord; onMove: (f: FileRecord) => void; onDelete: (f: FileRecord) => void; }) {
  const [hov, setHov] = useState(false);
  const ext   = extOf(file);
  const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
  const icon  = EXT_ICON[ext]  ?? EXT_ICON.other;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 96, cursor: 'default', position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {hov && (
        <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 10, display: 'flex', gap: 2 }}>
          <button style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }} title="Move" onClick={e => { e.stopPropagation(); onMove(file); }}><IcoMove /></button>
          <button style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }} title="Remove" onClick={e => { e.stopPropagation(); onDelete(file); }}><IcoTrash /></button>
        </div>
      )}
      <div style={{ width: 56, height: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: hov ? '#f1f5f9' : '#f8fafc', border: `1.5px solid ${hov ? color + '60' : '#e2e8f0'}`, borderRadius: 8, transition: 'all 0.12s', gap: 4, transform: hov ? 'translateY(-2px)' : 'none' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 3, padding: '1px 4px', textTransform: 'uppercase' }}>{ext}</span>
      </div>
      <span style={{ fontSize: 11, color: '#475569', textAlign: 'center', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{file.name}</span>
      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: -4 }}>{file.sizeFormatted ?? ''}</span>
    </div>
  );
}

// ── FileRow — tabular row for files inside a folder ──────────────────────────

function FileRow({
  file, ext, color, icon, isLast, onMove, onDelete,
}: {
  file:     FileRecord;
  ext:      string;
  color:    string;
  icon:     string;
  isLast:   boolean;
  onMove:   (f: FileRecord) => void;
  onDelete: (fileId: string) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 90px 90px 80px',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        background: hov ? '#f8fafc' : '#fff',
        transition: 'background 0.1s',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
      <span style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{file.sizeFormatted ?? '—'}</span>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: color, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>{ext}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
        <button title="Move" onClick={() => onMove(file)} style={{ ...iconBtn, background: '#ede9fe', color: '#5b21b6' }}><IcoMove /></button>
        <button title="Remove" onClick={() => onDelete(file.id)} style={{ ...iconBtn, background: '#fee2e2', color: '#991b1b' }}><IcoTrash /></button>
      </div>
    </div>
  );
}

// ── NewFolderTile ─────────────────────────────────────────────────────────────

function NewFolderTile({ onConfirm, onCancel, loading }: { onConfirm: (name: string, icon: string) => Promise<void>; onCancel: () => void; loading?: boolean; }) {
  const [name, setName] = useState('Cohort Details');
  const [icon, setIcon] = useState('📁');
  const ICONS = ['📁','📂','📊','🗂️','🗃️','📋','📌','🏷️'];

  async function commit() {
    const v = name.trim();
    if (!v) { onCancel(); return; }
    await onConfirm(v, icon);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 96 }}>
      <div style={{ position: 'relative', width: 80, height: 64 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 34, height: 12, borderRadius: '4px 4px 0 0', background: '#cbd5e1', border: '1.5px dashed #94a3b8' }} />
        <div style={{ position: 'absolute', top: 9, left: 0, width: 80, height: 55, borderRadius: '2px 7px 7px 7px', background: '#f1f5f9', border: '1.5px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: 100 }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)} style={{ fontSize: 12, padding: '1px 3px', borderRadius: 3, cursor: 'pointer', border: ic === icon ? '1.5px solid #6366f1' : '1.5px solid transparent', background: ic === icon ? '#ede9fe' : 'transparent' }}>{ic}</button>
        ))}
      </div>
      <input autoFocus
        style={{ width: 88, fontSize: 11, textAlign: 'center', padding: '2px 4px', borderRadius: 4, border: '1.5px solid #6366f1', outline: 'none', background: '#fff', color: '#1e293b' }}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.target.select()}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={commit} disabled={loading} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? '…' : 'Create'}</button>
        <button onClick={onCancel} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({
  stack,
  roots,
  onJump,
}: {
  stack: string[];
  roots: FolderRecord[];
  onJump: (index: number) => void; // -1 = root
}) {
  const crumbs: { label: string; icon: string }[] = stack.map(id => {
    const f = findFolder(roots, id);
    return { label: f?.name ?? id, icon: f?.icon ?? '📁' };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
      <button
        onClick={() => onJump(-1)}
        style={{ fontWeight: stack.length === 0 ? 600 : 400, color: stack.length === 0 ? '#1e293b' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
      >
        🏠 Root
      </button>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IcoChevronRight />
          <button
            onClick={() => onJump(i)}
            style={{
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? '#1e293b' : '#6366f1',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
            }}
          >
            {c.icon} {c.label}
          </button>
        </span>
      ))}
    </div>
  );
}

// ── FolderView — shows contents of one folder ────────────────────────────────

interface FolderViewProps {
  node:               FolderRecord;
  files:              FileRecord[];
  stack:              string[];         // ← full breadcrumb stack
  roots:              FolderRecord[];   // ← needed for breadcrumb labels
  onOpenFolder:       (id: string) => void;  // ← FIX: navigate into a child
  onJump:             (index: number) => void; // ← FIX: breadcrumb jump
  onAddSubFolder:     (parentId: string, name: string, icon: string) => Promise<void>;
  onRename:           (id: string, name: string) => Promise<void>;
  onDelete:           (id: string) => Promise<void>;
  onUploadToFolder:   (folderId: string, files: FileList) => void;
  onMoveFile:         (file: FileRecord) => void;
  onRemoveFromFolder: (fileId: string) => void;
}

function FolderView({
  node, files, stack, roots,
  onOpenFolder, onJump,
  onAddSubFolder, onRename, onDelete,
  onUploadToFolder, onMoveFile, onRemoveFromFolder,
}: FolderViewProps) {
  const [addingChild, setAddingChild] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const autoUploadRef = useRef<HTMLInputElement>(null);

  const folderFiles = files.filter(f => f.folder_id === node.id);

  return (
    <div>
      {/* Breadcrumb toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Breadcrumb */}
        <Breadcrumb stack={stack} roots={roots} onJump={onJump} />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setAddingChild(true)} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none' }}>
            <IcoPlus /> Cohort Details
          </button>
          <button onClick={() => autoUploadRef.current?.click()} style={{ ...toolbarBtn, background: '#fff', color: '#6366f1', border: '1px solid #6366f1' }}>
            <IcoUpload /> Upload
          </button>
          <input ref={autoUploadRef} type="file" multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) { onUploadToFolder(node.id, e.target.files); e.target.value = ''; } }}
          />
        </div>
      </div>

      {/* Sub-folders icon grid */}
      {(addingChild || node.children.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '8px 4px 28px', alignItems: 'flex-start' }}>
          {addingChild && (
            <NewFolderTile
              loading={saving}
              onConfirm={async (name, icon) => {
                setSaving(true);
                await onAddSubFolder(node.id, name, icon);
                setSaving(false);
                setAddingChild(false);
              }}
              onCancel={() => setAddingChild(false)}
            />
          )}
          {node.children.map(child => (
            <FolderTile
              key={child.id}
              node={child}
              fileCount={child.file_count + child.children.reduce((s, c) => s + c.file_count, 0)}
              onOpen={() => onOpenFolder(child.id)}   // ← FIX: was () => {}
              onRename={onRename}
              onDelete={onDelete}
              onUpload={onUploadToFolder}
            />
          ))}
        </div>
      )}

      {/* Files — tabular format */}
      {folderFiles.length > 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 90px 90px 80px', gap: 8,
            padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
            fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span /><span>Name</span>
            <span style={{ textAlign: 'right' }}>Size</span>
            <span style={{ textAlign: 'center' }}>Type</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {folderFiles.map((f, i) => {
            const ext   = extOf(f);
            const color = EXT_COLOR[ext] ?? EXT_COLOR.other;
            const icon  = EXT_ICON[ext]  ?? EXT_ICON.other;
            return (
              <FileRow
                key={f.id} file={f} ext={ext} color={color} icon={icon}
                isLast={i === folderFiles.length - 1}
                onMove={onMoveFile}
                onDelete={onRemoveFromFolder}
              />
            );
          })}
        </div>
      ) : (
        !addingChild && node.children.length === 0 && (
          <div style={{ width: '100%', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
            <span style={{ fontSize: 36 }}>🗂️</span>
            <p style={{ fontSize: 13, margin: 0 }}>Empty — upload files or add sub-folders</p>
          </div>
        )
      )}
    </div>
  );
}

const toolbarBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 500,
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
};

// ── FolderTree (root) ─────────────────────────────────────────────────────────

export interface FolderTreeProps {
  roots:               FolderRecord[];
  files:               FileRecord[];
  loading:             boolean;
  onCreateFolder:      (name: string, parentId: string | null, icon?: string) => Promise<string | null>;
  onAddSubFolder:      (parentId: string, name: string, icon: string) => Promise<void>;
  onRename:            (id: string, name: string) => Promise<void>;
  onDelete:            (id: string) => Promise<void>;
  onUploadToFolder:    (folderId: string | null, files: FileList) => void;
  onMoveFile:          (file: FileRecord) => void;
  onRemoveFromFolder:  (fileId: string) => void;
}

export default function FolderTree({
  roots, files, loading,
  onCreateFolder, onAddSubFolder, onRename, onDelete,
  onUploadToFolder, onMoveFile, onRemoveFromFolder,
}: FolderTreeProps) {
  // ── FIX: replace single openFolderId with a navigation stack ──────────────
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [addingRoot,  setAddingRoot]  = useState(false);
  const [savingRoot,  setSavingRoot]  = useState(false);

  const openFolderId = folderStack.at(-1) ?? null;

  // ── FIX: search recursively, not just in roots ────────────────────────────
  const openFolder = openFolderId ? findFolder(roots, openFolderId) : null;

  // Push a new folder onto the stack
  function handleOpenFolder(id: string) {
    setFolderStack(s => [...s, id]);
  }

  // Jump to a specific breadcrumb level (-1 = root)
  function handleJump(index: number) {
    if (index === -1) {
      setFolderStack([]);
    } else {
      setFolderStack(s => s.slice(0, index + 1));
    }
  }

  if (openFolder) {
    return (
      <FolderView
        node={openFolder}
        files={files}
        stack={folderStack}          // ← pass stack for breadcrumb
        roots={roots}                // ← pass roots for breadcrumb labels
        onOpenFolder={handleOpenFolder}  // ← FIX: navigate into child
        onJump={handleJump}              // ← FIX: breadcrumb jump
        onAddSubFolder={onAddSubFolder}
        onRename={onRename}
        onDelete={onDelete}
        onUploadToFolder={onUploadToFolder}
        onMoveFile={onMoveFile}
        onRemoveFromFolder={onRemoveFromFolder}
      />
    );
  }

  // ── Root view ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setAddingRoot(true)} style={{ ...toolbarBtn, background: '#6366f1', color: '#fff', border: 'none' }}>
          <IcoPlus /> Cohort Details
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
          Loading folders…
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px 24px', minHeight: 120 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {addingRoot && (
              <NewFolderTile
                loading={savingRoot}
                onConfirm={async (name, icon) => {
                  setSavingRoot(true);
                  await onCreateFolder(name, null, icon);
                  setSavingRoot(false);
                  setAddingRoot(false);
                }}
                onCancel={() => setAddingRoot(false)}
              />
            )}
            {roots.map(node => (
              <FolderTile
                key={node.id}
                node={node}
                fileCount={node.file_count + node.children.reduce((s, c) => s + c.file_count, 0)}
                onOpen={() => handleOpenFolder(node.id)}
                onRename={onRename}
                onDelete={onDelete}
                onUpload={onUploadToFolder}
              />
            ))}
            {roots.length === 0 && !addingRoot && (
              <div style={{ width: '100%', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                <span style={{ fontSize: 40 }}>🗂️</span>
                <p style={{ fontSize: 13, margin: 0 }}>No folders yet — create one or upload &amp; auto-sort</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}