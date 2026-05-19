import { useState } from 'react';
import { Modal, Button, Avatar } from '../layout/ui';
import { useGroupMembers } from '../../hooks/useGroups';
import { useApp } from '../../contexts/AppContext';
import { Trash2 } from 'lucide-react';

const ROLE_STYLES = {
  owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
  editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
  viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
};

export default function GroupMemberModal({ group, open, onClose }) {
  const { members, addMember, removeMember, updateRole } = useGroupMembers(group?.id);
  const { showToast } = useApp();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  async function handleAdd() {
    if (!newEmail.trim()) return;
    try {
      // In production, you'd look up user by email first
      showToast(`Invite sent to ${newEmail}`);
      setNewEmail('');
    } catch { showToast('Failed to add member', 'error'); }
  }

  async function handleRemove(member) {
    await removeMember(member.id);
    showToast(`${member.profile?.full_name || 'Member'} removed`);
  }

  if (!group) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${group.icon || '📁'} ${group.name} — Members`}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {/* Members list */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: 'var(--navy3)' }}>
              {['Member', 'Role', 'Joined', ''].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2.5"
                  style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const roleStyle = ROLE_STYLES[m.role] || ROLE_STYLES.viewer;
              return (
                <tr key={m.id}>
                  <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <Avatar name={m.profile?.full_name || ''} size="xs" />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{m.profile?.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-xl capitalize"
                      style={{ background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    {m.role !== 'owner' && (
                      <button className="icon-btn" onClick={() => handleRemove(m)} style={{ color: '#fc8181' }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add member */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
          Invite Member
        </div>
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            placeholder="Email address…"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            className="form-input"
            style={{ width: 100 }}
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
          <Button variant="primary" onClick={handleAdd}>Invite</Button>
        </div>
      </div>
    </Modal>
  );
}

