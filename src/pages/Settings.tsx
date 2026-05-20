// // import Layout from '../components/layout/Layout';
// // import Header from '../components/layout/Header';
// // import { useAuth } from '../contexts/AuthContext';
// // import { useState, useRef, useEffect } from 'react';
// // import { supabase } from '../lib/supabase';
// // import { useApp } from '../contexts/AppContext';
// // import { Button, FormField } from '../components/layout/ui';
// // import { Avatar } from '../components/layout/ui';

// // // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // const db = supabase as any;

// // interface GroupOption { id: string; name: string; icon: string | null; }

// // export default function Settings() {
// //   const { profile, user, refreshProfile } = useAuth();
// //   const { showToast } = useApp();
// //   const [name, setName]           = useState(profile?.full_name || '');
// //   const [cohort, setCohort]       = useState<string>(profile?.cohort || '');
// //   const [groups, setGroups]       = useState<GroupOption[]>([]);
// //   const [saving, setSaving]       = useState(false);
// //   const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
// //   const [uploading, setUploading] = useState(false);
// //   const avatarInputRef = useRef<HTMLInputElement>(null);

// //   // ── Load groups for the cohort dropdown ───────────────────────────────────
// //   useEffect(() => {
// //     db.from('groups').select('id, name, icon').order('name')
// //       .then(({ data }: { data: GroupOption[] | null }) => {
// //         if (data) setGroups(data);
// //       });
// //   }, []);

// //   // ── Keep local state in sync if profile loads after mount ─────────────────
// //   useEffect(() => {
// //     if (profile) {
// //       setName(profile.full_name || '');
// //       setCohort(profile.cohort || '');
// //       setAvatarUrl(profile.avatar_url || null);
// //     }
// //   }, [profile]);

// //   // ── Avatar upload ─────────────────────────────────────────────────────────
// //   async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
// //     const file = e.target.files?.[0];
// //     if (!file || !user) return;

// //     setUploading(true);
// //     try {
// //       const ext  = file.name.split('.').pop() ?? 'png';
// //       const path = `avatars/${user.id}.${ext}`;

// //       const { error: uploadError } = await (supabase as any).storage
// //         .from('filevault')
// //         .upload(path, file, { upsert: true, cacheControl: '3600' });

// //       if (uploadError) throw uploadError;

// //       const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
// //       const publicUrl = data.publicUrl as string;

// //       const { error: updateError } = await db
// //         .from('profiles')
// //         .update({ avatar_url: publicUrl })
// //         .eq('id', user.id);

// //       if (updateError) throw updateError;

// //       setAvatarUrl(publicUrl);
// //       await refreshProfile(); // ✅ sync context
// //       showToast('Avatar updated!');
// //     } catch (err) {
// //       console.error(err);
// //       showToast('Avatar upload failed', 'error');
// //     } finally {
// //       setUploading(false);
// //       e.target.value = '';
// //     }
// //   }

// //   // ── Profile save ──────────────────────────────────────────────────────────
// //   async function handleSave() {
// //     if (!user) return;
// //     setSaving(true);
// //     try {
// //       const { error } = await db
// //         .from('profiles')
// //         .update({
// //           full_name: name       || null,
// //           cohort:    cohort     || null,  // ✅ saves the group name as-is (e.g. "Cohort 1")
// //         })
// //         .eq('id', user.id);

// //       if (error) throw error;

// //       await refreshProfile(); // ✅ re-fetches profile into AuthContext so UI reflects changes
// //       showToast('Profile updated!');
// //     } catch (err) {
// //       console.error('[Settings] save failed', err);
// //       showToast('Save failed', 'error');
// //     } finally {
// //       setSaving(false);
// //     }
// //   }

// //   return (
// //     <Layout>
// //       <Header title="Settings" />
// //       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
// //         <div className="max-w-lg">

// //           {/* ── Profile card ── */}
// //           <div className="card mb-4">
// //             <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>
// //               Profile
// //             </div>

