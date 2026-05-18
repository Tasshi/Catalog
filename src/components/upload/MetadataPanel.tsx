// import { useState, useRef, useEffect } from 'react';
// import { FormField, Button } from '../ui';
// import {
//   X, ChevronDown, FolderOpen, Check,
//   UserPlus, Trash2, Phone, Mail, Users, Loader2, Layers, Folder,
// } from 'lucide-react';
// import { useGroups, useGroupMembers, useSubGroups } from '../../hooks/useGroups';
// import { useFolderTree } from '../../hooks/useFolderTree';
// import { supabase } from '../../lib/supabase';
// import type { Group, GroupMember, SubGroup, MetadataPanelProps } from '../ui/cons';
// import type { FolderRecord } from '../../types/folder';

// const ACCENT = '#533AFD';

// // ── Helpers ────────────────────────────────────────────────────────────────

// function initials(name: string) {
//   return (name ?? '?')
//     .split(' ')
//     .map(w => w[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);
// }

// // ── Member Form ────────────────────────────────────────────────────────────

// interface MemberFormProps {
//   groupId:   string;
//   onSuccess: () => void;
//   onCancel:  () => void;
// }

// function MemberForm({ groupId, onSuccess, onCancel }: MemberFormProps) {
//   const [form, setForm]     = useState({ full_name: '', email: '', phone: '' });
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [saving, setSaving] = useState(false);

//   function validate() {
//     const e: Record<string, string> = {};
//     if (!form.full_name.trim()) e.full_name = 'Required';
//     if (!form.email.trim())     e.email     = 'Required';
//     else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
//     return e;
//   }

//   async function handleAdd() {
//     const e = validate();
//     if (Object.keys(e).length) { setErrors(e); return; }

//     setSaving(true);
//     try {
//       const { data: profile, error: lookupError } = await supabase
//         .from('profiles')
//         .select('id')
//         .eq('email', form.email.trim())
//         .maybeSingle();

//       if (lookupError) throw lookupError;

//       if (!profile) {
//         setErrors({ submit: 'No account found with that email. The person must sign up first.' });
//         return;
//       }

//       if (form.full_name.trim() || form.phone.trim()) {
//         const updates: Record<string, string> = {};
//         if (form.full_name.trim()) updates.full_name = form.full_name.trim();
//         if (form.phone.trim())     updates.phone     = form.phone.trim();

//         await supabase
//           .from('profiles')
//           .update(updates)
//           .eq('id', profile.id)
//           .is('full_name', null);
//       }

//       const { error: memberError } = await supabase
//         .from('group_members')
//         .insert({ group_id: groupId, user_id: profile.id, role: 'viewer' } as never);

//       if (memberError) {
//         if (memberError.code === '23505') {
//           setErrors({ submit: 'This person is already a member of this group.' });
//           return;
//         }
//         throw memberError;
//       }

//       onSuccess();
//     } catch (err: unknown) {
//       const msg = err instanceof Error ? err.message : 'Failed to add member';
//       setErrors({ submit: msg });
//     } finally {
//       setSaving(false);
//     }
//   }

//   const inputCls = (key: string) => [
//     'w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150',
//     'placeholder-[#64748D]/70 bg-white text-[#061B31]',
//     errors[key]
//       ? 'border-red-400 focus:ring-2 focus:ring-red-200'
//       : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
//   ].join(' ');

//   return (
//     <div className="mt-3 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
//       <p className="text-xs font-semibold text-[#533AFD] tracking-wide">New Member</p>

//       <div>
//         <div className="relative">
//           <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input
//             value={form.full_name}
//             onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
//             placeholder="Full name"
//             className={inputCls('full_name') + ' pl-8'}
//           />
//         </div>
//         {errors.full_name && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.full_name}</p>}
//       </div>

//       <div>
//         <div className="relative">
//           <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input
//             value={form.email}
//             onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
//             placeholder="Email address (must have an account)"
//             type="email"
//             className={inputCls('email') + ' pl-8'}
//           />
//         </div>
//         {errors.email && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.email}</p>}
//       </div>

//       <div>
//         <div className="relative">
//           <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input
//             value={form.phone}
//             onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
//             placeholder="Phone number (optional)"
//             type="tel"
//             className={inputCls('phone') + ' pl-8'}
//           />
//         </div>
//       </div>

//       {errors.submit && (
//         <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
//           {errors.submit}
//         </p>
//       )}

