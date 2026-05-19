// import { useState, useRef, useEffect } from 'react';
// import { FormField, Button } from '../layout/ui';
// import {
//   ChevronDown, FolderOpen, Check,
//   UserPlus, Trash2, Phone, Mail, Users, Loader2, Layers, Clock,
// } from 'lucide-react';
// import { useGroups, useGroupMembers, useSubGroups } from '../../hooks/useGroups';
// import { supabase } from '../../lib/supabase';
// import type { Group, GroupMember, SubGroup } from '../layout/ui/cons';

// const ACCENT = '#533AFD';

// // ── Types ──────────────────────────────────────────────────────────────────

// interface MetadataPanelProps {
//   files:     File[];
//   onSubmit:  (meta: {
//     projectName: string;
//     description: string;
//     tags:        string[];
//     groupId:     string | null;
//     subGroupId:  string | null;
//     folderId:    string | null;
//   }) => void;
//   uploading: boolean;
//   progress:  number;
// }

// interface Invitation {
//   id:        string;
//   email:     string;
//   full_name: string | null;
//   phone:     string | null;
//   role:      string;
// }

// // ── Helpers ────────────────────────────────────────────────────────────────

// function initials(name: string) {
//   return (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
// }

// // ── Member Form ────────────────────────────────────────────────────────────

// function MemberForm({ groupId, onSuccess, onCancel }: { groupId: string; onSuccess: () => void; onCancel: () => void }) {
//   const [form, setForm]     = useState({ full_name: '', email: '', phone: '' });
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [saving, setSaving] = useState(false);

//   function validate() {
//     const e: Record<string, string> = {};
//     if (!form.full_name.trim()) e.full_name = 'Required';
//     if (!form.email.trim()) e.email = 'Required';
//     else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
//     return e;
//   }

//   async function handleAdd() {
//     const e = validate();
//     if (Object.keys(e).length) { setErrors(e); return; }
//     setSaving(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not logged in');

//       const { data: existing } = await supabase
//         .from('profiles')
//         .select('id')
//         .ilike('email', form.email.trim())
//         .maybeSingle();

//       if (existing) {
//         const { error: memberError } = await supabase
//           .from('group_members')
//           .insert({ group_id: groupId, user_id: existing.id, role: 'viewer' } as never);
//         if (memberError) {
//           if (memberError.code === '23505') { setErrors({ submit: 'Already a member.' }); return; }
//           throw memberError;
//         }
//       } else {
//         const { error: inviteError } = await supabase
//           .from('invitations')
//           .insert({
//             group_id:   groupId,
//             email:      form.email.trim().toLowerCase(),
//             full_name:  form.full_name.trim() || null,
//             phone:      form.phone.trim()     || null,
//             role:       'viewer',
//             invited_by: user.id,
//           });
//         if (inviteError) {
//           if (inviteError.code === '23505') { setErrors({ submit: 'Already invited.' }); return; }
//           throw inviteError;
//         }
//       }

//       onSuccess();
//     } catch (err: unknown) {
//       setErrors({ submit: err instanceof Error ? err.message : 'Failed to add member' });
//     } finally {
//       setSaving(false);
//     }
//   }

//   const inputCls = (key: string) =>
//     ['w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150 placeholder-[#64748D]/70 bg-white text-[#061B31]',
//       errors[key] ? 'border-red-400' : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
//     ].join(' ');

//   return (
//     <div className="mt-3 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
//       <p className="text-xs font-semibold text-[#533AFD]">New Member</p>
//       <div>
//         <div className="relative">
//           <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className={inputCls('full_name') + ' pl-8'} />
//         </div>
//         {errors.full_name && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.full_name}</p>}
//       </div>
//       <div>
//         <div className="relative">
//           <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" type="email" className={inputCls('email') + ' pl-8'} />
//         </div>
//         {errors.email && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.email}</p>}
//       </div>
//       <div>
//         <div className="relative">
//           <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
//           <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" type="tel" className={inputCls('phone') + ' pl-8'} />
//         </div>
//       </div>
//       {errors.submit && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.submit}</p>}
//       <div className="flex gap-2 pt-1">
//         <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] disabled:opacity-50">
//           Cancel
//         </button>
//         <button type="button" onClick={handleAdd} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] disabled:opacity-60 flex items-center justify-center gap-1">
//           {saving && <Loader2 size={11} className="animate-spin" />}
//           {saving ? 'Adding…' : 'Add Member'}
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Member Card ────────────────────────────────────────────────────────────

