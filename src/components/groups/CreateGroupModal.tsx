// import { useState } from 'react';
// import { Modal, Button } from '../ui';
// import { useGroups, useGroupMembers } from '../../hooks/useGroups';
// import { useApp } from '../../contexts/AppContext';
// import { supabase } from '../../lib/supabase';
// import { X, Mail, Phone } from 'lucide-react';

// type InviteType = 'email' | 'phone';
// type MemberRole = 'viewer' | 'editor' | 'owner';

// interface PendingMember {
//   id: number;       // local-only key for React list rendering
//   label: string;    // display name derived from email/phone
//   value: string;    // raw email or phone string entered by user
//   role: MemberRole;
//   via: InviteType;
// }

// interface CreateGroupModalProps {
//   open: boolean;
//   onClose: () => void;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const ICONS = ['📁', '📂', '📊', '🗂️', '🗃️', '📋', '📌', '🏷️'];

// const ROLE_STYLES = {
//   owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
//   editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
//   viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
// };

// // ─── helpers ─────────────────────────────────────────────────────────────────

// function getInitials(name = '') {
//   return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
// }

// const AVATAR_COLORS = ['#e0e7ff', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#dbeafe'];
// function avatarBg(name = '') {
//   let h = 0;
//   for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
//   return AVATAR_COLORS[Math.abs(h)];
// }

// // ─── component ───────────────────────────────────────────────────────────────

// export default function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
//   const { createGroup }  = useGroups();
//   const { showToast }    = useApp();

//   // group details
//   const [name, setName]        = useState('');
//   const [description, setDesc] = useState('');
//   const [icon, setIcon]        = useState('📁');

//   // invite controls
//   const [inviteType, setInviteType] = useState<InviteType>('email');
//   const [inviteValue, setInviteVal] = useState('');
//   const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');

//   // pending members — held locally until "Create group" is submitted
//   const [members, setMembers] = useState<PendingMember[]>([]);

//   // newGroupId is set after createGroup resolves so useGroupMembers can
//   // subscribe to the correct group_id at the top level (hooks rule)
//   const [newGroupId, setNewGroupId] = useState<string | null>(null);
//   const { addMember } = useGroupMembers(newGroupId);

//   // ── add a pending member to the local list ────────────────────────────────
//   function handleAdd() {
//     const val = inviteValue.trim();
//     if (!val) return;

//     // Build a readable display label from the raw value
//     const label =
//       inviteType === 'email'
//         ? val.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
//         : val;

//     setMembers(prev => [
//       ...prev,
//       { id: Date.now(), label, value: val, role: inviteRole, via: inviteType },
//     ]);
//     setInviteVal('');
//   }

//   // ── remove from the pending list ──────────────────────────────────────────
//   function handleRemove(id: number) {
//     setMembers(prev => prev.filter(m => m.id !== id));
//   }

//   // ── submit ────────────────────────────────────────────────────────────────
//   async function handleCreate() {
//     if (!name.trim()) {
//       showToast('Group name is required', 'error');
//       return;
//     }
//     try {
//       // 1. Create the group — returns the new group row
//       const group = await createGroup({ name, description, icon });

//       // 2. Set the new group id so useGroupMembers (top-level) becomes active
//       setNewGroupId(group.id);

//       // 3. For each pending member, look up their Supabase user_id by email,
//       //    then call addMember(userId, role).
//       //    addMember signature from hook: (userId: string, role?: string) => Promise<void>
//       if (members.length > 0) {
//         await Promise.all(
//           members.map(async m => {
//             if (m.via === 'email') {
//               const { data: profile } = await supabase
//                 .from('profiles')
//                 .select('id')
//                 .eq('email', m.value)
//                 .single();

//               if (profile?.id) {
//                 await addMember(profile.id, m.role);
//               } else {
//                 // No matching profile — skip and log (queue invite email here later)
//                 console.warn(`[CreateGroup] No profile found for ${m.value}`);
//               }
//             }
//             // phone-based lookup would go here when your profiles table supports it
//           })
//         );
//       }

