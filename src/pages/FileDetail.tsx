import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import AuditLog from '../components/filedetail/AuditLog';
import VersionHistory from '../components/filedetail/VersionHistory';
import { Badge, Avatar, Button } from '../components/ui';
import { getFileConfig, getFileExtension } from '../lib/metadata';
import { downloadFile, formatBytes } from '../lib/storage';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { Download, Eye, Edit3, Trash2 } from 'lucide-react';

export default function FileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('files')
      .select('*, uploaded_by_profile:profiles!uploaded_by(full_name), group:groups(name, icon, description)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setFile(data);
        setLoading(false);
      });
  }, [id]);

  async function handleDownload() {
    try {
      await downloadFile(file.storage_path, file.name);
      showToast(`Downloading ${file.name}`);
    } catch { showToast('Download failed', 'error'); }
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

  const ext = getFileExtension(file.name);
  const cfg = getFileConfig(ext);
  const dateStr = file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : '—';

  const META = [
    ['File Type', `.${(file.file_type || ext || '').toUpperCase()}`],
    ['File Size', formatBytes(file.size_bytes)],
    ['Upload Date', dateStr],
    ['Uploaded By', file.uploaded_by_profile?.full_name || 'Unknown'],
    ['Group', file.group?.name || 'Personal'],
    ['Version', `v${file.version || 1}`],
  ];

  return (
    <Layout>
      <Header title="File Detail" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text3)' }}>
          <button onClick={() => navigate('/catalog')} className="cursor-pointer transition-colors hover:text-cyan-400 bg-transparent border-none"
            style={{ color: 'var(--text3)', padding: 0 }}>My Catalog</button>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{file.name}</span>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Preview card */}
            <div className="card flex flex-col items-center justify-center py-10 gap-4">
              <div className="rounded-xl flex items-center justify-center font-mono text-lg font-medium"
                style={{ width: 80, height: 96, background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </div>
              <div className="text-center">
                <div className="font-serif text-2xl" style={{ color: 'var(--text)' }}>{file.name}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                  {formatBytes(file.size_bytes)} · Uploaded {dateStr}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="primary" onClick={handleDownload}><Download size={13} /> Download</Button>
                <Button variant="ghost"><Eye size={13} /> Preview</Button>
                <Button variant="ghost"><Edit3 size={13} /> Edit Metadata</Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>File Metadata</div>
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

            {/* Audit log */}
            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Audit Log</div>
              <AuditLog fileId={id} />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Version History</div>
              <VersionHistory fileId={id} currentVersion={file.version} />
            </div>

            <div className="card">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Group Access</div>
              {file.group ? (
                <div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg mb-2"
                    style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}>
                    <span className="text-xl">{file.group.icon}</span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{file.group.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text3)' }}>Shared with group members</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--text3)' }}>Personal file — not shared with any group</div>
              )}
            </div>

            {file.tags?.length > 0 && (
              <div className="card">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {file.tags.map(t => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
