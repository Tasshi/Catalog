import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import GroupList from '../components/groups/GroupList';
import GroupMemberModal from '../components/groups/GroupMemberModal';
import { Modal, Button, FormField } from '../components/ui';
import { useGroups } from '../hooks/useGroups';
import { useApp } from '../contexts/AppContext';
import { Plus } from 'lucide-react';
import CatalogView from '../components/catalog/CatalogView';
import {Group} from '../components/ui/cons'

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'groups' | 'detail';

// ── Constants ─────────────────────────────────────────────────────────────────

const ICONS = ['📁','📂','📊','🗂️','🗃️','📋','📌','🏷️'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Groups() {
  const { createGroup } = useGroups();
  const { showToast } = useApp();

  const [createOpen, setCreateOpen]     = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersOpen, setMembersOpen]   = useState(false);
  const [groupName, setGroupName]       = useState('');
  const [groupDesc, setGroupDesc]       = useState('');
  const [groupIcon, setGroupIcon]       = useState('📁');
  const [view, setView]                 = useState<ViewMode>('groups');

  async function handleCreate() {
    if (!groupName.trim()) return;
    try {
      await createGroup({ name: groupName, description: groupDesc, icon: groupIcon });
      showToast(`Group "${groupName}" created!`);
      setCreateOpen(false);
      setGroupName('');
      setGroupDesc('');
      setGroupIcon('📁');
    } catch (e) {
      // FIX 1: e is unknown in TS — must narrow before accessing .message
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      showToast(msg, 'error');
    }
  }

  function handleSelectGroup(group: Group) {
    setSelectedGroup(group);
    setView('detail');
  }

  function handleBack() {
    setView('groups');
    setSelectedGroup(null);
  }

  return (
    <Layout>
      <Header
        title={
          view === 'detail' && selectedGroup
            ? `${selectedGroup.icon ?? '📁'} ${selectedGroup.name}`
            : 'Groups'
        }
        actions={
          <div className="flex gap-2">
            {view === 'detail' && (
              <>
                <Button variant="ghost" onClick={handleBack}>← Back</Button>
                <Button variant="ghost" onClick={() => setMembersOpen(true)}>
                  👥 Members
                </Button>
              </>
            )}
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={13} /> New Group
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        {view === 'groups' ? (
          <GroupList onSelect={handleSelectGroup} />
        ) : (
          <div>
            {/* FIX 2: replaced var(--text3) with DESIGN.md token */}
            <div className="mb-4 text-sm text-[#64748D]">
              {selectedGroup?.description}
            </div>
            <CatalogView groupId={selectedGroup?.id} />
          </div>
        )}
      </div>

      {/* Create group modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create Group</Button>
          </>
        }
      >
        <FormField label="Group Name">
          {/* FIX 3: replaced .form-input class with explicit Tailwind */}
          <input
            className="h-10 w-full px-4 text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
            placeholder="e.g. Marketing Team Q3"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
        </FormField>

        <FormField label="Description">
          <input
            className="h-10 w-full px-4 text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
            placeholder="Short description of this group's purpose"
            value={groupDesc}
            onChange={e => setGroupDesc(e.target.value)}
          />
        </FormField>

        <FormField label="Icon">
          <div className="flex gap-2 flex-wrap">
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setGroupIcon(icon)}
                className={[
                  'text-xl p-1.5 rounded transition-all cursor-pointer border-2',
                  // FIX 4: replaced var(--cyan) + rgba(34,211,238,0.1) with DESIGN.md purple tokens
                  groupIcon === icon
                    ? 'bg-[#E8E9FF] border-[#533AFD]'
                    : 'bg-transparent border-transparent hover:bg-[#F3F3F3]',
                ].join(' ')}
              >
                {icon}
              </button>
            ))}
          </div>
        </FormField>
      </Modal>

      {/* FIX 5: guard — GroupMemberModal only renders when selectedGroup is non-null */}
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