// //             {/* Avatar row */}
// //             <div className="flex items-center gap-4 mb-5">
// //               <div style={{ position: 'relative', flexShrink: 0 }}>
// //                 <div
// //                   onClick={() => avatarInputRef.current?.click()}
// //                   style={{ cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 52, height: 52, position: 'relative' }}
// //                   title="Click to change avatar"
// //                 >
// //                   {avatarUrl ? (
// //                     <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
// //                   ) : (
// //                     <Avatar name={name || 'User'} size="lg" />
// //                   )}
// //                   <div
// //                     className="avatar-overlay"
// //                     style={{
// //                       position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
// //                       display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                       borderRadius: '50%', opacity: uploading ? 1 : 0,
// //                       transition: 'opacity 0.15s',
// //                     }}
// //                   >
// //                     {uploading
// //                       ? <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>…</span>
// //                       : <span style={{ fontSize: 14 }}>📷</span>
// //                     }
// //                   </div>
// //                 </div>

// //                 <input
// //                   ref={avatarInputRef}
// //                   type="file"
// //                   accept="image/*"
// //                   style={{ display: 'none' }}
// //                   onChange={handleAvatarChange}
// //                 />

// //                 <button
// //                   onClick={() => avatarInputRef.current?.click()}
// //                   disabled={uploading}
// //                   title="Upload photo"
// //                   style={{
// //                     position: 'absolute', bottom: 0, right: -2,
// //                     width: 20, height: 20, borderRadius: '50%',
// //                     background: '#6366f1', border: '2px solid #fff',
// //                     display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                     cursor: 'pointer', padding: 0, fontSize: 10, color: '#fff', lineHeight: 1,
// //                   }}
// //                 >
// //                   {uploading ? '…' : '✎'}
// //                 </button>
// //               </div>

// //               <div>
// //                 <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
// //                   {name || 'No name'}
// //                 </div>
// //                 <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
// //                   {user?.email}
// //                 </div>
// //                 <button
// //                   onClick={() => avatarInputRef.current?.click()}
// //                   disabled={uploading}
// //                   style={{ marginTop: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
// //                 >
// //                   {uploading ? 'Uploading…' : 'Change photo'}
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Full Name */}
// //             <FormField label="Full Name">
// //               <input
// //                 className="form-input"
// //                 value={name}
// //                 onChange={e => setName(e.target.value)}
// //                 placeholder="Enter your full name"
// //               />
// //             </FormField>

// //             {/* ── Group / Cohort dropdown ── */}
// //             <div className="mt-3">
// //               <FormField label="Group">
// //                 <select
// //                   value={cohort}
// //                   onChange={e => setCohort(e.target.value)}
// //                   style={{
// //                     width: '100%',
// //                     height: 38,
// //                     paddingLeft: 10,
// //                     paddingRight: 32,
// //                     borderRadius: 8,
// //                     border: '1.5px solid #e2e8f0',
// //                     fontSize: 13,
// //                     color: cohort ? '#1e293b' : '#94a3b8',
// //                     background: '#fff',
// //                     outline: 'none',
// //                     appearance: 'none',
// //                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
// //                     backgroundRepeat: 'no-repeat',
// //                     backgroundPosition: 'right 10px center',
// //                     cursor: 'pointer',
// //                     transition: 'border-color 0.15s',
// //                   }}
// //                   onFocus={e => (e.target.style.borderColor = '#6366f1')}
// //                   onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
// //                 >
// //                   <option value="">— Select a group —</option>
// //                   {groups.map(g => (
// //                     <option key={g.id} value={g.name}>
// //                       {g.icon ? `${g.icon} ${g.name}` : g.name}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </FormField>

// //               {cohort && (
// //                 <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
// //                   Currently in: <strong style={{ color: '#6366f1' }}>{cohort}</strong>
// //                   <button
// //                     onClick={() => setCohort('')}
// //                     style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
// //                   >
// //                     ✕ clear
// //                   </button>
// //                 </p>
// //               )}
// //             </div>

// //             <div className="mt-4">
// //               <Button variant="primary" onClick={handleSave} disabled={saving}>
// //                 {saving ? 'Saving…' : 'Save Changes'}
// //               </Button>
// //             </div>
// //           </div>

// //           {/* ── Account card ── */}
// //           <div className="card">
// //             <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
// //               Account
// //             </div>
// //             <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
// //             <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
// //           </div>

// //         </div>
// //       </div>