//       <div className="flex gap-2 pt-1">
//         <button
//           type="button" onClick={onCancel} disabled={saving}
//           className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] transition-colors disabled:opacity-50"
//         >
//           Cancel
//         </button>
//         <button
//           type="button" onClick={handleAdd} disabled={saving}
//           className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
//         >
//           {saving && <Loader2 size={11} className="animate-spin" />}
//           {saving ? 'Adding…' : 'Add Member'}
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Member Card ────────────────────────────────────────────────────────────

// function MemberCard({
//   member,
//   onRemove,
// }: {
//   member:   GroupMember;
//   onRemove: () => void;
// }) {
//   const name  = member.profile?.full_name ?? '(Unknown user)';
//   const email = member.profile?.email     ?? '—';
//   const phone = member.profile?.phone     ?? '—';

//   return (
//     <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9]">
//       <div
//         className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
//         style={{ background: `${ACCENT}18`, color: ACCENT, border: `1.5px solid ${ACCENT}40` }}
//       >
//         {initials(name)}
//       </div>

//       <div className="flex-1 min-w-0">
//         <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
//         <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate">
//           <Mail size={10} className="flex-shrink-0" />{email}
//         </p>
//         <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5">
//           <Phone size={10} className="flex-shrink-0" />{phone}
//         </p>
//       </div>

//       <button
//         type="button" onClick={onRemove}
//         className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors"
//       >
//         <Trash2 size={13} />
//       </button>
//     </div>
//   );
// }

// // ── Group Dropdown ─────────────────────────────────────────────────────────

// interface GroupDropdownProps {
//   groups:          Group[];
//   selectedGroupId: string | null;
//   onSelect:        (id: string | null) => void;
//   disabled?:       boolean;
// }

// function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: GroupDropdownProps) {
//   const [open, setOpen] = useState(false);
//   const ref             = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     function h(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     }
//     document.addEventListener('mousedown', h);
//     return () => document.removeEventListener('mousedown', h);
//   }, []);

//   const selected = groups.find(g => g.id === selectedGroupId) ?? null;

//   return (
//     <div ref={ref} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
//       <button
//         type="button"
//         onClick={() => setOpen(o => !o)}
//         className={[
//           'w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150',
//           open
//             ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white'
//             : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]',
//         ].join(' ')}
//       >
//         <span className="flex items-center gap-2 text-sm min-w-0">
//           {selected ? (
//             <>
//               <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#533AFD]" />
//               <FolderOpen size={13} className="text-[#533AFD] flex-shrink-0" />
//               <span className="text-[#061B31] truncate">{selected.icon} {selected.name}</span>
//             </>
//           ) : (
//             <span className="text-[#64748D]/70">Select a project…</span>
//           )}
//         </span>
//         <ChevronDown
//           size={14}
//           className="text-[#64748D] flex-shrink-0 transition-transform duration-200"
//           style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
//         />
//       </button>

//       {open && (
//         <div
//           className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]"
//           style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}
//         >
//           <button
//             type="button"
//             onClick={() => { onSelect(null); setOpen(false); }}
//             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
//             style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}
//           >
//             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
//             <span className="flex-1 text-[#061B31]">Personal — don't share</span>
//             {!selectedGroupId && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
//           </button>

//           {groups.map((g, idx) => {
//             const isSel = selectedGroupId === g.id;
//             const count = g.group_members?.[0]?.count ?? 0;
//             return (
//               <button
//                 key={g.id}
//                 type="button"
//                 onClick={() => { onSelect(g.id); setOpen(false); }}
//                 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
//                 style={{
//                   background:   isSel ? '#F8F7FF' : 'white',
//                   borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none',
//                 }}
//               >
//                 <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
//                 <FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} />
//                 <span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span>
//                 <span className="text-xs text-[#64748D] mr-1">{count} members</span>
//                 {isSel && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
//               </button>
//             );
//           })}

//           {groups.length === 0 && (
//             <p className="text-xs text-center text-[#64748D] py-4">No projects found</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── SubGroup Picker ────────────────────────────────────────────────────────

// interface SubGroupPickerProps {
//   groupId:            string;
//   selectedSubGroupId: string | null;
//   onSelect:           (id: string | null) => void;
// }

// function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: SubGroupPickerProps) {
//   const { subGroups, loading } = useSubGroups(groupId);
//   // "settled" prevents the empty-state from flashing before the first fetch completes.
//   // useSubGroups may initialise with loading=false and an empty array, causing the
//   // empty state to render twice: once before the fetch and once after.
//   const [settled, setSettled] = useState(false);