//       showToast(`Group "${name}" created!`);
//       handleClose();
//     } catch (err) {
//       console.error('[CreateGroupModal] handleCreate failed:', err);
//       showToast('Failed to create group', 'error');
//     }
//   }

//   // ── reset state and close ─────────────────────────────────────────────────
//   function handleClose() {
//     setName('');
//     setDesc('');
//     setIcon('📁');
//     setInviteVal('');
//     setInviteRole('viewer');
//     setInviteType('email');
//     setMembers([]);
//     setNewGroupId(null);
//     onClose();
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <Modal
//       open={open}
//       onClose={handleClose}
//       title="Create new group"
//       size="lg"
//       footer={
//         <div className="flex gap-2 justify-end">
//           <Button variant="ghost" onClick={handleClose}>Cancel</Button>
//           <Button variant="primary" onClick={handleCreate}>Create group</Button>
//         </div>
//       }
//     >
//       <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>

//         {/* ── Group name ─────────────────────────────────────────────────── */}
//         <div>
//           <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
//             style={{ color: 'var(--text3)' }}>
//             Group name
//           </label>
//           <input
//             className="form-input w-full"
//             placeholder="e.g. Marketing Team Q3"
//             value={name}
//             onChange={e => setName(e.target.value)}
//           />
//         </div>

//         {/* ── Description ────────────────────────────────────────────────── */}
//         <div>
//           <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
//             style={{ color: 'var(--text3)' }}>
//             Description
//           </label>
//           <input
//             className="form-input w-full"
//             placeholder="Short description of this group's purpose"
//             value={description}
//             onChange={e => setDesc(e.target.value)}
//           />
//         </div>

//         {/* ── Icon picker ────────────────────────────────────────────────── */}
//         <div>
//           <label className="text-xs font-semibold uppercase tracking-wider mb-2 block"
//             style={{ color: 'var(--text3)' }}>
//             Icon
//           </label>
//           <div className="flex gap-2 flex-wrap">
//             {ICONS.map(i => (
//               <button
//                 key={i}
//                 onClick={() => setIcon(i)}
//                 style={{
//                   width: 38, height: 38, fontSize: 19,
//                   borderRadius: 8,
//                   border: icon === i ? '2px solid var(--accent)' : '1px solid var(--border)',
//                   background: icon === i ? 'rgba(90,79,207,0.08)' : 'var(--glass2)',
//                   cursor: 'pointer',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 }}
//                 aria-label={`Select icon ${i}`}
//               >
//                 {i}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ── Divider ────────────────────────────────────────────────────── */}
//         <div style={{ borderTop: '1px solid var(--border)' }} />

//         {/* ── Members already added ──────────────────────────────────────── */}
//         {members.length > 0 && (
//           <div className="flex flex-col gap-1.5">
//             {members.map(m => {
//               const rs = ROLE_STYLES[m.role] || ROLE_STYLES.viewer;
//               return (
//                 <div
//                   key={m.id}
//                   className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
//                   style={{ border: '1px solid var(--border)', background: 'var(--glass2)' }}
//                 >
//                   {/* avatar */}
//                   <div style={{
//                     width: 26, height: 26, borderRadius: '50%',
//                     background: avatarBg(m.label),
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     fontSize: 10, fontWeight: 600, color: '#374151', flexShrink: 0,
//                   }}>
//                     {getInitials(m.label)}
//                   </div>

//                   {/* label */}
//                   <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
//                     {m.label}
//                   </span>

//                   {/* via icon */}
//                   {m.via === 'email'
//                     ? <Mail size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
//                     : <Phone size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
//                   }

//                   {/* role badge */}
//                   <span
//                     className="text-xs font-semibold px-2 py-0.5 rounded-xl capitalize"
//                     style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
//                   >
//                     {m.role}
//                   </span>