// //       <style>{`
// //         div:hover > .avatar-overlay { opacity: 1 !important; }
// //       `}</style>
// //     </Layout>
// //   );
// // }
// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import { useAuth } from '../contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { useApp } from '../contexts/AppContext';
// import { Button, FormField } from '../components/layout/ui';
// import { Avatar } from '../components/layout/ui';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// interface GroupOption { id: string; name: string; icon: string | null; }

// export default function Settings() {
//   const { user, refreshProfile } = useAuth();
//   const { showToast } = useApp();

//   const [name,            setName]            = useState('');
//   const [cohort,          setCohort]          = useState('');
//   const [selectedGroupId, setSelectedGroupId] = useState('');
//   const [groups,          setGroups]          = useState<GroupOption[]>([]);
//   const [saving,          setSaving]          = useState(false);
//   const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
//   const [uploading,       setUploading]       = useState(false);
//   const [ready,           setReady]           = useState(false); // prevents flash of empty
//   const avatarInputRef = useRef<HTMLInputElement>(null);

//   // ── Single init: fetch everything fresh from DB on every mount/reload ────
//   // Uses getSession() directly — never depends on user state which is
//   // undefined on first render after a browser reload.
//   useEffect(() => {
//     let cancelled = false;

//     async function init() {
//       // Poll for session up to 3s — Supabase restores it from localStorage
//       // but it takes a tick after reload
//       let uid: string | undefined;
//       for (let i = 0; i < 10; i++) {
//         const { data: { session } } = await supabase.auth.getSession();
//         uid = session?.user?.id;
//         if (uid) break;
//         await new Promise(r => setTimeout(r, 300));
//       }
//       if (!uid || cancelled) return;

//       const [{ data: groupData }, { data: profileData }] = await Promise.all([
//         db.from('groups').select('id, name, icon').order('name'),
//         db.from('profiles').select('*').eq('id', uid).maybeSingle(),
//       ]);

//       if (cancelled) return;

//       if (groupData)   setGroups(groupData);
//       if (profileData) {
//         setName(profileData.full_name ?? '');
//         setCohort(profileData.cohort ?? '');
//         setAvatarUrl(profileData.avatar_url ?? null);

//         if (profileData.cohort && groupData) {
//           const match = groupData.find((g: GroupOption) => g.name === profileData.cohort);
//           setSelectedGroupId(match?.id ?? '');
//         }
//       }

//       setReady(true);
//     }

//     void init();
//     return () => { cancelled = true; };
//   }, []); // run once on mount — session polling handles the reload case

//   // ── When user picks a group from dropdown ─────────────────────────────────
//   function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
//     const groupName = e.target.value;
//     setCohort(groupName);
//     const match = groups.find(g => g.name === groupName);
//     setSelectedGroupId(match?.id ?? '');
//   }

//   // ── Avatar upload ─────────────────────────────────────────────────────────
//   async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file || !user) return;
//     setUploading(true);
//     try {
//       const ext  = file.name.split('.').pop() ?? 'png';
//       const path = `avatars/${user.id}.${ext}`;

//       const { error: uploadError } = await (supabase as any).storage
//         .from('filevault')
//         .upload(path, file, { upsert: true, cacheControl: '3600' });
//       if (uploadError) throw uploadError;

//       const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
//       const publicUrl = data.publicUrl as string;

//       const { error: updateError } = await db
//         .from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
//       if (updateError) throw updateError;

//       setAvatarUrl(publicUrl);
//       await refreshProfile();
//       showToast('Avatar updated!');
//     } catch (err) {
//       console.error(err);
//       showToast('Avatar upload failed', 'error');
//     } finally {
//       setUploading(false);
//       e.target.value = '';
//     }
//   }

//   // ── Profile save ──────────────────────────────────────────────────────────
//   async function handleSave() {
//     const { data: { session } } = await supabase.auth.getSession();
//     const uid = session?.user?.id ?? user?.id;
//     if (!uid) return;

//     setSaving(true);
//     try {
//       // 1. Save profile
//       const { error: profileError } = await db
//         .from('profiles')
//         .update({ full_name: name || null, cohort: cohort || null })
//         .eq('id', uid);
//       if (profileError) throw profileError;

//       // 2. Sync group_members — remove old, insert new
//       await db.from('group_members').delete().eq('user_id', uid);
//       if (selectedGroupId) {
//         const { error: memberError } = await db
//           .from('group_members')
//           .insert({ group_id: selectedGroupId, user_id: uid, role: 'member' });
//         if (memberError && memberError.code !== '23505') throw memberError;
//       }