//   useEffect(() => {
//     if (!loading) setSettled(true);
//   }, [loading]);

//   if (loading || !settled) {
//     return (
//       <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D4DEE9] bg-white">
//         <Loader2 size={13} className="animate-spin text-[#533AFD]" />
//         <span className="text-xs text-[#64748D]">Loading teams…</span>
//       </div>
//     );
//   }

//   if (subGroups.length === 0) {
//     return (
//       <div className="mt-2 px-3 py-2.5 rounded-lg border border-dashed border-[#D4DEE9] bg-[#FAFAFA]">
//         <p className="text-xs text-[#64748D] text-center">
//           No teams in this project yet
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
//         <Layers size={12} className="text-[#64748D]" />
//         <span className="text-xs font-semibold text-[#64748D]">Select Team</span>
//       </div>

//       {/* "Share with whole project" option */}
//       <button
//         type="button"
//         onClick={() => onSelect(null)}
//         className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
//         style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}
//       >
//         <div
//           className="w-2 h-2 rounded-full flex-shrink-0"
//           style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }}
//         />
//         <Users size={12} className="flex-shrink-0 text-[#64748D]" />
//         <span className="flex-1 text-[#061B31]">Entire project — all members</span>
//         {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
//       </button>

//       {/* Sub-group rows */}
//       {subGroups.map((sg: SubGroup, idx: number) => {
//         const isSel = selectedSubGroupId === sg.id;
//         return (
//           <button
//             key={sg.id}
//             type="button"
//             onClick={() => onSelect(sg.id)}
//             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
//             style={{
//               background:   isSel ? '#F8F7FF' : 'white',
//               borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none',
//             }}
//           >
//             <div
//               className="w-2 h-2 rounded-full flex-shrink-0"
//               style={{ background: isSel ? ACCENT : '#D4DEE9' }}
//             />
//             <Layers
//               size={12}
//               className="flex-shrink-0"
//               style={{ color: isSel ? ACCENT : '#64748D' }}
//             />
//             <span className="flex-1 text-[#061B31] truncate">{sg.name}</span>
//             {isSel && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// // ── Folder Picker ──────────────────────────────────────────────────────────

// function flattenTree(
//   nodes: FolderRecord[],
//   depth = 0,
// ): { id: string; name: string; depth: number }[] {
//   return nodes.flatMap(n => [
//     { id: n.id, name: n.name, depth },
//     ...flattenTree(n.children ?? [], depth + 1),
//   ]);
// }

// interface FolderPickerProps {
//   roots:      FolderRecord[];
//   loading:    boolean;
//   selectedId: string | null;
//   onSelect:   (id: string | null) => void;
// }

// function FolderPicker({ roots, loading, selectedId, onSelect }: FolderPickerProps) {
//   if (loading) {
//     return (
//       <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D4DEE9] bg-white">
//         <Loader2 size={13} className="animate-spin text-[#533AFD]" />
//         <span className="text-xs text-[#64748D]">Loading folders…</span>
//       </div>
//     );
//   }

//   const flat = flattenTree(roots);

//   if (flat.length === 0) {
//     return (
//       <div className="mt-2 px-3 py-2.5 rounded-lg border border-dashed border-[#D4DEE9] bg-[#FAFAFA]">
//         <p className="text-xs text-[#64748D] text-center">No folders in this project yet</p>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
//         <Folder size={12} className="text-[#64748D]" />
//         <span className="text-xs font-semibold text-[#64748D]">Select Folder</span>
//       </div>

//       {/* No folder option */}
//       <button
//         type="button"
//         onClick={() => onSelect(null)}
//         className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
//         style={{ background: selectedId === null ? '#F8F7FF' : 'white' }}
//       >
//         <div
//           className="w-2 h-2 rounded-full flex-shrink-0"
//           style={{ background: selectedId === null ? ACCENT : '#D4DEE9' }}
//         />
//         <FolderOpen size={12} className="flex-shrink-0 text-[#64748D]" />
//         <span className="flex-1 text-[#061B31]">Root — no folder</span>
//         {selectedId === null && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
//       </button>