// function MemberCard({ member, onRemove }: { member: GroupMember; onRemove: () => void }) {
//   const name  = member.profile?.full_name ?? '(Unknown)';
//   const email = member.profile?.email     ?? '—';
//   const phone = member.profile?.phone     ?? '—';
//   return (
//     <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9]">
//       <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
//         style={{ background: `${ACCENT}18`, color: ACCENT, border: `1.5px solid ${ACCENT}40` }}>
//         {initials(name)}
//       </div>
//       <div className="flex-1 min-w-0">
//         <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
//         <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate"><Mail size={10} />{email}</p>
//         <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5"><Phone size={10} />{phone}</p>
//       </div>
//       <button type="button" onClick={onRemove} className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors">
//         <Trash2 size={13} />
//       </button>
//     </div>
//   );
// }

// // ── Invitation Card ────────────────────────────────────────────────────────

// function InvitationCard({ invite, onRemove }: { invite: Invitation; onRemove: () => void }) {
//   const name = invite.full_name ?? '(No name)';
//   return (
//     <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9] border-dashed">
//       <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
//         style={{ background: '#F1F5F9', color: '#64748D', border: '1.5px dashed #D4DEE9' }}>
//         {initials(name)}
//       </div>
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-1.5">
//           <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
//           <span className="flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
//             <Clock size={9} />Pending
//           </span>
//         </div>
//         <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate"><Mail size={10} />{invite.email}</p>
//         {invite.phone && <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5"><Phone size={10} />{invite.phone}</p>}
//       </div>
//       <button type="button" onClick={onRemove} className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors">
//         <Trash2 size={13} />
//       </button>
//     </div>
//   );
// }

// // ── Group Dropdown ─────────────────────────────────────────────────────────

// function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: {
//   groups: Group[]; selectedGroupId: string | null; onSelect: (id: string | null) => void; disabled?: boolean;
// }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

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
//         className={['w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150',
//           open ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white' : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]',
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
//             <span className="text-[#64748D]/70">Select a cohort…</span>
//           )}
//         </span>
//         <ChevronDown size={14} className="text-[#64748D] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
//       </button>

//       {open && (
//         <div className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]" style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}>
//           <button
//             type="button"
//             onClick={() => { onSelect(null); setOpen(false); }}
//             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]"
//             style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}
//           >
//             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
//             <span className="flex-1 text-[#061B31]">Personal — don't share</span>
//             {!selectedGroupId && <Check size={13} className="text-[#533AFD]" />}
//           </button>
//           {groups.map((g, idx) => {
//             const isSel = selectedGroupId === g.id;
//             return (
//               <button
//                 key={g.id}
//                 type="button"
//                 onClick={() => { onSelect(g.id); setOpen(false); }}
//                 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]"
//                 style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none' }}
//               >
//                 <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
//                 <FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} />
//                 <span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span>
//                 <span className="text-xs text-[#64748D] mr-1">{g.group_members?.[0]?.count ?? 0} members</span>
//                 {isSel && <Check size={13} className="text-[#533AFD]" />}
//               </button>
//             );
//           })}
//           {groups.length === 0 && <p className="text-xs text-center text-[#64748D] py-4">No cohorts found</p>}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── SubGroup Picker ────────────────────────────────────────────────────────

