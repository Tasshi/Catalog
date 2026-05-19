import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import GroupMemberModal from '../components/groups/GroupMemberModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { GroupCard } from '../components/groups/GroupCard';
import GroupDetail from '../components/groups/GroupDetail';
import { Button } from '../components/layout/ui/index';
import { Plus } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { usePermissions } from '../hooks/Usepermissions';
import type { Group } from '../components/layout/ui/cons';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pillBase = [
  'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium',
  'transition-all duration-150 cursor-pointer border whitespace-nowrap',
].join(' ');

const pillActive   = 'bg-indigo-500 text-white border-indigo-500 shadow-sm';
const pillInactive = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Groups() {
  const [createOpen,    setCreateOpen]    = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersOpen,   setMembersOpen]   = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const { groups, loading } = useGroups();
  const { canManageGroups } = usePermissions();

  function handleSelectGroup(group: Group | null) {
    setSelectedGroup(group);
  }

  const visibleGroups = useMemo(() => {
    return filterGroupId
      ? groups.filter(g => g.id === filterGroupId)
      : groups;
  }, [groups, filterGroupId]);

  return (
    <Layout
      selectedGroupId={selectedGroup?.id ?? null}
      onSelectGroup={handleSelectGroup}
    >
      <Header
        title={
          selectedGroup
            ? `${selectedGroup.icon ?? '📁'} ${selectedGroup.name}`
            : 'Groups'
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedGroup && (
              <Button variant="ghost" onClick={() => handleSelectGroup(null)}>
                ← Back
              </Button>
            )}
            {canManageGroups && (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={13} /> New Cohort
              </Button>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="animate-slideIn">
        {!selectedGroup ? (
          loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080' }}>
              Loading groups…
            </div>
          ) : groups.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080', gap: 8 }}>
              <span style={{ fontSize: 40 }}>👥</span>
              <p>No groups yet{canManageGroups ? ' — create one to collaborate' : ''}</p>
            </div>
          ) : (
            <>
              {/* ── Pills row ── */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {/* All pill */}
                <button
                  type="button"
                  onClick={() => setFilterGroupId(null)}
                  className={[pillBase, filterGroupId === null ? pillActive : pillInactive].join(' ')}
                >
                  All
                </button>

                {/* One pill per group */}
                {groups.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFilterGroupId(prev => prev === g.id ? null : g.id)}
                    className={[pillBase, filterGroupId === g.id ? pillActive : pillInactive].join(' ')}
                  >
                    {g.icon && <span className="mr-1">{g.icon}</span>}
                    {g.name}
                    {(g.files?.[0]?.count ?? 0) > 0 && (
                      <span className={[
                        'ml-1.5 text-[11px]',
                        filterGroupId === g.id ? 'opacity-70' : 'text-slate-400',
                      ].join(' ')}>
                        {g.files![0].count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Group grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {visibleGroups.map(g => (
                  <GroupCard key={g.id} group={g} onClick={handleSelectGroup} />
                ))}
              </div>
            </>
          )
        ) : (
          <GroupDetail
            group={selectedGroup}
            onBack={() => handleSelectGroup(null)}
            onMembers={() => setMembersOpen(true)}
          />
        )}
      </div>

      {canManageGroups && (
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {selectedGroup && (
        <GroupMemberModal
          group={selectedGroup}
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
        />
      )}
    </Layout>
  );
}