//                   {/* remove */}
//                   <button
//                     className="icon-btn"
//                     onClick={() => handleRemove(m.id)}
//                     style={{ color: '#fc8181', flexShrink: 0 }}
//                     aria-label="Remove member"
//                   >
//                     <X size={12} />
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* ── Invite section ─────────────────────────────────────────────── */}
//         <div>
//           <div className="text-xs font-semibold uppercase tracking-wider mb-2"
//             style={{ color: 'var(--text3)' }}>
//             Invite member
//           </div>

//           {/* email / phone tab toggle */}
//           <div className="flex gap-1.5 mb-2">
//             {(['email', 'phone'] as InviteType[]).map(tab => (
//               <button
//                 key={tab}
//                 onClick={() => { setInviteType(tab); setInviteVal(''); }}
//                 className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize"
//                 style={{
//                   border: inviteType === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
//                   background: inviteType === tab ? 'rgba(90,79,207,0.12)' : 'var(--glass2)',
//                   color: inviteType === tab ? 'var(--accent)' : 'var(--text3)',
//                   cursor: 'pointer',
//                 }}
//               >
//                 {tab === 'email' ? <Mail size={11} /> : <Phone size={11} />}
//                 {tab}
//               </button>
//             ))}
//           </div>

//           {/* input row */}
//           <div className="flex gap-2">
//             <input
//               className="form-input flex-1"
//               type={inviteType === 'email' ? 'email' : 'tel'}
//               placeholder={inviteType === 'email' ? 'Email address…' : 'Phone number…'}
//               value={inviteValue}
//               onChange={e => setInviteVal(e.target.value)}
//               onKeyDown={e => e.key === 'Enter' && handleAdd()}
//             />
//             <select
//               className="form-input"
//               style={{ width: 100 }}
//               value={inviteRole}
//               onChange={e => setInviteRole(e.target.value as MemberRole)}
//             >
//               <option value="viewer">Viewer</option>
//               <option value="editor">Editor</option>
//               <option value="owner">Owner</option>
//             </select>
//             <Button variant="primary" onClick={handleAdd}>Add</Button>
//           </div>
//         </div>

//       </div>
//     </Modal>
//   );
// }
import { useState } from 'react';
import { Modal, Button } from '../ui';
import { useGroups } from '../../hooks/useGroups';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { X, Mail, Phone } from 'lucide-react';

type InviteType = 'email' | 'phone';
type MemberRole = 'viewer' | 'editor' | 'owner';