// function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: {
//   groupId: string; selectedSubGroupId: string | null; onSelect: (id: string | null) => void;
// }) {
//   const { subGroups, loading } = useSubGroups(groupId);
//   if (loading || subGroups.length === 0) return null;
//   return (
//     <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
//       <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
//         <Layers size={12} className="text-[#64748D]" />
//         <span className="text-xs font-semibold text-[#64748D]">Select Team</span>
//       </div>
//       <button
//         type="button"
//         onClick={() => onSelect(null)}
//         className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]"
//         style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}
//       >
//         <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }} />
//         <Users size={12} className="text-[#64748D]" />
//         <span className="flex-1 text-[#061B31]">Entire cohort</span>
//         {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD]" />}
//       </button>
//       {subGroups.map((sg: SubGroup, idx: number) => {
//         const isSel = selectedSubGroupId === sg.id;
//         return (
//           <button key={sg.id} type="button" onClick={() => onSelect(sg.id)}
//             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]"
//             style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none' }}>
//             <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? ACCENT : '#D4DEE9' }} />
//             <Layers size={12} style={{ color: isSel ? ACCENT : '#64748D' }} />
//             <span className="flex-1 text-[#061B31] truncate">{sg.name}</span>
//             {isSel && <Check size={13} style={{ color: ACCENT }} />}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// // ── Members Section ────────────────────────────────────────────────────────

// function MembersSection({ groupId }: { groupId: string }) {
//   const { members, loading, removeMember, refetch } = useGroupMembers(groupId);
//   const [invitations, setInvitations]   = useState<Invitation[]>([]);
//   const [invLoading,  setInvLoading]    = useState(true);
//   const [showForm,    setShowForm]      = useState(false);

//   async function fetchInvitations() {
//     setInvLoading(true);
//     const { data } = await supabase
//       .from('invitations')
//       .select('id, email, full_name, phone, role')
//       .eq('group_id', groupId);
//     setInvitations((data as Invitation[]) ?? []);
//     setInvLoading(false);
//   }
//   useEffect(() => { void (async () => { await fetchInvitations(); })(); }, [groupId]);

//   async function removeInvitation(id: string) {
//     await supabase.from('invitations').delete().eq('id', id);
//     setInvitations(prev => prev.filter(i => i.id !== id));
//   }

//   const totalCount = members.length + invitations.length;

//   if (loading || invLoading) return (
//     <div className="mt-3 flex items-center justify-center py-6 rounded-lg border border-[#D4DEE9]">
//       <Loader2 size={16} className="animate-spin text-[#533AFD]" />
//       <span className="ml-2 text-xs text-[#64748D]">Loading members…</span>
//     </div>
//   );

//   return (
//     <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
//       <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
//         <div className="flex items-center gap-2">
//           <Users size={13} className="text-[#64748D]" />
//           <span className="text-xs font-semibold text-[#64748D]">Members</span>
//           {totalCount > 0 && (
//             <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${ACCENT}18`, color: ACCENT }}>
//               {totalCount}
//             </span>
//           )}
//         </div>
//         <button
//           type="button"
//           onClick={() => setShowForm(f => !f)}
//           className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium"
//           style={{ background: showForm ? `${ACCENT}15` : 'white', color: ACCENT, border: `1px solid ${ACCENT}50` }}
//         >
//           <UserPlus size={11} />{showForm ? 'Cancel' : 'Add Member'}
//         </button>
//       </div>
//       <div className="p-3 flex flex-col gap-2">
//         {totalCount === 0 && !showForm && <p className="text-xs text-center text-[#64748D] py-3">No members yet</p>}

//         {/* Real members */}
//         {members.map(m => (
//           <MemberCard key={m.id} member={m} onRemove={async () => { await removeMember(m.id); }} />
//         ))}

//         {/* Pending invitations */}
//         {invitations.map(inv => (
//           <InvitationCard key={inv.id} invite={inv} onRemove={() => removeInvitation(inv.id)} />
//         ))}

//         {showForm && (
//           <MemberForm
//             groupId={groupId}
//             onSuccess={async () => {
//               await refetch();
//               await fetchInvitations();
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

// export default function MetadataPanel({ files, onSubmit, uploading, progress }: MetadataPanelProps) {
//   const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };

//   const [projectName,        setProjectName]        = useState('');
//   const [description,        setDescription]        = useState('');
//   const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
//   const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
//   const [validationError,    setValidationError]    = useState('');

