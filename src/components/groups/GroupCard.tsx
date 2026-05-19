import type { Group } from '../layout/ui/cons';

interface GroupCardProps {
  group:   Group;
  onClick: (group: Group) => void;
}

// ── Palette — hashed from group.id so each group keeps a consistent color ─────

const PALETTES = [
  { tab: '#1a5276', body: '#2471a3' }, // blue
  { tab: '#1e8449', body: '#27ae60' }, // green
  { tab: '#7d6608', body: '#d4ac0d' }, // amber
  { tab: '#6e2f8a', body: '#9b59b6' }, // purple
  { tab: '#922b21', body: '#e74c3c' }, // red
  { tab: '#0e6655', body: '#1abc9c' }, // teal
] as const;

function getPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// ── FolderIcon ────────────────────────────────────────────────────────────────

function FolderIcon({
  tab, body, fileCount, icon,
}: { tab: string; body: string; fileCount: number; icon?: string }) {
  return (
    <div style={{ position: 'relative', width: 96, height: 76, flexShrink: 0 }}>
      {/* Tab */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 40, height: 14,
        borderRadius: '5px 5px 0 0',
        background: tab,
      }} />

      {/* Body */}
      <div style={{
        position: 'absolute', top: 11, left: 0,
        width: 96, height: 65,
        borderRadius: '3px 8px 8px 8px',
        background: body,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '6px 8px',
      }}>
        {/* Shine */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 1, background: 'rgba(255,255,255,0.25)',
        }} />

        {/* Emoji icon centered */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          fontSize: 22, lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }}>
          {icon ?? '📁'}
        </div>

        {/* File count badge */}
        <div style={{
          position: 'absolute', bottom: 6, right: 7,
          fontSize: 10, fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          background: 'rgba(0,0,0,0.28)',
          borderRadius: 20, padding: '1px 6px',
        }}>
          {fileCount}
        </div>
      </div>
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { tab, body } = getPalette(group.id);
  const fileCount     = group.files?.[0]?.count ?? 0;
  const memberCount   = group.group_members?.[0]?.count ?? 0;

  return (
    <button
      onClick={() => onClick(group)}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '22px 24px',
        background: '#0f1e30',
        border: '1px solid #1e3248',
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#162840';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2e4a6a';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#0f1e30';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e3248';
      }}
    >
      {/* Top: folder icon + name + desc */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <FolderIcon tab={tab} body={body} fileCount={fileCount} icon={group.icon} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{
            fontSize: 20, fontWeight: 600, color: '#e8f0fe',
            lineHeight: 1.2, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {group.name}
          </span>
          {group.description && (
            <span style={{
              fontSize: 14, color: '#5a7898', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {group.description}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: members pill + Active badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 13, fontWeight: 500, color: '#5b8fd4',
          background: '#0e2040', border: '1px solid #1a3a60',
          padding: '5px 14px', borderRadius: 20,
        }}>
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#2ecc71',
          background: '#0a2a18', border: '1px solid #1a4a28',
          padding: '5px 14px', borderRadius: 20,
        }}>
          Active
        </span>
      </div>
    </button>
  );
}