//       {/* Folder rows */}
//       {flat.map((f, idx) => {
//         const isSel = selectedId === f.id;
//         return (
//           <button
//             key={f.id}
//             type="button"
//             onClick={() => onSelect(f.id)}
//             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
//             style={{
//               background:   isSel ? '#F8F7FF' : 'white',
//               borderBottom: idx < flat.length - 1 ? '1px solid #E5EDF5' : 'none',
//               paddingLeft:  `${12 + f.depth * 16}px`,
//             }}
//           >
//             <div
//               className="w-2 h-2 rounded-full flex-shrink-0"
//               style={{ background: isSel ? ACCENT : '#D4DEE9' }}
//             />
//             <Folder
//               size={12}
//               className="flex-shrink-0"
//               style={{ color: isSel ? ACCENT : '#64748D' }}
//             />
//             <span className="flex-1 text-[#061B31] truncate">📁 {f.name}</span>
//             {isSel && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// // ── Members Section ────────────────────────────────────────────────────────

// function MembersSection({ groupId }: { groupId: string }) {
//   const { members, loading, removeMember, refetch } = useGroupMembers(groupId);
//   const [showForm, setShowForm] = useState(false);

//   if (loading) {
//     return (
//       <div className="mt-3 flex items-center justify-center py-6 rounded-lg border border-[#D4DEE9]">
//         <Loader2 size={16} className="animate-spin text-[#533AFD]" />
//         <span className="ml-2 text-xs text-[#64748D]">Loading members…</span>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
//       <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
//         <div className="flex items-center gap-2">
//           <Users size={13} className="text-[#64748D]" />
//           <span className="text-xs font-semibold text-[#64748D]">Members</span>
//           {members.length > 0 && (
//             <span
//               className="px-1.5 py-0.5 rounded-full text-xs font-bold"
//               style={{ background: `${ACCENT}18`, color: ACCENT }}
//             >
//               {members.length}
//             </span>
//           )}
//         </div>
//         <button
//           type="button"
//           onClick={() => setShowForm(f => !f)}
//           className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-all"
//           style={{
//             background: showForm ? `${ACCENT}15` : 'white',
//             color:      ACCENT,
//             border:     `1px solid ${ACCENT}50`,
//           }}
//         >
//           <UserPlus size={11} />
//           {showForm ? 'Cancel' : 'Add Member'}
//         </button>
//       </div>

//       <div className="p-3 flex flex-col gap-2">
//         {members.length === 0 && !showForm && (
//           <p className="text-xs text-center text-[#64748D] py-3">
//             No members yet — click <strong>Add Member</strong> to invite someone
//           </p>
//         )}

//         {members.map(m => (
//           <MemberCard
//             key={m.id}
//             member={m}
//             onRemove={async () => { await removeMember(m.id); }}
//           />
//         ))}

//         {showForm && (
//           <MemberForm
//             groupId={groupId}
//             onSuccess={async () => {
//               await refetch();
//               setShowForm(false);
//             }}
//             onCancel={() => setShowForm(false)}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// // ── MetadataPanel ──────────────────────────────────────────────────────────

// export default function MetadataPanel({ file, onSubmit, uploading, progress }: MetadataPanelProps) {
//   const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };

//   const [description,        setDescription]        = useState('');
//   const [tags,               setTags]               = useState<string[]>([]);
//   const [tagInput,           setTagInput]           = useState('');
//   const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
//   const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
//   const [selectedFolderId,   setSelectedFolderId]   = useState<string | null>(null);

//   // ── Fetch folders whenever a group is selected ──────────────────────────
//   const {
//     roots:   folderRoots,
//     loading: foldersLoading,
//   } = useFolderTree(selectedGroupId ?? '');

//   const hasFile = !!file;

//   // Reset sub-group and folder whenever project changes
//   function handleGroupSelect(id: string | null) {
//     setSelectedGroupId(id);
//     setSelectedSubGroupId(null);
//     setSelectedFolderId(null);
//   }

//   function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
//     if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
//       e.preventDefault();
//       const tag = tagInput.trim().replace(',', '');
//       if (!tags.includes(tag)) setTags([...tags, tag]);
//       setTagInput('');
//     }
//   }

//   function removeTag(tag: string) {
//     setTags(tags.filter(t => t !== tag));
//   }

//   function handleSubmit() {
//     if (!file) return;
//     onSubmit({
//       file,
//       description,
//       tags,
//       groupId:    selectedGroupId,
//       subGroupId: selectedSubGroupId,
//       folderId:   selectedFolderId,
//     });
//   }

//   return (
//     <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

//       {/* File header */}
//       <div className="pb-4 border-b border-[#E5EDF5]">
//         <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">
//           File Metadata
//         </div>
//         {!hasFile
//           ? <div className="text-sm text-[#64748D]">Select a file to configure metadata</div>
//           : <div className="text-sm font-medium text-[#533AFD] break-all">{file.name}</div>
//         }
//       </div>

