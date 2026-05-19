import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../layout/ui';
import { format } from 'date-fns';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ActionKey = 'upload' | 'view' | 'download' | 'edit' | 'delete' | 'restore';

interface LogEntry {
  id: string;
  action: ActionKey | string;
  created_at: string;
  profile?: { full_name: string | null } | null;
}

// ─── Action config ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionKey, { icon: string; color: string; bg: string }> = {
  upload:   { icon: '↑', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  view:     { icon: '◎', color: 'text-sky-600',     bg: 'bg-sky-50 border-sky-200'         },
  download: { icon: '↓', color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200'   },
  edit:     { icon: '✦', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'     },
  delete:   { icon: '✕', color: 'text-red-500',     bg: 'bg-red-50 border-red-200'         },
  restore:  { icon: '↺', color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200'   },
};

const DEFAULT_CONFIG = { icon: '•', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' };

// ─── Styles ─────────────────────────────────────────────────────────────────────

const s = {
  // Empty state
  empty: 'py-8 text-center text-[12px] text-slate-400 font-medium tracking-wide',

  // Timeline wrapper
  list: 'flex flex-col',

  // Single row
  row: [
    'group relative flex items-start gap-3 py-3',
    'border-b border-slate-100 last:border-0',
  ].join(' '),

  // Left timeline line (decorative)
  // sits behind the avatar, connects rows
  timelineLine: [
    'absolute left-[15px] top-9 bottom-0 w-px',
    'bg-slate-100 group-last:hidden',
  ].join(' '),

  // Action icon badge
  badgeWrap: 'shrink-0 mt-0.5',
  badge: [
    'flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-bold',
    'shadow-sm',
  ].join(' '),

  // Avatar wrapper — overlaps timeline line
  avatarWrap: 'relative shrink-0 mt-0.5',

  // Text block
  body: 'flex-1 min-w-0',
  primaryLine: 'flex items-baseline gap-1 flex-wrap text-[13px] leading-snug text-slate-700',
  actionLabel: 'font-semibold text-slate-800 capitalize',
  byWord: 'text-slate-400 font-normal',
  userName: 'text-slate-700',
  timestamp: [
    'mt-0.5 text-[11px] text-slate-400 tabular-nums',
    'font-["DM_Mono",ui-monospace,monospace]',
  ].join(' '),
} as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AuditLog({ fileId }: { fileId?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!fileId) return;
    supabase
      .from('audit_logs')
      .select('*, profile:profiles!user_id(full_name)')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setLogs((data as LogEntry[]) || []));
  }, [fileId]);

  if (logs.length === 0) {
    return <div className={s.empty}>No activity yet</div>;
  }

  return (
    <div className={s.list} role="log" aria-label="File activity log">
      {logs.map(log => {
        const cfg = ACTION_CONFIG[log.action as ActionKey] ?? DEFAULT_CONFIG;
        const name = log.profile?.full_name || 'Unknown';

        return (
          <div key={log.id} className={s.row}>

            {/* Vertical connector line behind avatar */}
            <div className={s.timelineLine} aria-hidden="true" />

            {/* Avatar */}
            <div className={s.avatarWrap}>
              <Avatar name={name} size="xs" />
              {/* Action badge — sits bottom-right of avatar */}
              <span
                className={`absolute -bottom-1 -right-1 flex items-center justify-center
                  w-4 h-4 rounded-full border bg-white
                  text-[8px] font-bold leading-none
                  shadow-sm
                  ${cfg.color}`}
                aria-hidden="true"
              >
                {cfg.icon}
              </span>
            </div>

            {/* Text */}
            <div className={s.body}>
              <p className={s.primaryLine}>
                <span className={`${s.actionLabel} ${cfg.color}`}>{log.action}</span>
                <span className={s.byWord}>by</span>
                <span className={s.userName}>{name}</span>
              </p>
              <time
                className={s.timestamp}
                dateTime={log.created_at}
                title={log.created_at}
              >
                {format(new Date(log.created_at), "MMM d, yyyy '·' h:mm a")}
              </time>
            </div>

          </div>
        );
      })}
    </div>
  );
}