//   const hasFiles      = files.length > 0;
//   const isProjectMode = projectName.trim().length > 0;

//   function handleGroupSelect(id: string | null) {
//     setSelectedGroupId(id);
//     setSelectedSubGroupId(null);
//     setValidationError('');
//   }

//   function handleSubmit() {
//     if (!hasFiles) return;
//     if (isProjectMode && !selectedGroupId) {
//       setValidationError('Please select a cohort to create the project in.');
//       return;
//     }
//     setValidationError('');
//     onSubmit({
//       projectName,
//       description,
//       tags:       [],
//       groupId:    selectedGroupId,
//       subGroupId: selectedSubGroupId,
//       folderId:   null,
//     });
//   }

//   const buttonLabel = uploading
//     ? `Uploading… ${progress}%`
//     : isProjectMode
//       ? `📁 Create Project & Upload ${files.length} file${files.length > 1 ? 's' : ''}`
//       : `⬆ Upload ${files.length > 0 ? `${files.length} ` : ''}file${files.length !== 1 ? 's' : ''}`;

//   return (
//     <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

//       <div className="pb-4 border-b border-[#E5EDF5]">
//         <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">File Metadata</div>
//         {!hasFiles
//           ? <div className="text-sm text-[#64748D]">Fill in details below — then select your files to upload</div>
//           : <div className="text-sm font-medium" style={{ color: ACCENT }}>{files.length} file{files.length > 1 ? 's' : ''} selected — shared metadata will apply to all</div>
//         }
//       </div>

//       <FormField label="Project name">
//         <input
//           type="text"
//           placeholder="e.g. Brand refresh 2026… (creates a new folder)"
//           value={projectName}
//           onChange={e => { setProjectName(e.target.value); setValidationError(''); }}
//           className="w-full text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-2.5 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
//         />
//         {isProjectMode && <p className="text-xs mt-1" style={{ color: ACCENT }}>📁 A new top-level folder will be created in the selected cohort</p>}
//       </FormField>

//       <FormField label="Description">
//         <textarea
//           rows={3}
//           placeholder="Describe this project / files…"
//           value={description}
//           onChange={e => setDescription(e.target.value)}
//           className="w-full resize-none text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-3 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
//         />
//       </FormField>

//       <FormField label={isProjectMode ? 'Cohort (required for project)' : 'Share with Cohort'}>
//         {groupsLoading ? (
//           <div className="flex items-center gap-2 py-2">
//             <Loader2 size={14} className="animate-spin text-[#533AFD]" />
//             <span className="text-sm text-[#64748D]">Loading cohorts…</span>
//           </div>
//         ) : (
//           <>
//             <GroupDropdown groups={groups} selectedGroupId={selectedGroupId} onSelect={handleGroupSelect} />
//             {validationError && (
//               <p className="text-xs mt-1.5 text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{validationError}</p>
//             )}
//             {selectedGroupId && (
//               <>
//                 <SubGroupPicker groupId={selectedGroupId} selectedSubGroupId={selectedSubGroupId} onSelect={setSelectedSubGroupId} />
//                 <MembersSection groupId={selectedGroupId} />
//               </>
//             )}
//           </>
//         )}
//       </FormField>

//       {uploading && (
//         <div>
//           <div className="flex justify-between text-xs text-[#64748D] mb-1.5">
//             <span>Uploading…</span><span>{progress}%</span>
//           </div>
//           <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
//             <div className="h-full rounded-full transition-all duration-300 bg-[#533AFD]" style={{ width: `${progress}%` }} />
//           </div>
//         </div>
//       )}

//       <Button variant="primary" onClick={handleSubmit} disabled={!hasFiles || uploading} className="w-full justify-center">
//         {!hasFiles ? '⬆ Select files to upload' : buttonLabel}
//       </Button>
//     </div>
//   );
// }
import { useState, useRef, useEffect } from 'react';
import { FormField, Button } from '../layout/ui';
import {
  ChevronDown, FolderOpen, Check,
  UserPlus, Trash2, Phone, Mail, Users, Loader2, Layers, Clock,
} from 'lucide-react';
import { useGroups, useGroupMembers, useSubGroups } from '../../hooks/useGroups';
import { supabase } from '../../lib/supabase';
import type { Group, GroupMember, SubGroup } from '../layout/ui/cons';