//       {/* Description */}
//       <FormField label="Description">
//         <textarea
//           rows={3}
//           placeholder="Describe this file…"
//           value={description}
//           onChange={e => setDescription(e.target.value)}
//           disabled={!hasFile}
//           className={[
//             'w-full resize-none text-sm text-[#061B31] bg-white',
//             'border border-[#D4DEE9] rounded px-4 py-3 leading-[21px]',
//             'placeholder-[#64748D]/70 outline-none',
//             'focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
//             'disabled:opacity-50 disabled:cursor-not-allowed',
//             'transition-all duration-150',
//           ].join(' ')}
//         />
//       </FormField>

//       {/* Tags */}
//       <FormField label="Tags">
//         <div className="w-full min-h-[40px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-white border border-[#D4DEE9] rounded transition-all duration-150 focus-within:border-[#533AFD] focus-within:ring-[3px] focus-within:ring-[#533AFD]/10">
//           {tags.map(t => (
//             <span
//               key={t}
//               className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#E8E9FF] text-[#533AFD] border border-[#C9C3F0]"
//             >
//               {t}
//               <button onClick={() => removeTag(t)} className="text-[#533AFD]/60 hover:text-[#533AFD] transition-colors">
//                 <X size={10} />
//               </button>
//             </span>
//           ))}
//           <input
//             className="bg-transparent border-none outline-none text-sm text-[#061B31] flex-1 min-w-[80px] placeholder-[#64748D]/70"
//             placeholder="Add tag, press Enter…"
//             value={tagInput}
//             onChange={e => setTagInput(e.target.value)}
//             onKeyDown={addTag}
//             disabled={!hasFile}
//           />
//         </div>
//       </FormField>

//       {/* Share with Project */}
//       <FormField label="Share with Project">
//         {groupsLoading ? (
//           <div className="flex items-center gap-2 py-2">
//             <Loader2 size={14} className="animate-spin text-[#533AFD]" />
//             <span className="text-sm text-[#64748D]">Loading projects…</span>
//           </div>
//         ) : (
//           <>
//             {/* Project picker */}
//             <GroupDropdown
//               groups={groups}
//               selectedGroupId={selectedGroupId}
//               onSelect={handleGroupSelect}
//               disabled={!hasFile}
//             />

//             {selectedGroupId && hasFile && (
//               <>
//                 {/* Team picker */}
//                 <SubGroupPicker
//                   groupId={selectedGroupId}
//                   selectedSubGroupId={selectedSubGroupId}
//                   onSelect={setSelectedSubGroupId}
//                 />

//                 {/* Folder picker */}
//                 <FolderPicker
//                   roots={folderRoots}
//                   loading={foldersLoading}
//                   selectedId={selectedFolderId}
//                   onSelect={setSelectedFolderId}
//                 />

//                 {/* Members list */}
//                 <MembersSection groupId={selectedGroupId} />
//               </>
//             )}
//           </>
//         )}
//       </FormField>

//       {/* Upload progress */}
//       {uploading && (
//         <div>
//           <div className="flex justify-between text-xs text-[#64748D] mb-1.5">
//             <span>Uploading…</span>
//             <span>{progress}%</span>
//           </div>
//           <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
//             <div
//               className="h-full rounded-full transition-all duration-300 bg-[#533AFD]"
//               style={{ width: `${progress}%` }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Submit */}
//       <Button
//         variant="primary"
//         onClick={handleSubmit}
//         disabled={!hasFile || uploading}
//         className="w-full justify-center"
//       >
//         {uploading ? `Uploading… ${progress}%` : '⬆ Upload File'}
//       </Button>
//     </div>
//   );
// }
import { useState, useRef, useEffect } from 'react';
import { FormField, Button } from '../ui';
import {
  X, ChevronDown, FolderOpen, Check,
  UserPlus, Trash2, Phone, Mail, Users, Loader2, Layers, Folder,
} from 'lucide-react';
import { useGroups, useGroupMembers, useSubGroups } from '../../hooks/useGroups';
import { useFolderTree } from '../../hooks/useFolderTree';
import { supabase } from '../../lib/supabase';
import type { Group, GroupMember, SubGroup, MetadataPanelProps } from '../ui/cons';
import type { FolderRecord } from '../../types/folder';

const ACCENT = '#533AFD';

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Member Form ────────────────────────────────────────────────────────────

interface MemberFormProps {
  groupId:   string;
  onSuccess: () => void;
  onCancel:  () => void;
}