interface PendingMember {
  id: number;
  label: string;
  value: string;
  role: MemberRole;
  via: InviteType;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

const ICONS = ['📁', '📂', '📊', '🗂️', '🗃️', '📋', '📌', '🏷️'];

const ROLE_STYLES = {
  owner:  { bg: 'rgba(240,165,0,0.12)',  color: 'var(--gold)',  border: 'rgba(240,165,0,0.25)' },
  editor: { bg: 'rgba(27,108,168,0.15)', color: '#93c5fd',      border: 'rgba(27,108,168,0.3)' },
  viewer: { bg: 'var(--glass2)',         color: 'var(--text3)',  border: 'var(--border2)' },
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = ['#e0e7ff', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#dbeafe'];
function avatarBg(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export default function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const { createGroup } = useGroups();
  const { showToast }   = useApp();

  const [name, setName]        = useState('');
  const [description, setDesc] = useState('');
  const [icon, setIcon]        = useState('📁');

  const [inviteType, setInviteType] = useState<InviteType>('email');
  const [inviteValue, setInviteVal] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');
  const [members, setMembers]       = useState<PendingMember[]>([]);

  function handleAdd() {
    const val = inviteValue.trim();
    if (!val) return;

    const label =
      inviteType === 'email'
        ? val.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : val;

    setMembers(prev => [
      ...prev,
      { id: Date.now(), label, value: val, role: inviteRole, via: inviteType },
    ]);
    setInviteVal('');
  }

  function handleRemove(id: number) {
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  async function handleCreate() {
    if (!name.trim()) {
      showToast('Group name is required', 'error');
      return;
    }
    try {
      // 1. Create the group
      const group = await createGroup({ name, description, icon });

      // 2. Add pending members directly using supabase — avoids the stale
      //    closure bug where addMember from useGroupMembers(null) never updates
      if (members.length > 0) {
        await Promise.all(
          members.map(async m => {
            if (m.via === 'email') {
              // FIX: use .select() with .eq() — NOT upsert/on_conflict
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', m.value)
                .maybeSingle();           // maybeSingle() returns null instead of error when not found

              if (profileError) {
                console.warn(`[CreateGroup] Profile lookup error for ${m.value}:`, profileError);
                return;
              }

              if (!profile?.id) {
                console.warn(`[CreateGroup] No profile found for ${m.value}`);
                return;
              }

              const { error: memberError } = await supabase
                .from('group_members')
                .insert({ group_id: group.id, user_id: profile.id, role: m.role });

              if (memberError) {
                console.warn(`[CreateGroup] Failed to add member ${m.value}:`, memberError);
              }
            }
            // phone lookup would go here
          })
        );
      }

      showToast(`Group "${name}" created!`);
      handleClose();
    } catch (err) {
      console.error('[CreateGroupModal] handleCreate failed:', err);
      showToast('Failed to create group', 'error');
    }
  }

  function handleClose() {
    setName('');
    setDesc('');
    setIcon('📁');
    setInviteVal('');
    setInviteRole('viewer');
    setInviteType('email');
    setMembers([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new group"
      size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Create group</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>

        {/* Group name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: 'var(--text3)' }}>
            Group name
          </label>
          <input
            className="form-input w-full"
            placeholder="e.g. Marketing Team Q3"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: 'var(--text3)' }}>
            Description
          </label>
          <input
            className="form-input w-full"
            placeholder="Short description of this group's purpose"
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--text3)' }}>
            Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map(i => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                style={{
                  width: 38, height: 38, fontSize: 19,
                  borderRadius: 8,
                  border: icon === i ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: icon === i ? 'rgba(90,79,207,0.08)' : 'var(--glass2)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label={`Select icon ${i}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Pending members list */}
        {members.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {members.map(m => {
              const rs = ROLE_STYLES[m.role] || ROLE_STYLES.viewer;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{ border: '1px solid var(--border)', background: 'var(--glass2)' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: avatarBg(m.label),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, color: '#374151', flexShrink: 0,
                  }}>
                    {getInitials(m.label)}
                  </div>
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
                    {m.label}
                  </span>
                  {m.via === 'email'
                    ? <Mail size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                    : <Phone size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  }
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-xl capitalize"
                    style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                  >
                    {m.role}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => handleRemove(m.id)}
                    style={{ color: '#fc8181', flexShrink: 0 }}
                    aria-label="Remove member"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Invite section */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text3)' }}>
            Invite member
          </div>
          <div className="flex gap-1.5 mb-2">
            {(['email', 'phone'] as InviteType[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setInviteType(tab); setInviteVal(''); }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize"
                style={{
                  border: inviteType === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: inviteType === tab ? 'rgba(90,79,207,0.12)' : 'var(--glass2)',
                  color: inviteType === tab ? 'var(--accent)' : 'var(--text3)',
                  cursor: 'pointer',
                }}
              >
                {tab === 'email' ? <Mail size={11} /> : <Phone size={11} />}
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="form-input flex-1"
              type={inviteType === 'email' ? 'email' : 'tel'}
              placeholder={inviteType === 'email' ? 'Email address…' : 'Phone number…'}
              value={inviteValue}
              onChange={e => setInviteVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <select
              className="form-input"
              style={{ width: 100 }}
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as MemberRole)}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
            <Button variant="primary" onClick={handleAdd}>Add</Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}