const ACCENT = '#533AFD';

// ── Types ──────────────────────────────────────────────────────────────────

interface MetadataPanelProps {
  files:             File[];
  onSubmit:          (meta: {
    projectName: string;
    description: string;
    tags:        string[];
    groupId:     string | null;
    subGroupId:  string | null;
    folderId:    string | null;
  }) => void;
  uploading:         boolean;
  progress:          number;
  currentFolderId?:  string | null; // ← NEW: pre-fill when inside an existing folder
}

interface Invitation {
  id:        string;
  email:     string;
  full_name: string | null;
  phone:     string | null;
  role:      string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Member Form ────────────────────────────────────────────────────────────

function MemberForm({ groupId, onSuccess, onCancel }: { groupId: string; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm]     = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  }

  async function handleAdd() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', form.email.trim())
        .maybeSingle();

      if (existing) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: existing.id, role: 'viewer' } as never);
        if (memberError) {
          if (memberError.code === '23505') { setErrors({ submit: 'Already a member.' }); return; }
          throw memberError;
        }
      } else {
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert({
            group_id:   groupId,
            email:      form.email.trim().toLowerCase(),
            full_name:  form.full_name.trim() || null,
            phone:      form.phone.trim()     || null,
            role:       'viewer',
            invited_by: user.id,
          });
        if (inviteError) {
          if (inviteError.code === '23505') { setErrors({ submit: 'Already invited.' }); return; }
          throw inviteError;
        }
      }

      onSuccess();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to add member' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (key: string) =>
    ['w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150 placeholder-[#64748D]/70 bg-white text-[#061B31]',
      errors[key] ? 'border-red-400' : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
    ].join(' ');

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
      <p className="text-xs font-semibold text-[#533AFD]">New Member</p>
      <div>
        <div className="relative">
          <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className={inputCls('full_name') + ' pl-8'} />
        </div>
        {errors.full_name && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.full_name}</p>}
      </div>
      <div>
        <div className="relative">
          <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" type="email" className={inputCls('email') + ' pl-8'} />
        </div>
        {errors.email && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.email}</p>}
      </div>
      <div>
        <div className="relative">
          <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" type="tel" className={inputCls('phone') + ' pl-8'} />
        </div>
      </div>
      {errors.submit && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.submit}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={handleAdd} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] disabled:opacity-60 flex items-center justify-center gap-1">
          {saving && <Loader2 size={11} className="animate-spin" />}
          {saving ? 'Adding…' : 'Add Member'}
        </button>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────

function MemberCard({ member, onRemove }: { member: GroupMember; onRemove: () => void }) {
  const name  = member.profile?.full_name ?? '(Unknown)';
  const email = member.profile?.email     ?? '—';
  const phone = member.profile?.phone     ?? '—';
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9]">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: `${ACCENT}18`, color: ACCENT, border: `1.5px solid ${ACCENT}40` }}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate"><Mail size={10} />{email}</p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5"><Phone size={10} />{phone}</p>
      </div>
      <button type="button" onClick={onRemove} className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Invitation Card ────────────────────────────────────────────────────────

