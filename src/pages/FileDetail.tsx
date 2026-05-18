import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import AuditLog from '../components/filedetail/AuditLog';
import VersionHistory from '../components/filedetail/VersionHistory';
import { Button } from '../components/ui';
import { getFileConfig, getFileExtension } from '../lib/metadata';
import { downloadFile, formatBytes } from '../lib/storage';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { Download, Eye, Edit3, X, Users, Mail, Phone, Loader2, Save, Tag } from 'lucide-react';
import type { FileDetail } from '@/components/ui/cons';
import { useGroupMembers, useGroups } from '../hooks/useGroups';

// ── Avatar colours ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: '#CECBF6', text: '#3C3489' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#F4C0D1', text: '#72243E' },
];

function initials(name: string) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── GroupAccessPanel ──────────────────────────────────────────────────────────

function GroupAccessPanel({ groupId, groupName, groupIcon }: {
  groupId:    string;
  groupName:  string;
  groupIcon?: string;
}) {
  const [open, setOpen] = useState(false);
  const { members, loading } = useGroupMembers(groupId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all hover:opacity-80"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
      >
        <span className="text-xl">{groupIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{groupName}</div>
          <div className="text-xs" style={{ color: 'var(--text3)' }}>Shared with group members</div>
        </div>
        <Users size={14} style={{ color: '#533AFD', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.25)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width:      '320px',
          background: 'var(--surface, #1a1f2e)',
          borderLeft: '1px solid var(--border)',
          boxShadow:  '-4px 0 24px rgba(0,0,0,0.12)',
          transform:  open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Group details</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:opacity-70"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: '#EEEDFE', border: '1px solid #C9C3F0' }}
          >
            <span>{groupIcon}</span>
            <span className="text-sm font-medium" style={{ color: '#533AFD' }}>{groupName}</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
            Members
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 size={16} className="animate-spin" style={{ color: '#533AFD' }} />
              <span className="text-sm" style={{ color: 'var(--text3)' }}>Loading members…</span>
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No members in this group</p>
          ) : (
            <div className="flex flex-col">
              {members.map((m, i) => {
                const name  = m.profile?.full_name ?? '(Unknown)';
                const email = m.profile?.email     ?? '—';
                const phone = m.profile?.phone;
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 py-3"
                    style={{ borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: color.bg, color: color.text }}
                    >
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{name}</p>
                      <p className="flex items-center gap-1.5 text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
                        <Mail size={10} style={{ flexShrink: 0 }} />{email}
                      </p>
                      {phone && (
                        <p className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                          <Phone size={10} style={{ flexShrink: 0 }} />{phone}
                        </p>
                      )}
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: '#EEEDFE', color: '#533AFD' }}
                      >
                        {m.role ?? 'viewer'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── PreviewModal ──────────────────────────────────────────────────────────────

function PreviewModal({ file, onClose }: { file: FileDetail; onClose: () => void }) {
  const [url,   setUrl]   = useState<string | null>(null);
  const [error, setError] = useState(false);
  const ext = getFileExtension(file.name).toLowerCase();

  const isImage   = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf     = ext === 'pdf';
  const isPreview = isImage || isPdf;

  useEffect(() => {
    const { data } = supabase.storage
      .from('files')
      .getPublicUrl(file.storage_path);
    if (data?.publicUrl) setUrl(data.publicUrl);
    else setError(true);
  }, [file.storage_path]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col rounded-xl overflow-hidden"
        style={{
          background: 'var(--surface, #1a1f2e)',
          border:     '1px solid var(--border)',
          boxShadow:  '0 24px 64px rgba(0,0,0,0.4)',
          width:      isImage ? 'auto' : '90vw',
          maxWidth:   '960px',
          maxHeight:  '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium truncate max-w-[80%]" style={{ color: 'var(--text)' }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:opacity-70 transition-opacity"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-4" style={{ minHeight: '300px' }}>
          {!url && !error ? (
            <div className="flex items-center gap-2" style={{ color: 'var(--text3)' }}>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading preview…</span>
            </div>
          ) : error || !isPreview ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div
                className="w-16 h-20 rounded-lg flex items-center justify-center font-mono text-sm font-medium"
                style={{ background: getFileConfig(ext).bg, color: getFileConfig(ext).color }}
              >
                {ext.toUpperCase()}
              </div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                Preview not available for this file type
              </p>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium" style={{ color: '#533AFD' }}>
                  Open in new tab ↗
                </a>
              )}
            </div>
          ) : isImage ? (
            <img src={url!} alt={file.name} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
          ) : (
            <iframe src={url!} title={file.name} className="w-full rounded-lg" style={{ height: '70vh', border: 'none' }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── EditMetadataModal — gray aesthetic ────────────────────────────────────────

function EditMetadataModal({
  file,
  onClose,
  onSaved,
}: {
  file:    FileDetail;
  onClose: () => void;
  onSaved: (updated: Partial<FileDetail>) => void;
}) {
  const { groups } = useGroups();
  const [description, setDescription] = useState(file.description ?? '');
  const [tags,        setTags]        = useState<string[]>(file.tags ?? []);
  const [tagInput,    setTagInput]    = useState('');
  const [groupId,     setGroupId]     = useState<string | null>(file.group_id ?? null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(',', '');
      if (!tags.includes(tag)) setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updates: Record<string, unknown> = { description, tags, group_id: groupId };
      const { error: updateError } = await supabase
        .from('files')
        .update(updates)
        .eq('id', file.id);
      if (updateError) throw updateError;
      onSaved({ description, tags, group_id: groupId });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // ── shared field styles (gray palette) ─────────────────────────────────
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest mb-1.5';
  const fieldCls = [
    'w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all duration-150',
    'bg-[#F3F4F6] border border-[#E5E7EB] text-[#111827]',
    'placeholder-[#9CA3AF]',
    'focus:bg-white focus:border-[#533AFD] focus:ring-2 focus:ring-[#533AFD]/12',
  ].join(' ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl w-full max-w-md overflow-hidden"
        style={{
          background: '#FFFFFF',
          border:     '1px solid #E5E7EB',
          boxShadow:  '0 20px 60px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.06)',
          maxHeight:  '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#EEF2FF' }}
            >
              <Edit3 size={13} style={{ color: '#533AFD' }} />
            </div>
            <span className="text-sm font-semibold text-[#111827]">Edit Metadata</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280' }}
            onMouseOver={e => (e.currentTarget.style.background = '#E5E7EB')}
            onMouseOut={e  => (e.currentTarget.style.background = '#F3F4F6')}
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5" style={{ background: '#FFFFFF' }}>

          {/* File (read-only) */}
          <div>
            <label className={labelCls} style={{ color: '#6B7280' }}>File</label>
            <div
              className="px-3.5 py-2.5 rounded-lg text-sm truncate"
              style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280' }}
            >
              {file.name}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls} style={{ color: '#6B7280' }}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this file…"
              className={fieldCls + ' resize-none leading-relaxed'}
            />
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls} style={{ color: '#6B7280' }}>Tags</label>
            <div
              className="flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-lg min-h-[44px] transition-all duration-150 focus-within:bg-white focus-within:border-[#533AFD] focus-within:ring-2 focus-within:ring-[#533AFD]/12"
              style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}
            >
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
                  style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}
                >
                  <Tag size={9} />
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(x => x !== t))}
                    className="transition-opacity hover:opacity-60 ml-0.5"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              <input
                className="bg-transparent border-none outline-none text-sm flex-1 min-w-[100px] text-[#111827] placeholder-[#9CA3AF]"
                placeholder={tags.length === 0 ? 'Add tag, press Enter…' : 'Add more…'}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>

          {/* Share with Group */}
          <div>
            <label className={labelCls} style={{ color: '#6B7280' }}>Share with Group</label>
            <div className="relative">
              <select
                value={groupId ?? ''}
                onChange={e => setGroupId(e.target.value || null)}
                className={fieldCls + ' appearance-none pr-8 cursor-pointer'}
              >
                <option value="">Personal — don't share</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                ))}
              </select>
              {/* chevron */}
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                width="12" height="12" viewBox="0 0 12 12" fill="none"
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
            >
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#374151' }}
            onMouseOver={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseOut={e  => (e.currentTarget.style.background = '#FFFFFF')}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 text-white"
            style={{ background: saving ? '#7C6FFC' : '#533AFD' }}
            onMouseOver={e => { if (!saving) e.currentTarget.style.background = '#4330d4'; }}
            onMouseOut={e  => { if (!saving) e.currentTarget.style.background = '#533AFD'; }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FileDetail page ───────────────────────────────────────────────────────────

export default function FileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [file,         setFile]         = useState<FileDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [showPreview,  setShowPreview]  = useState(false);
  const [showEditMeta, setShowEditMeta] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('files')
          .select(`
            *,
            uploaded_by_profile:profiles!uploaded_by(full_name),
            group:groups(name, icon, description)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!cancelled) setFile(data as FileDetail);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('Error fetching file:', msg);
          showToast('Could not load file details', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, showToast]);

  async function handleDownload() {
    if (!file) return;
    try {
      await downloadFile(file.storage_path, file.name);
      showToast(`Downloading ${file.name}`);
    } catch {
      showToast('Download failed', 'error');
    }
  }

  function handleMetaSaved(updated: Partial<FileDetail>) {
    setFile(prev => prev ? { ...prev, ...updated } : prev);
    showToast('Metadata updated');
  }

  if (loading) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text3)' }}>Loading…</div>
    </Layout>
  );

  if (!file) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text3)' }}>File not found</div>
    </Layout>
  );

  const ext     = getFileExtension(file.name);
  const cfg     = getFileConfig(ext);
  const dateStr = file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : '—';

  const META = [
    ['File Type',   `.${(file.file_type || ext || '').toUpperCase()}`],
    ['File Size',   formatBytes(file.size_bytes)],
    ['Upload Date', dateStr],
    ['Uploaded By', file.uploaded_by_profile?.full_name || 'Unknown'],
    ['Group',       file.group?.name || 'Personal'],
    ['Version',     `v${file.version || 1}`],
  ];

  return (
    <Layout>
      <Header title="File Detail" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text3)' }}>
          <button
            onClick={() => navigate('/catalog')}
            className="cursor-pointer transition-colors hover:text-cyan-400 bg-transparent border-none p-0"
            style={{ color: 'var(--text3)' }}
          >
            My Catalog
          </button>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{file.name}</span>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>

          {/* ── Left column ── */}
          <div className="flex flex-col gap-4">
            <div className="card flex flex-col items-center justify-center py-10 gap-4">
              <div
                className="rounded-xl flex items-center justify-center font-mono text-lg font-medium"
                style={{ width: 80, height: 96, background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl" style={{ color: 'var(--text)' }}>{file.name}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                  {formatBytes(file.size_bytes)} · Uploaded {dateStr}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="primary" onClick={handleDownload}>
                  <Download size={13} className="mr-1" /> Download
                </Button>
                <Button variant="ghost" onClick={() => setShowPreview(true)}>
                  <Eye size={13} className="mr-1" /> Preview
                </Button>
                <Button variant="ghost" onClick={() => setShowEditMeta(true)}>
                  <Edit3 size={13} className="mr-1" /> Edit Metadata
                </Button>
              </div>
            </div>

            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                File Metadata
              </div>
              <div className="grid gap-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {META.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text3)' }}>{label}</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {file.description && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--text3)' }}>Description</div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{file.description}</div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                Audit Log
              </div>
              <AuditLog fileId={id || ''} />
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                Version History
              </div>
              <VersionHistory fileId={id || ''} currentVersion={file.version} />
            </div>

            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                Group Access
              </div>
              {file.group && file.group_id ? (
                <GroupAccessPanel
                  groupId={file.group_id}
                  groupName={file.group.name}
                  groupIcon={file.group.icon}
                />
              ) : (
                <div className="text-sm" style={{ color: 'var(--text3)' }}>
                  Personal file — not shared with any group
                </div>
              )}
            </div>

            {(file.tags?.length ?? 0) > 0 && (
              <div className="card">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {file.tags?.map((t: string) => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showPreview  && <PreviewModal      file={file} onClose={() => setShowPreview(false)} />}
      {showEditMeta && <EditMetadataModal file={file} onClose={() => setShowEditMeta(false)} onSaved={handleMetaSaved} />}
    </Layout>
  );
}