function MemberForm({ groupId, onSuccess, onCancel }: MemberFormProps) {
  const [form, setForm]     = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  }

  async function handleAdd() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email.trim())
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (!profile) {
        setErrors({ submit: 'No account found with that email. The person must sign up first.' });
        return;
      }

      if (form.full_name.trim() || form.phone.trim()) {
        const updates: Record<string, string> = {};
        if (form.full_name.trim()) updates.full_name = form.full_name.trim();
        if (form.phone.trim())     updates.phone     = form.phone.trim();

        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id)
          .is('full_name', null);
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: profile.id, role: 'viewer' } as never);

      if (memberError) {
        if (memberError.code === '23505') {
          setErrors({ submit: 'This person is already a member of this group.' });
          return;
        }
        throw memberError;
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add member';
      setErrors({ submit: msg });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (key: string) => [
    'w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150',
    'placeholder-[#64748D]/70 bg-white text-[#061B31]',
    errors[key]
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
  ].join(' ');

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
      <p className="text-xs font-semibold text-[#533AFD] tracking-wide">New Member</p>

      <div>
        <div className="relative">
          <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Full name"
            className={inputCls('full_name') + ' pl-8'}
          />
        </div>
        {errors.full_name && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.full_name}</p>}
      </div>

      <div>
        <div className="relative">
          <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email address (must have an account)"
            type="email"
            className={inputCls('email') + ' pl-8'}
          />
        </div>
        {errors.email && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.email}</p>}
      </div>

      <div>
        <div className="relative">
          <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Phone number (optional)"
            type="tel"
            className={inputCls('phone') + ' pl-8'}
          />
        </div>
      </div>

      {errors.submit && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
          {errors.submit}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button" onClick={onCancel} disabled={saving}
          className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button" onClick={handleAdd} disabled={saving}
          className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {saving && <Loader2 size={11} className="animate-spin" />}
          {saving ? 'Adding…' : 'Add Member'}
        </button>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onRemove,
}: {
  member:   GroupMember;
  onRemove: () => void;
}) {
  const name  = member.profile?.full_name ?? '(Unknown user)';
  const email = member.profile?.email     ?? '—';
  const phone = member.profile?.phone     ?? '—';

  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9]">
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: `${ACCENT}18`, color: ACCENT, border: `1.5px solid ${ACCENT}40` }}
      >
        {initials(name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate">
          <Mail size={10} className="flex-shrink-0" />{email}
        </p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5">
          <Phone size={10} className="flex-shrink-0" />{phone}
        </p>
      </div>

      <button
        type="button" onClick={onRemove}
        className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Group Dropdown ─────────────────────────────────────────────────────────

interface GroupDropdownProps {
  groups:          Group[];
  selectedGroupId: string | null;
  onSelect:        (id: string | null) => void;
  disabled?:       boolean;
}

function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: GroupDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = groups.find(g => g.id === selectedGroupId) ?? null;

  return (
    <div ref={ref} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          'w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150',
          open
            ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white'
            : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 text-sm min-w-0">
          {selected ? (
            <>
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#533AFD]" />
              <FolderOpen size={13} className="text-[#533AFD] flex-shrink-0" />
              <span className="text-[#061B31] truncate">{selected.icon} {selected.name}</span>
            </>
          ) : (
            <span className="text-[#64748D]/70">Select a project…</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className="text-[#64748D] flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]"
          style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}
        >
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
            style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
            <span className="flex-1 text-[#061B31]">Personal — don't share</span>
            {!selectedGroupId && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
          </button>

          {groups.map((g, idx) => {
            const isSel = selectedGroupId === g.id;
            const count = g.group_members?.[0]?.count ?? 0;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => { onSelect(g.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
                style={{
                  background:   isSel ? '#F8F7FF' : 'white',
                  borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none',
                }}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
                <FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} />
                <span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span>
                <span className="text-xs text-[#64748D] mr-1">{count} members</span>
                {isSel && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
              </button>
            );
          })}

          {groups.length === 0 && (
            <p className="text-xs text-center text-[#64748D] py-4">No projects found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── SubGroup Picker ────────────────────────────────────────────────────────

interface SubGroupPickerProps {
  groupId:            string;
  selectedSubGroupId: string | null;
  onSelect:           (id: string | null) => void;
}

function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: SubGroupPickerProps) {
  const { subGroups, loading } = useSubGroups(groupId);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!loading) setSettled(true);
  }, [loading]);

  if (loading || !settled) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D4DEE9] bg-white">
        <Loader2 size={13} className="animate-spin text-[#533AFD]" />
        <span className="text-xs text-[#64748D]">Loading teams…</span>
      </div>
    );
  }

  if (subGroups.length === 0) {
    return (
      <div className="mt-2 px-3 py-2.5 rounded-lg border border-dashed border-[#D4DEE9] bg-[#FAFAFA]">
        <p className="text-xs text-[#64748D] text-center">
          No teams in this project yet
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <Layers size={12} className="text-[#64748D]" />
        <span className="text-xs font-semibold text-[#64748D]">Select Team</span>
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
        style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }}
        />
        <Users size={12} className="flex-shrink-0 text-[#64748D]" />
        <span className="flex-1 text-[#061B31]">Entire project — all members</span>
        {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
      </button>

      {subGroups.map((sg: SubGroup, idx: number) => {
        const isSel = selectedSubGroupId === sg.id;
        return (
          <button
            key={sg.id}
            type="button"
            onClick={() => onSelect(sg.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
            style={{
              background:   isSel ? '#F8F7FF' : 'white',
              borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none',
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isSel ? ACCENT : '#D4DEE9' }}
            />
            <Layers
              size={12}
              className="flex-shrink-0"
              style={{ color: isSel ? ACCENT : '#64748D' }}
            />
            <span className="flex-1 text-[#061B31] truncate">{sg.name}</span>
            {isSel && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Folder Picker ──────────────────────────────────────────────────────────

function flattenTree(
  nodes: FolderRecord[],
  depth = 0,
): { id: string; name: string; depth: number }[] {
  return nodes.flatMap(n => [
    { id: n.id, name: n.name, depth },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

interface FolderPickerProps {
  roots:      FolderRecord[];
  loading:    boolean;
  selectedId: string | null;
  onSelect:   (id: string | null) => void;
}

function FolderPicker({ roots, loading, selectedId, onSelect }: FolderPickerProps) {
  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D4DEE9] bg-white">
        <Loader2 size={13} className="animate-spin text-[#533AFD]" />
        <span className="text-xs text-[#64748D]">Loading folders…</span>
      </div>
    );
  }

  const flat = flattenTree(roots);

  if (flat.length === 0) {
    return (
      <div className="mt-2 px-3 py-2.5 rounded-lg border border-dashed border-[#D4DEE9] bg-[#FAFAFA]">
        <p className="text-xs text-[#64748D] text-center">No folders in this project yet</p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <Folder size={12} className="text-[#64748D]" />
        <span className="text-xs font-semibold text-[#64748D]">Select Folder</span>
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] transition-colors hover:bg-[#F8F7FF]"
        style={{ background: selectedId === null ? '#F8F7FF' : 'white' }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: selectedId === null ? ACCENT : '#D4DEE9' }}
        />
        <FolderOpen size={12} className="flex-shrink-0 text-[#64748D]" />
        <span className="flex-1 text-[#061B31]">Root — no folder</span>
        {selectedId === null && <Check size={13} className="text-[#533AFD] flex-shrink-0" />}
      </button>

      {flat.map((f, idx) => {
        const isSel = selectedId === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[#F8F7FF]"
            style={{
              background:   isSel ? '#F8F7FF' : 'white',
              borderBottom: idx < flat.length - 1 ? '1px solid #E5EDF5' : 'none',
              paddingLeft:  `${12 + f.depth * 16}px`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isSel ? ACCENT : '#D4DEE9' }}
            />
            <Folder
              size={12}
              className="flex-shrink-0"
              style={{ color: isSel ? ACCENT : '#64748D' }}
            />
            <span className="flex-1 text-[#061B31] truncate">📁 {f.name}</span>
            {isSel && <Check size={13} style={{ color: ACCENT, flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Members Section ────────────────────────────────────────────────────────

function MembersSection({ groupId }: { groupId: string }) {
  const { members, loading, removeMember, refetch } = useGroupMembers(groupId);
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="mt-3 flex items-center justify-center py-6 rounded-lg border border-[#D4DEE9]">
        <Loader2 size={16} className="animate-spin text-[#533AFD]" />
        <span className="ml-2 text-xs text-[#64748D]">Loading members…</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#64748D]" />
          <span className="text-xs font-semibold text-[#64748D]">Members</span>
          {members.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: `${ACCENT}18`, color: ACCENT }}
            >
              {members.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-all"
          style={{
            background: showForm ? `${ACCENT}15` : 'white',
            color:      ACCENT,
            border:     `1px solid ${ACCENT}50`,
          }}
        >
          <UserPlus size={11} />
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {members.length === 0 && !showForm && (
          <p className="text-xs text-center text-[#64748D] py-3">
            No members yet — click <strong>Add Member</strong> to invite someone
          </p>
        )}

        {members.map(m => (
          <MemberCard
            key={m.id}
            member={m}
            onRemove={async () => { await removeMember(m.id); }}
          />
        ))}

        {showForm && (
          <MemberForm
            groupId={groupId}
            onSuccess={async () => {
              await refetch();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── MetadataPanel ──────────────────────────────────────────────────────────

export default function MetadataPanel({ file, onSubmit, uploading, progress }: MetadataPanelProps) {
  const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };

  const [projectName,        setProjectName]        = useState('');         // ← NEW
  const [description,        setDescription]        = useState('');
  const [tags,               setTags]               = useState<string[]>([]);
  const [tagInput,           setTagInput]           = useState('');
  const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
  const [selectedFolderId,   setSelectedFolderId]   = useState<string | null>(null);

  const {
    roots:   folderRoots,
    loading: foldersLoading,
  } = useFolderTree(selectedGroupId ?? '');

  const hasFile = !!file;

  function handleGroupSelect(id: string | null) {
    setSelectedGroupId(id);
    setSelectedSubGroupId(null);
    setSelectedFolderId(null);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(',', '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  function handleSubmit() {
    if (!file) return;
    onSubmit({
      file,
      projectName,                  // ← NEW
      description,
      tags,
      groupId:    selectedGroupId,
      subGroupId: selectedSubGroupId,
      folderId:   selectedFolderId,
    });
  }

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

      {/* File header */}
      <div className="pb-4 border-b border-[#E5EDF5]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">
          File Metadata
        </div>
        {!hasFile
          ? <div className="text-sm text-[#64748D]">Select a file to configure metadata</div>
          : <div className="text-sm font-medium text-[#533AFD] break-all">{file.name}</div>
        }
      </div>

      {/* ── Project name (NEW) ─────────────────────────────────────────── */}
      <FormField label="Project name">
        <input
          type="text"
          placeholder="e.g. Brand refresh 2026…"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          disabled={!hasFile}
          className={[
            'w-full text-sm text-[#061B31] bg-white',
            'border border-[#D4DEE9] rounded px-4 py-2.5 leading-[21px]',
            'placeholder-[#64748D]/70 outline-none',
            'focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
          ].join(' ')}
        />
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          rows={3}
          placeholder="Describe this file…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={!hasFile}
          className={[
            'w-full resize-none text-sm text-[#061B31] bg-white',
            'border border-[#D4DEE9] rounded px-4 py-3 leading-[21px]',
            'placeholder-[#64748D]/70 outline-none',
            'focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
          ].join(' ')}
        />
      </FormField>

      {/* Tags */}
      <FormField label="Tags">
        <div className="w-full min-h-[40px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-white border border-[#D4DEE9] rounded transition-all duration-150 focus-within:border-[#533AFD] focus-within:ring-[3px] focus-within:ring-[#533AFD]/10">
          {tags.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#E8E9FF] text-[#533AFD] border border-[#C9C3F0]"
            >
              {t}
              <button onClick={() => removeTag(t)} className="text-[#533AFD]/60 hover:text-[#533AFD] transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            className="bg-transparent border-none outline-none text-sm text-[#061B31] flex-1 min-w-[80px] placeholder-[#64748D]/70"
            placeholder="Add tag, press Enter…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            disabled={!hasFile}
          />
        </div>
      </FormField>

      {/* Share with Project */}
      <FormField label="Share with Project">
        {groupsLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-[#533AFD]" />
            <span className="text-sm text-[#64748D]">Loading projects…</span>
          </div>
        ) : (
          <>
            <GroupDropdown
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelect={handleGroupSelect}
              disabled={!hasFile}
            />

            {selectedGroupId && hasFile && (
              <>
                <SubGroupPicker
                  groupId={selectedGroupId}
                  selectedSubGroupId={selectedSubGroupId}
                  onSelect={setSelectedSubGroupId}
                />

                <FolderPicker
                  roots={folderRoots}
                  loading={foldersLoading}
                  selectedId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                />

                <MembersSection groupId={selectedGroupId} />
              </>
            )}
          </>
        )}
      </FormField>

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-[#64748D] mb-1.5">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#533AFD]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!hasFile || uploading}
        className="w-full justify-center"
      >
        {uploading ? `Uploading… ${progress}%` : '⬆ Upload File'}
      </Button>
    </div>
  );
}