//       await refreshProfile();
//       showToast('Profile updated!');
//     } catch (err) {
//       console.error('[Settings] save failed', err);
//       showToast('Save failed', 'error');
//     } finally {
//       setSaving(false);
//     }
//   }

//   // ── Show loading skeleton until DB data is ready ──────────────────────────
//   if (!ready) {
//     return (
//       <Layout>
//         <Header title="Settings" />
//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="max-w-lg">
//             <div className="card mb-4" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <span style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</span>
//             </div>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <Header title="Settings" />
//       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
//         <div className="max-w-lg">

//           {/* ── Profile card ── */}
//           <div className="card mb-4">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>
//               Profile
//             </div>

//             {/* Avatar row */}
//             <div className="flex items-center gap-4 mb-5">
//               <div style={{ position: 'relative', flexShrink: 0 }}>
//                 <div
//                   onClick={() => avatarInputRef.current?.click()}
//                   style={{ cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 52, height: 52, position: 'relative' }}
//                   title="Click to change avatar"
//                 >
//                   {avatarUrl ? (
//                     <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                   ) : (
//                     <Avatar name={name || 'User'} size="lg" />
//                   )}
//                   <div
//                     className="avatar-overlay"
//                     style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }}
//                   >
//                     {uploading
//                       ? <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>…</span>
//                       : <span style={{ fontSize: 14 }}>📷</span>}
//                   </div>
//                 </div>
//                 <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   disabled={uploading}
//                   title="Upload photo"
//                   style={{ position: 'absolute', bottom: 0, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#6366f1', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, fontSize: 10, color: '#fff', lineHeight: 1 }}
//                 >
//                   {uploading ? '…' : '✎'}
//                 </button>
//               </div>

//               <div>
//                 <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name || 'No name'}</div>
//                 <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   disabled={uploading}
//                   style={{ marginTop: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
//                 >
//                   {uploading ? 'Uploading…' : 'Change photo'}
//                 </button>
//               </div>
//             </div>

//             {/* Full Name */}
//             <FormField label="Full Name">
//               <input
//                 className="form-input"
//                 value={name}
//                 onChange={e => setName(e.target.value)}
//                 placeholder="Enter your full name"
//               />
//             </FormField>

//             {/* Group / Cohort dropdown */}
//             <div className="mt-3">
//               <FormField label="Group">
//                 <select
//                   value={cohort}
//                   onChange={handleGroupChange}
//                   style={{
//                     width: '100%', height: 38, paddingLeft: 10, paddingRight: 32,
//                     borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13,
//                     color: cohort ? '#1e293b' : '#94a3b8', background: '#fff',
//                     outline: 'none', appearance: 'none',
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
//                     backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
//                     cursor: 'pointer', transition: 'border-color 0.15s',
//                   }}
//                   onFocus={e => (e.target.style.borderColor = '#6366f1')}
//                   onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
//                 >
//                   <option value="">— Select a group —</option>
//                   {groups.map(g => (
//                     <option key={g.id} value={g.name}>
//                       {g.icon ? `${g.icon} ${g.name}` : g.name}
//                     </option>
//                   ))}
//                 </select>
//               </FormField>

//               {cohort && (
//                 <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
//                   Currently in: <strong style={{ color: '#6366f1' }}>{cohort}</strong>
//                   <button
//                     onClick={() => { setCohort(''); setSelectedGroupId(''); }}
//                     style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
//                   >
//                     ✕ clear
//                   </button>
//                 </p>
//               )}
//             </div>

//             <div className="mt-4">
//               <Button variant="primary" onClick={handleSave} disabled={saving}>
//                 {saving ? 'Saving…' : 'Save Changes'}
//               </Button>
//             </div>
//           </div>

//           {/* ── Account card ── */}
//           <div className="card">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
//               Account
//             </div>
//             <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
//             <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//           </div>

//         </div>
//       </div>

//       <style>{`
//         div:hover > .avatar-overlay { opacity: 1 !important; }
//       `}</style>
//     </Layout>
//   );
// }

// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import { useAuth } from '../contexts/AuthContext';
// import { useState, useRef, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { useApp } from '../contexts/AppContext';
// import { Button, FormField } from '../components/layout/ui';
// import { Avatar } from '../components/layout/ui';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// interface GroupOption { id: string; name: string; icon: string | null; }

// export default function Settings() {
//   const { user, refreshProfile } = useAuth();
//   const { showToast } = useApp();

//   const [name,            setName]            = useState('');
//   const [cohort,          setCohort]          = useState('');
//   const [selectedGroupId, setSelectedGroupId] = useState('');
//   const [groups,          setGroups]          = useState<GroupOption[]>([]);
//   const [saving,          setSaving]          = useState(false);
//   const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
//   const [uploading,       setUploading]       = useState(false);
//   const [ready,           setReady]           = useState(false); // prevents flash of empty
//   const avatarInputRef = useRef<HTMLInputElement>(null);

//   // ── Single init: fetch everything fresh from DB on every mount/reload ────
//   // Uses getSession() directly — never depends on user state which is
//   // undefined on first render after a browser reload.
//   useEffect(() => {
//     let cancelled = false;

//     async function init() {
//       // Poll for session up to 3s — Supabase restores it from localStorage
//       // but it takes a tick after reload
//       let uid: string | undefined;
//       for (let i = 0; i < 10; i++) {
//         const { data: { session } } = await supabase.auth.getSession();
//         uid = session?.user?.id;
//         if (uid) break;
//         await new Promise(r => setTimeout(r, 300));
//       }
//       if (!uid || cancelled) return;

//       const [{ data: groupData }, { data: profileData }] = await Promise.all([
//         db.from('groups').select('id, name, icon').order('name'),
//         db.from('profiles').select('*').eq('id', uid).maybeSingle(),
//       ]);

//       if (cancelled) return;

//       if (groupData)   setGroups(groupData);
//       if (profileData) {
//         setName(profileData.full_name ?? '');
//         setCohort(profileData.cohort ?? '');
//         setAvatarUrl(profileData.avatar_url ?? null);

//         if (profileData.cohort && groupData) {
//           const match = groupData.find((g: GroupOption) => g.name === profileData.cohort);
//           setSelectedGroupId(match?.id ?? '');
//         }
//       }

//       setReady(true);
//     }

//     void init();
//     return () => { cancelled = true; };
//   }, []); // run once on mount — session polling handles the reload case

//   // ── When user picks a group from dropdown ─────────────────────────────────
//   function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
//     const groupName = e.target.value;
//     setCohort(groupName);
//     const match = groups.find(g => g.name === groupName);
//     setSelectedGroupId(match?.id ?? '');
//   }

//   // ── Avatar upload ─────────────────────────────────────────────────────────
//   async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file || !user) return;
//     setUploading(true);
//     try {
//       const ext  = file.name.split('.').pop() ?? 'png';
//       const path = `avatars/${user.id}.${ext}`;

//       const { error: uploadError } = await (supabase as any).storage
//         .from('filevault')
//         .upload(path, file, { upsert: true, cacheControl: '3600' });
//       if (uploadError) throw uploadError;

//       const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
//       const publicUrl = data.publicUrl as string;

//       const { error: updateError } = await db
//         .from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
//       if (updateError) throw updateError;

//       setAvatarUrl(publicUrl);
//       await refreshProfile();
//       showToast('Avatar updated!');
//     } catch (err) {
//       console.error(err);
//       showToast('Avatar upload failed', 'error');
//     } finally {
//       setUploading(false);
//       e.target.value = '';
//     }
//   }

//   // ── Profile save ──────────────────────────────────────────────────────────
//   async function handleSave() {
//     const { data: { session } } = await supabase.auth.getSession();
//     const uid = session?.user?.id ?? user?.id;
//     if (!uid) return;

//     setSaving(true);
//     try {
//       // 1. Save profile
//       const { error: profileError } = await db
//         .from('profiles')
//         .update({ full_name: name || null, cohort: cohort || null })
//         .eq('id', uid);
//       if (profileError) throw profileError;

//       // 2. Sync group_members — remove old, insert new
//       await db.from('group_members').delete().eq('user_id', uid);
//       if (selectedGroupId) {
//         const { error: memberError } = await db
//           .from('group_members')
//           .insert({ group_id: selectedGroupId, user_id: uid, role: 'member' });
//         if (memberError && memberError.code !== '23505') throw memberError;
//       }