function InvitationCard({ invite, onRemove }: { invite: Invitation; onRemove: () => void }) {
  const name = invite.full_name ?? '(No name)';
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9] border-dashed">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: '#F1F5F9', color: '#64748D', border: '1.5px dashed #D4DEE9' }}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
            <Clock size={9} />Pending
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate"><Mail size={10} />{invite.email}</p>
        {invite.phone && <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5"><Phone size={10} />{invite.phone}</p>}
      </div>
      <button type="button" onClick={onRemove} className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Group Dropdown ─────────────────────────────────────────────────────────

function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: {
  groups: Group[]; selectedGroupId: string | null; onSelect: (id: string | null) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className={['w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150',
          open ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white' : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]',
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
            <span className="text-[#64748D]/70">Select a cohort…</span>
          )}
        </span>
        <ChevronDown size={14} className="text-[#64748D] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {open && (
        <div className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]" style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}>
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]"
            style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
            <span className="flex-1 text-[#061B31]">Personal — don't share</span>
            {!selectedGroupId && <Check size={13} className="text-[#533AFD]" />}
          </button>
          {groups.map((g, idx) => {
            const isSel = selectedGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => { onSelect(g.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]"
                style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none' }}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
                <FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} />
                <span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span>
                <span className="text-xs text-[#64748D] mr-1">{g.group_members?.[0]?.count ?? 0} members</span>
                {isSel && <Check size={13} className="text-[#533AFD]" />}
              </button>
            );
          })}
          {groups.length === 0 && <p className="text-xs text-center text-[#64748D] py-4">No cohorts found</p>}
        </div>
      )}
    </div>
  );
}

// ── SubGroup Picker ────────────────────────────────────────────────────────

