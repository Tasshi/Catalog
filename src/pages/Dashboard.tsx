import { useFiles } from '../hooks/useFiles';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { FileRow } from '../components/catalog/FileCard';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from '../lib/storage';
import { useApp } from '../contexts/AppContext';

function StatCard({ num, label, change, icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-3xl mb-0.5" style={{ color: 'var(--text)' }}>{num}</div>
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{label}</div>
          {change && <div className="text-xs mt-1" style={{ color: 'var(--green)' }}>{change}</div>}
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { files, loading, deleteFile, logAction } = useFiles();
  const { groups } = useGroups();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const recent = files.slice(0, 8);
  const totalSize = files.reduce((sum, f) => sum + (f.size_bytes || 0), 0);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(1);

  async function handleDownload(file) {
    try { await downloadFile(file.storage_path, file.name); showToast(`Downloading ${file.name}`); }
    catch { showToast('Download failed', 'error'); }
  }

  async function handleDelete(file) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await deleteFile(file.id); showToast(`"${file.name}" deleted`);
  }

  return (
    <Layout>
      <Header title={`Welcome back${profile?.full_name ? ', ' + profile.full_name.split(' ')[0] : ''} 👋`} />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        {/* Stats */}
        <div className="grid gap-3.5 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatCard num={files.length} label="Total Files" change={files.length > 0 ? `+${Math.min(files.length, 3)} this month` : null} icon="🗂" />
          <StatCard num={groups.length} label="Groups" icon="👥" />
          <StatCard num={`${sizeMB} MB`} label="Storage Used" icon="💾" />
          <StatCard num={files.filter(f => f.group_id).length} label="Shared Files" icon="🔗" />
        </div>

        {/* Recent Files */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-lg" style={{ color: 'var(--text)' }}>Recent Files</h2>
            <button className="text-sm transition-colors" style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/catalog')}>
              View all →
            </button>
          </div>
          {loading ? (
            <div className="text-sm py-8 text-center" style={{ color: 'var(--text3)' }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--navy2)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
              <div className="text-4xl mb-3 opacity-30">📂</div>
              <div className="text-sm mb-4">No files yet</div>
              <button className="btn-primary text-sm px-4 py-2 rounded-lg" onClick={() => navigate('/upload')}
                style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue2))', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--navy2)' }}>
                    {['File', 'Type', 'Group', 'Owner', 'Date', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-semibold uppercase tracking-wider px-3.5 py-2.5"
                        style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(f => (
                    <FileRow key={f.id} file={f}
                      onView={f => navigate(`/files/${f.id}`)}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