//       await refreshProfile();
//       showToast('Profile updated!');
//     } catch (err) {
//       console.error('[Settings] save failed', err);
//       showToast('Save failed', 'error');
//     } finally {
//       setSaving(false);
//     }
//   }

//   // ── Show loading skeleton until DB data is ready ──────────────────────────
//   if (!ready) {
//     return (
//       <Layout>
//         <Header title="Settings" />
//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="max-w-lg">
//             <div className="card mb-4" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <span style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</span>
//             </div>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <Header title="Settings" />
//       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
//         <div className="max-w-lg">

//           {/* ── Profile card ── */}
//           <div className="card mb-4">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>
//               Profile
//             </div>

//             {/* Avatar row */}
//             <div className="flex items-center gap-4 mb-5">
//               <div style={{ position: 'relative', flexShrink: 0 }}>
//                 <div
//                   onClick={() => avatarInputRef.current?.click()}
//                   style={{ cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 52, height: 52, position: 'relative' }}
//                   title="Click to change avatar"
//                 >
//                   {avatarUrl ? (
//                     <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                   ) : (
//                     <Avatar name={name || 'User'} size="lg" />
//                   )}
//                   <div
//                     className="avatar-overlay"
//                     style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }}
//                   >
//                     {uploading
//                       ? <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>…</span>
//                       : <span style={{ fontSize: 14 }}>📷</span>}
//                   </div>
//                 </div>
//                 <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   disabled={uploading}
//                   title="Upload photo"
//                   style={{ position: 'absolute', bottom: 0, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#6366f1', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, fontSize: 10, color: '#fff', lineHeight: 1 }}
//                 >
//                   {uploading ? '…' : '✎'}
//                 </button>
//               </div>

//               <div>
//                 <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name || 'No name'}</div>
//                 <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//                 <button
//                   onClick={() => avatarInputRef.current?.click()}
//                   disabled={uploading}
//                   style={{ marginTop: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
//                 >
//                   {uploading ? 'Uploading…' : 'Change photo'}
//                 </button>
//               </div>
//             </div>

//             {/* Full Name */}
//             <FormField label="Full Name">
//               <input
//                 className="form-input"
//                 value={name}
//                 onChange={e => setName(e.target.value)}
//                 placeholder="Enter your full name"
//               />
//             </FormField>

//             {/* Group / Cohort dropdown */}
//             <div className="mt-3">
//               <FormField label="Group">
//                 <select
//                   value={cohort}
//                   onChange={handleGroupChange}
//                   style={{
//                     width: '100%', height: 38, paddingLeft: 10, paddingRight: 32,
//                     borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13,
//                     color: cohort ? '#1e293b' : '#94a3b8', background: '#fff',
//                     outline: 'none', appearance: 'none',
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
//                     backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
//                     cursor: 'pointer', transition: 'border-color 0.15s',
//                   }}
//                   onFocus={e => (e.target.style.borderColor = '#6366f1')}
//                   onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
//                 >
//                   <option value="">— Select a group —</option>
//                   {groups.map(g => (
//                     <option key={g.id} value={g.name}>
//                       {g.icon ? `${g.icon} ${g.name}` : g.name}
//                     </option>
//                   ))}
//                 </select>
//               </FormField>

//               {cohort && (
//                 <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
//                   Currently in: <strong style={{ color: '#6366f1' }}>{cohort}</strong>
//                   <button
//                     onClick={() => { setCohort(''); setSelectedGroupId(''); }}
//                     style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
//                   >
//                     ✕ clear
//                   </button>
//                 </p>
//               )}
//             </div>

//             <div className="mt-4">
//               <Button variant="primary" onClick={handleSave} disabled={saving}>
//                 {saving ? 'Saving…' : 'Save Changes'}
//               </Button>
//             </div>
//           </div>

//           {/* ── Account card ── */}
//           <div className="card">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
//               Account
//             </div>
//             <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
//             <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//           </div>

//         </div>
//       </div>

