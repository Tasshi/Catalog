import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui';
import { format } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Version {
  id: string;
  version_number: number;
  created_at: string;
  profile?: { full_name: string | null } | null;
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const s = {
  empty: 'py-6 text-center text-xs text-slate-400 font-medium tracking-wide',

  list: 'flex flex-col',

  row: [
    'group flex items-center gap-3 py-3',
    'border-b border-slate-100 last:border-0',
  ].join(' '),

  // Version badge — monospaced pill
  versionBadge: [
    'shrink-0 inline-flex items-center justify-center',
    'h-5 w-8 rounded',
    'bg-indigo-50 border border-indigo-200',
    'text-[10px] font-bold font-mono text-indigo-600 tracking-tight',
  ].join(' '),

  // Text block
  body: 'flex-1 min-w-0',
  date: 'text-[12px] font-medium text-slate-700 leading-snug',
  author: 'text-[11px] text-slate-400 mt-0.5',

  // Current badge
  currentBadge: [
    'inline-flex items-center h-5 px-2 rounded-full',
    'bg-emerald-50 border border-emerald-200',
    'text-[10px] font-semibold text-emerald-600 tracking-wide',
  ].join(' '),

  // Restore button — shown on row hover
  restoreBtn: [
    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
    'text-[11px] font-medium text-indigo-600',
    'hover:text-indigo-700',
  ].join(' '),
} as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function VersionHistory({
  fileId,
  currentVersion: __currentVersion }: { fileId: string; currentVersion: number })

{
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    if (!fileId) return;
    supabase
      .from('file_versions')
      .select('*, profile:profiles!uploaded_by(full_name)')
      .eq('file_id', fileId)
      .order('version_number', { ascending: false })
      .then(({ data }) => setVersions((data as Version[]) || []));
  }, [fileId]);

  if (versions.length === 0) {
    return <div className={s.empty}>Version history starts after the next upload</div>;
  }

  return (
    <div className={s.list} aria-label="Version history">
      {versions.map((v, i) => {
        const isCurrent = i === 0;

        return (
          <div key={v.id} className={s.row}>

            {/* Version number pill */}
            <span className={s.versionBadge} aria-label={`Version ${v.version_number}`}>
              v{v.version_number}
            </span>

            {/* Date + author */}
            <div className={s.body}>
              <div className={s.date}>
                {format(new Date(v.created_at), 'MMM d, yyyy')}
              </div>
              <div className={s.author}>
                by {v.profile?.full_name || 'Unknown'}
              </div>
            </div>

            {/* Action / status */}
            {isCurrent ? (
              <span className={s.currentBadge}>Current</span>
            ) : (
              <Button variant="ghost" className={s.restoreBtn}>
                Restore
              </Button>
            )}

          </div>
        );
      })}
    </div>
  );
}
