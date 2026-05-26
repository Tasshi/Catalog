import type { Group } from '../layout/ui/cons';
import { PALETTES } from '@/constant/fileIcons';

interface GroupCardProps {
  group:   Group;
  onClick: (group: Group) => void;
}

function getPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

function FolderIcon({
  tab, body, icon,
}: { tab: string; body: string; icon?: string }) {
  return (
    <div style={{ position: 'relative', width: 88, height: 70, flexShrink: 0 }}>
      {/* Tab */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 36, height: 13,
        borderRadius: '5px 5px 0 0',
        background: tab,
      }} />
      {/* Body */}
      <div style={{
        position: 'absolute', top: 10, left: 0,
        width: 88, height: 60,
        borderRadius: '3px 8px 8px 8px',
        background: body,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Shine */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 1, background: 'rgba(255,255,255,0.3)',
        }} />
        {/* Emoji */}
        <div style={{
          fontSize: 22, lineHeight: 1,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
          marginBottom: 6,
        }}>
          {icon ?? '📁'}
        </div>
      </div>
    </div>
  );
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const { tab, body } = getPalette(group.id);
  const memberCount   = group.group_members?.[0]?.count ?? 0;

  return (
    <button
      onClick={() => onClick(group)}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '20px 22px',
        background: '#ffffff',
        border: '1px solid #e8edf3',
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)';
        el.style.borderColor = '#d0dae4';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        el.style.borderColor = '#e8edf3';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: folder icon + name + description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <FolderIcon tab={tab} body={body} icon={group.icon} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: 17, fontWeight: 700, color: '#0f172a',
            lineHeight: 1.25, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {group.name}
          </span>
          {group.description && (
            <span style={{
              fontSize: 13, color: '#94a3b8', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {group.description}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f1f5f9', margin: '0 -2px' }} />

      {/* Bottom row: members pill + Active badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 12, fontWeight: 500, color: '#64748b',
          background: '#f1f5f9', border: '1px solid #e2e8f0',
          padding: '4px 12px', borderRadius: 20,
        }}>
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#16a34a',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          padding: '4px 12px', borderRadius: 20,
        }}>
          Active
        </span>
      </div>
    </button>
  );
}