//       <style>{`
//         div:hover > .avatar-overlay { opacity: 1 !important; }
//       `}</style>
//     </Layout>
//   );
// }
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { Avatar } from '../components/layout/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface GroupOption { id: string; name: string; icon: string | null; }

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #e8eaf0',
  padding: '28px 28px 24px',
  marginBottom: 20,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 12,
  border: '1.5px solid #e5e7eb',
  fontSize: 14,
  color: '#111827',
  padding: '0 14px',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  paddingRight: 36,
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 12,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
  transition: 'background 0.15s',
};

const iconCircle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: '#ede9fe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
};

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useApp();

  const [name,            setName]            = useState('');
  const [cohort,          setCohort]          = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groups,          setGroups]          = useState<GroupOption[]>([]);
  const [saving,          setSaving]          = useState(false);
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const [ready,           setReady]           = useState(false);


  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let uid: string | undefined;
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
        if (uid) break;
        await new Promise(r => setTimeout(r, 300));
      }
      if (!uid || cancelled) return;

      const [{ data: groupData }, { data: profileData }] = await Promise.all([
        db.from('groups').select('id, name, icon').order('name'),
        db.from('profiles').select('*').eq('id', uid).maybeSingle(),
      ]);

      if (cancelled) return;
      if (groupData) setGroups(groupData);
      if (profileData) {
        setName(profileData.full_name ?? '');
        setCohort(profileData.cohort ?? '');
        setAvatarUrl(profileData.avatar_url ?? null);
        if (profileData.cohort && groupData) {
          const match = groupData.find((g: GroupOption) => g.name === profileData.cohort);
          setSelectedGroupId(match?.id ?? '');
        }
      }
      setReady(true);
    }

    void init();
    return () => { cancelled = true; };
  }, []);

  function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const groupName = e.target.value;
    setCohort(groupName);
    const match = groups.find(g => g.name === groupName);
    setSelectedGroupId(match?.id ?? '');
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await (supabase as any).storage
        .from('filevault').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
      const publicUrl = data.publicUrl as string;
      await db.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
      await refreshProfile();
      showToast('Avatar updated!');
    } catch (err) {
      console.error(err);
      showToast('Avatar upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSave() {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? user?.id;
    if (!uid) return;
    setSaving(true);
    try {
      const { error: profileError } = await db
        .from('profiles')
        .update({ full_name: name || null, cohort: cohort || null })
        .eq('id', uid);
      if (profileError) throw profileError;

      await db.from('group_members').delete().eq('user_id', uid);
      if (selectedGroupId) {
        const { error: memberError } = await db
          .from('group_members')
          .insert({ group_id: selectedGroupId, user_id: uid, role: 'member' });
        if (memberError && memberError.code !== '23505') throw memberError;
      }
      await refreshProfile();
      showToast('Profile updated!');
    } catch (err) {
      console.error('[Settings] save failed', err);
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }



  if (!ready) {
    return (
      <Layout>
        <Header title="Settings" />
        <div className="flex-1 overflow-y-auto p-6">
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ ...card, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* ── Profile card ── */}
          <div style={card}>
            <div style={iconCircle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              Edit profile
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
              Update your name, photo and group.
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Avatar name={name || 'User'} size="lg" />
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: 0, transition: 'opacity 0.15s' }}
                    className="avatar-hover-overlay">
                    <span style={{ fontSize: 12 }}>📷</span>
                  </div>
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  style={{ position: 'absolute', bottom: 0, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#6366f1', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, fontSize: 9, color: '#fff' }}
                >✎</button>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{name || 'No name'}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{user?.email}</div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  style={{ marginTop: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >{uploading ? 'Uploading…' : 'Change photo'}</button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Group */}
            <div style={{ marginBottom: 8 }}>
              <label style={label}>Group</label>
              <select
                value={cohort}
                onChange={handleGroupChange}
                style={{ ...selectStyle, color: cohort ? '#111827' : '#9ca3af' }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
              >
                <option value="">— Select a group —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.name}>
                    {g.icon ? `${g.icon} ${g.name}` : g.name}
                  </option>
                ))}
              </select>
              {cohort && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Currently in:</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1' }}>{cohort}</span>
                  <button
                    onClick={() => { setCohort(''); setSelectedGroupId(''); }}
                    style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >✕ clear</button>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}
              onMouseEnter={e => { if (!saving) (e.currentTarget.style.background = '#4f46e5'); }}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        div:hover > .avatar-hover-overlay { opacity: 1 !important; }
      `}</style>
    </Layout>
  );
}