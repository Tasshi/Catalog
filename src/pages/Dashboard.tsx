import { useFiles } from '../hooks/useFiles';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { FileRow } from '../components/catalog/FileCard';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from '../lib/storage';
import { useApp } from '../contexts/AppContext';
import { Upload, FolderOpen, Users, HardDrive, Share2 } from 'lucide-react';

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  num: string | number;
  label: string;
  sub?: string | null;
  icon: React.ReactNode;
  accentClass?: string;   // tailwind bg class for the top accent line
}

function StatCard({ num, label, sub, icon, accentClass = 'bg-slate-200' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#D4DEE9] rounded-lg p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden">
      {/* top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[2px] ${accentClass}`} />

      <div className="flex items-start justify-between mt-1">
        <div>
          <div className="text-[28px] font-medium text-[#061B31] leading-none mb-1">
            {num}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#64748D] font-medium">
            {label}
          </div>
          {sub && (
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">{sub}</div>
          )}
        </div>
        <div className="text-[#B8CCDB] mt-0.5">{icon}</div>
      </div>
    </div>
  );
}

// ─── Storage bar ──────────────────────────────────────────────────────────────

function StorageBar({ usedMB }: { usedMB: number }) {
  const QUOTA_MB = 500;
  const pct = Math.min(100, Math.round((usedMB / QUOTA_MB) * 100));
  const barClass =
    pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-sky-500';

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-lg p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-[#64748D] font-medium">
          Storage
        </span>
        <span className="text-[12px] font-medium text-[#273951]">
          {usedMB.toFixed(1)} MB
          <span className="text-[#64748D] font-normal"> / {QUOTA_MB} MB</span>
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[11px] text-[#64748D] mt-1.5">
        {pct}% used · {(QUOTA_MB - usedMB).toFixed(0)} MB free
      </div>
    </div>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-2 py-4 px-2 rounded-lg w-full',
        'bg-white border border-[#D4DEE9]',
        'shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
        'transition-all duration-150',
        'hover:border-[#B8CCDB] hover:shadow-[0px_4px_8px_rgba(0,0,0,0.07)] hover:-translate-y-0.5',
        'text-[#50617A] cursor-pointer',
      ].join(' ')}
    >
      <span className="text-[#64748D]">{icon}</span>
      <span className="text-[11px] uppercase tracking-wider font-medium text-[#64748D]">
        {label}
      </span>
    </button>
  );
}

// ─── Group pill ───────────────────────────────────────────────────────────────

function GroupPill({
  group,
  fileCount,
  onClick,
}: {
  group: any;
  fileCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center justify-between w-full',
        'px-3 py-2 rounded-md',
        'border border-[#D4DEE9] bg-slate-50',
        'transition-colors duration-100 hover:bg-white hover:border-[#B8CCDB]',
        'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{group.icon ?? '📁'}</span>
        <span className="text-[13px] text-[#273951]">{group.name}</span>
      </div>
      <span className="text-[11px] text-[#64748D] bg-white border border-[#D4DEE9] rounded-full px-2 py-0.5">
        {fileCount} {fileCount === 1 ? 'file' : 'files'}
      </span>
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuth();
  const { files, loading, deleteFile } = useFiles();
  const { groups } = useGroups();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const recent = files.slice(0, 8);
  const totalMB = files.reduce((s, f) => s + (f.size_bytes ?? 0), 0) / 1024 / 1024;
  const sharedCount = files.filter((f) => f.group_id).length;

  async function handleDownload(file: any) {
    try {
      await downloadFile(file.storage_path, file.name);
      showToast(`Downloading ${file.name}`);
    } catch {
      showToast('Download failed', 'error');
    }
  }

  async function handleDelete(file: any) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await deleteFile(file.id);
    showToast(`"${file.name}" deleted`);
  }

  return (
    <Layout>
      <Header
        title={`Welcome back${firstName ? ', ' + firstName : ''} 👋`}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            num={files.length}
            label="Total files"
            sub={files.length > 0 ? `+${Math.min(files.length, 3)} this month` : null}
            icon={<FolderOpen size={20} strokeWidth={1.5} />}
            accentClass="bg-sky-400"
          />
          <StatCard
            num={groups.length}
            label="Groups"
            icon={<Users size={20} strokeWidth={1.5} />}
            accentClass="bg-violet-400"
          />
          <StatCard
            num={`${totalMB.toFixed(1)} MB`}
            label="Storage used"
            icon={<HardDrive size={20} strokeWidth={1.5} />}
            accentClass="bg-amber-400"
          />
          <StatCard
            num={sharedCount}
            label="Shared files"
            sub={sharedCount > 0 ? 'across groups' : null}
            icon={<Share2 size={20} strokeWidth={1.5} />}
            accentClass="bg-emerald-400"
          />
        </div>

        {/* ── Recent files ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[#273951]">Recent files</h2>
            <button
              className="text-[12px] text-sky-600 hover:text-sky-700 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/catalog')}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="text-[13px] py-10 text-center text-[#64748D]">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-14 rounded-lg bg-white border border-[#D4DEE9]">
              <div className="text-4xl mb-3 opacity-20">📂</div>
              <div className="text-[13px] text-[#64748D] mb-4">No files yet</div>
              <button
                className="text-[13px] px-4 py-2 rounded-md bg-[#061B31] text-white hover:bg-[#0f2d4a] transition-colors"
                onClick={() => navigate('/upload')}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Upload your first file
              </button>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-[#D4DEE9] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#D4DEE9]">
                    {['File', 'Type', 'Group', 'Owner', 'Date', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5 text-[#64748D]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((f) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      onView={(f) => navigate(`/files/${f.id}`)}
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