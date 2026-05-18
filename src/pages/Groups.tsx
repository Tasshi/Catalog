import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import GroupMemberModal from '../components/groups/GroupMemberModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { GroupCard } from '../components/groups/GroupCard';
import GroupDetail from '../components/groups/GroupDetail';
import { Button } from '../components/ui/index';
import { Plus } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { usePermissions } from '../hooks/Usepermissions';
import type { Group } from '../components/ui/cons';


export default function Groups() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const { groups, loading } = useGroups();
  const { canManageGroups } = usePermissions();

  function handleSelectGroup(group: Group | null) {
    setSelectedGroup(group);
  }

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
            {/* Only admins can create groups */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {groups.map(g => (
                <GroupCard key={g.id} group={g} onClick={handleSelectGroup} />
              ))}
            </div>
          )
        ) : (
          <GroupDetail
            group={selectedGroup}
            onBack={() => handleSelectGroup(null)}
            onMembers={() => setMembersOpen(true)}
          />
        )}
      </div>

      {/* Modal only mounts for admins — members can never trigger it */}
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