function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: {
  groupId: string; selectedSubGroupId: string | null; onSelect: (id: string | null) => void;
}) {
  const { subGroups, loading } = useSubGroups(groupId);
  if (loading || subGroups.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <Layers size={12} className="text-[#64748D]" />
        <span className="text-xs font-semibold text-[#64748D]">Select Team</span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]"
        style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }} />
        <Users size={12} className="text-[#64748D]" />
        <span className="flex-1 text-[#061B31]">Entire cohort</span>
        {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD]" />}
      </button>
      {subGroups.map((sg: SubGroup, idx: number) => {
        const isSel = selectedSubGroupId === sg.id;
        return (
          <button key={sg.id} type="button" onClick={() => onSelect(sg.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]"
            style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? ACCENT : '#D4DEE9' }} />
            <Layers size={12} style={{ color: isSel ? ACCENT : '#64748D' }} />
            <span className="flex-1 text-[#061B31] truncate">{sg.name}</span>
            {isSel && <Check size={13} style={{ color: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Members Section ────────────────────────────────────────────────────────

function MembersSection({ groupId }: { groupId: string }) {
  const { members, loading, removeMember, refetch } = useGroupMembers(groupId);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invLoading,  setInvLoading]  = useState(true);
  const [showForm,    setShowForm]    = useState(false);

  async function fetchInvitations() {
    setInvLoading(true);
    const { data } = await supabase
      .from('invitations')
      .select('id, email, full_name, phone, role')
      .eq('group_id', groupId);
    setInvitations((data as Invitation[]) ?? []);
    setInvLoading(false);
  }

  useEffect(() => { void fetchInvitations(); }, [groupId]);

  async function removeInvitation(id: string) {
    await supabase.from('invitations').delete().eq('id', id);
    setInvitations(prev => prev.filter(i => i.id !== id));
  }

  const totalCount = members.length + invitations.length;

  if (loading || invLoading) return (
    <div className="mt-3 flex items-center justify-center py-6 rounded-lg border border-[#D4DEE9]">
      <Loader2 size={16} className="animate-spin text-[#533AFD]" />
      <span className="ml-2 text-xs text-[#64748D]">Loading members…</span>
    </div>
  );

  return (
    <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#64748D]" />
          <span className="text-xs font-semibold text-[#64748D]">Members</span>
          {totalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${ACCENT}18`, color: ACCENT }}>
              {totalCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium"
          style={{ background: showForm ? `${ACCENT}15` : 'white', color: ACCENT, border: `1px solid ${ACCENT}50` }}
        >
          <UserPlus size={11} />{showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {totalCount === 0 && !showForm && <p className="text-xs text-center text-[#64748D] py-3">No members yet</p>}
        {members.map(m => (
          <MemberCard key={m.id} member={m} onRemove={async () => { await removeMember(m.id); }} />
        ))}
        {invitations.map(inv => (
          <InvitationCard key={inv.id} invite={inv} onRemove={() => removeInvitation(inv.id)} />
        ))}
        {showForm && (
          <MemberForm
            groupId={groupId}
            onSuccess={async () => { await refetch(); await fetchInvitations(); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── MetadataPanel ──────────────────────────────────────────────────────────

export default function MetadataPanel({ files, onSubmit, uploading, progress, currentFolderId = null }: MetadataPanelProps) {
  const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };

const [projectName,        setProjectName]        = useState('');
const [description,        setDescription]        = useState('');
const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
const [validationError,    setValidationError]    = useState('');

// ← Derive directly from prop — no state, no useEffect needed
const folderId = currentFolderId;

  const hasFiles        = files.length > 0;
  // ← CHANGED: if already inside a folder, never treat projectName as "create new folder" mode
  const isProjectMode   = projectName.trim().length > 0 && !folderId;

  function handleGroupSelect(id: string | null) {
    setSelectedGroupId(id);
    setSelectedSubGroupId(null);
    setValidationError('');
  }

  function handleSubmit() {
    if (!hasFiles) return;
    if (isProjectMode && !selectedGroupId) {
      setValidationError('Please select a cohort to create the project in.');
      return;
    }
    setValidationError('');
    onSubmit({
      projectName,
      description,
      tags:       [],
      groupId:    selectedGroupId,
      subGroupId: selectedSubGroupId,
      folderId,   // ← CHANGED: pass the real folderId, not hardcoded null
    });
  }

  const buttonLabel = uploading
    ? `Uploading… ${progress}%`
    : isProjectMode
      ? `📁 Create Project & Upload ${files.length} file${files.length > 1 ? 's' : ''}`
      : `⬆ Upload ${files.length > 0 ? `${files.length} ` : ''}file${files.length !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

      <div className="pb-4 border-b border-[#E5EDF5]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">File Metadata</div>
        {/* ← NEW: show a banner when uploading into an existing folder */}
        {folderId ? (
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: ACCENT }}>
            <FolderOpen size={14} />
            Uploading into current folder
          </div>
        ) : !hasFiles ? (
          <div className="text-sm text-[#64748D]">Fill in details below — then select your files to upload</div>
        ) : (
          <div className="text-sm font-medium" style={{ color: ACCENT }}>{files.length} file{files.length > 1 ? 's' : ''} selected — shared metadata will apply to all</div>
        )}
      </div>

      {/* ← CHANGED: hide project name field when already inside a folder */}
      {!folderId && (
        <FormField label="Project name">
          <input
            type="text"
            placeholder="e.g. Brand refresh 2026… (creates a new folder)"
            value={projectName}
            onChange={e => { setProjectName(e.target.value); setValidationError(''); }}
            className="w-full text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-2.5 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
          />
          {isProjectMode && <p className="text-xs mt-1" style={{ color: ACCENT }}>📁 A new top-level folder will be created in the selected cohort</p>}
        </FormField>
      )}

      <FormField label="Description">
        <textarea
          rows={3}
          placeholder="Describe this project / files…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full resize-none text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-3 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
        />
      </FormField>

      <FormField label={isProjectMode ? 'Cohort (required for project)' : 'Share with Cohort'}>
        {groupsLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-[#533AFD]" />
            <span className="text-sm text-[#64748D]">Loading cohorts…</span>
          </div>
        ) : (
          <>
            <GroupDropdown groups={groups} selectedGroupId={selectedGroupId} onSelect={handleGroupSelect} />
            {validationError && (
              <p className="text-xs mt-1.5 text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{validationError}</p>
            )}
            {selectedGroupId && (
              <>
                <SubGroupPicker groupId={selectedGroupId} selectedSubGroupId={selectedSubGroupId} onSelect={setSelectedSubGroupId} />
                <MembersSection groupId={selectedGroupId} />
              </>
            )}
          </>
        )}
      </FormField>

      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-[#64748D] mb-1.5">
            <span>Uploading…</span><span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
            <div className="h-full rounded-full transition-all duration-300 bg-[#533AFD]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <Button variant="primary" onClick={handleSubmit} disabled={!hasFiles || uploading} className="w-full justify-center">
        {!hasFiles ? '⬆ Select files to upload' : buttonLabel}
      </Button>
    </div>
  );
}