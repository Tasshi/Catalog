// import { useState } from 'react';
// import { Modal, Button, Avatar } from '../layout/ui';
// import { useGroupMembers } from '../../hooks/useGroups';
// import { useApp } from '../../contexts/AppContext';
// import { Trash2 } from 'lucide-react';
// import type { Group } from '../layout/ui/cons';

// const ROLE_STYLES = {
//   owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
//   editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
//   viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
// };

// interface GroupMemberModalProps {
//   group:   Group | null;
//   open:    boolean;
//   onClose: () => void;
// }

// export default function GroupMemberModal({ group, open, onClose }: GroupMemberModalProps) {
//   const { members, removeMember} = useGroupMembers(group?.id ?? null);
//   const { showToast } = useApp();
//   const [newEmail, setNewEmail] = useState('');
//   const [newRole, setNewRole] = useState('viewer');

//   async function handleAdd() {
//     if (!newEmail.trim()) return;
//     try {
//       // In production, you'd look up user by email first
//       showToast(`Invite sent to ${newEmail}`);
//       setNewEmail('');
//     } catch { showToast('Failed to add member', 'error'); }
//   }

//   async function handleRemove(member: { id: string; role: string; profile?: { full_name: string | null } | null }) {
//     await removeMember(member.id);
//     showToast(`${member.profile?.full_name || 'Member'} removed`);
//   }

//   if (!group) return null;

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={`${group.icon || '📁'} ${group.name} — Members`}
//       footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
//     >
//       {/* Members list */}
//       <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
//         <table className="w-full border-collapse">
//           <thead>
//             <tr style={{ background: 'var(--navy3)' }}>
//               {['Member', 'Role', 'Joined', ''].map((h, i) => (
//                 <th key={i} className="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2.5"
//                   style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {members.map(m => {
//               const roleStyle = ROLE_STYLES[m.role as keyof typeof ROLE_STYLES] ?? ROLE_STYLES.viewer;
//               return (
//                 <tr key={m.id}>
//                   <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
//                     <div className="flex items-center gap-2">
//                       <Avatar name={m.profile?.full_name || ''} size="xs" />
//                       <span className="text-sm" style={{ color: 'var(--text)' }}>{m.profile?.full_name || 'Unknown'}</span>
//                     </div>
//                   </td>
//                   <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
//                     <span className="text-xs font-semibold px-2.5 py-0.5 rounded-xl capitalize"
//                       style={{ background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
//                       {m.role}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2.5 text-xs font-mono" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
//                     {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
//                   </td>
//                   <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
//                     {m.role !== 'owner' && (
//                       <button className="icon-btn" onClick={() => handleRemove(m)} style={{ color: '#fc8181' }}>
//                         <Trash2 size={11} />
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Add member */}
//       <div>
//         <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
//           Invite Member
//         </div>
//         <div className="flex gap-2">
//           <input
//             className="form-input flex-1"
//             placeholder="Email address…"
//             value={newEmail}
//             onChange={e => setNewEmail(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && handleAdd()}
//           />
//           <select
//             className="form-input"
//             style={{ width: 100 }}
//             value={newRole}
//             onChange={e => setNewRole(e.target.value)}
//           >
//             <option value="viewer">Viewer</option>
//             <option value="editor">Editor</option>
//             <option value="owner">Owner</option>
//           </select>
//           <Button variant="primary" onClick={handleAdd}>Invite</Button>
//         </div>
//       </div>
//     </Modal>
//   );
// }
import { useState } from 'react';
import { Modal, Button, Avatar } from '../layout/ui';
import { useGroupMembers } from '../../hooks/useGroups';
import { useApp } from '../../contexts/AppContext';
import { Trash2 } from 'lucide-react';
import type { Group, GroupMember } from '../layout/ui/cons';

const ROLE_STYLES = {
  owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
  editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
  viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
};

interface GroupMemberModalProps {
  group:   Group | null;
  open:    boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string, members: GroupMember[]): string {
  const v = value.trim();
  if (!v)                                                      return 'Email is required.';
  if (!EMAIL_RE.test(v))                                       return 'Enter a valid email address.';
  if (members.some(m => m.profile?.email?.toLowerCase() === v.toLowerCase()))
                                                               return 'This member is already in the group.';
  return '';
}

export default function GroupMemberModal({ group, open, onClose }: GroupMemberModalProps) {
  const { members, removeMember} = useGroupMembers(group?.id ?? null);
  const { showToast } = useApp();
  const [newEmail,  setNewEmail]  = useState('');
  const [newRole,   setNewRole]   = useState('viewer');
  const [touched,   setTouched]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailError = touched ? validateEmail(newEmail, members) : '';
  const isValid    = validateEmail(newEmail, members) === '';

  function handleChange(v: string) {
    setNewEmail(v);
    if (!touched && v) setTouched(true);
  }

  async function handleAdd() {
    setTouched(true);
    if (!isValid) return;
    setSubmitting(true);
    try {
      showToast(`Invite sent to ${newEmail.trim()}`);
      setNewEmail('');
      setTouched(false);
    } catch { showToast('Failed to add member', 'error'); }
    finally { setSubmitting(false); }
  }

  async function handleRemove(member: GroupMember) {  // ✅ use GroupMember directly
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
              const roleStyle = ROLE_STYLES[m.role as keyof typeof ROLE_STYLES] ?? ROLE_STYLES.viewer;
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
        <div className="flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-1">
            <input
              className="form-input"
              placeholder="Email address…"
              type="email"
              value={newEmail}
              onChange={e => handleChange(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={e => e.key === 'Enter' && void handleAdd()}
              style={emailError ? { borderColor: '#f87171', outline: 'none' } : {}}
              aria-invalid={!!emailError}
            />
            {emailError && (
              <span className="text-[11px] font-medium" style={{ color: '#f87171' }}>
                {emailError}
              </span>
            )}
          </div>
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
          <Button
            variant="primary"
            onClick={() => void handleAdd()}
            disabled={submitting}
          >
            {submitting ? 'Inviting…' : 'Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}