// // import Layout from '../components/layout/Layout';
// // import Header from '../components/layout/Header';
// // import { useAuth } from '../contexts/AuthContext';
// // import { useState } from 'react';
// // import { supabase } from '../lib/supabase';
// // import { useApp } from '../contexts/AppContext';
// // import { Button, FormField } from '../components/layout/ui';
// // import { Avatar } from '../components/layout/ui';

// // export default function Settings() {
// //   const { profile, user } = useAuth();
// //   const { showToast } = useApp();
// //   const [name, setName] = useState(profile?.full_name || '');
// //   const [saving, setSaving] = useState(false);

// //   async function handleSave() {
// //     setSaving(true);
// //     const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
// //     setSaving(false);
// //     if (error) showToast('Save failed', 'error');
// //     else showToast('Profile updated!');
// //   }

// //   return (
// //     <Layout>
// //       <Header title="Settings" />
// //       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
// //         <div className="max-w-lg">
// //           <div className="card mb-4">
// //             <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>Profile</div>
// //             <div className="flex items-center gap-4 mb-5">
// //               <Avatar name={name || 'User'} size="lg" />
// //               <div>
// //                 <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name || 'No name'}</div>
// //                 <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</div>
// //               </div>
// //             </div>
// //             <FormField label="Full Name">
// //               <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
// //             </FormField>
// //             <div className="mt-4">
// //               <Button variant="primary" onClick={handleSave} disabled={saving}>
// //                 {saving ? 'Saving…' : 'Save Changes'}
// //               </Button>
// //             </div>
// //           </div>

// //           <div className="card">
// //             <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Account</div>
// //             <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
// //             <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
// //           </div>
// //         </div>
// //       </div>
// //     </Layout>
// //   );
// // }
// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import { useAuth } from '../contexts/AuthContext';
// import { useState } from 'react';
// import { supabase } from '../lib/supabase';
// import { useApp } from '../contexts/AppContext';
// import { Button, FormField } from '../components/layout/ui';
// import { Avatar } from '../components/layout/ui';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// export default function Settings() {
//   const { profile, user } = useAuth();
//   const { showToast } = useApp();
//   const [name, setName] = useState(profile?.full_name || '');
//   const [saving, setSaving] = useState(false);

//   async function handleSave() {
//     if (!user) return;
//     setSaving(true);
//     const { error } = await db.from('profiles').update({ full_name: name }).eq('id', user.id); // ✅ fixed
//     setSaving(false);
//     if (error) showToast('Save failed', 'error');
//     else showToast('Profile updated!');
//   }

//   return (
//     <Layout>
//       <Header title="Settings" />
//       <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
//         <div className="max-w-lg">
//           <div className="card mb-4">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>Profile</div>
//             <div className="flex items-center gap-4 mb-5">
//               <Avatar name={name || 'User'} size="lg" />
//               <div>
//                 <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name || 'No name'}</div>
//                 <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//               </div>
//             </div>
//             <FormField label="Full Name">
//               <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
//             </FormField>
//             <div className="mt-4">
//               <Button variant="primary" onClick={handleSave} disabled={saving}>
//                 {saving ? 'Saving…' : 'Save Changes'}
//               </Button>
//             </div>
//           </div>

//           <div className="card">
//             <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Account</div>
//             <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
//             <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { Button, FormField } from '../components/layout/ui';
import { Avatar } from '../components/layout/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface GroupOption { id: string; name: string; icon: string | null; }

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useApp();
  const [name, setName]           = useState(profile?.full_name || '');
  const [cohort, setCohort]       = useState<string>(profile?.cohort || '');
  const [groups, setGroups]       = useState<GroupOption[]>([]);
  const [saving, setSaving]       = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Load groups for the cohort dropdown ───────────────────────────────────
  useEffect(() => {
    db.from('groups').select('id, name, icon').order('name')
      .then(({ data }: { data: GroupOption[] | null }) => {
        if (data) setGroups(data);
      });
  }, []);

  // ── Keep local state in sync if profile loads after mount ─────────────────
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setCohort(profile.cohort || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('filevault')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
      const publicUrl = data.publicUrl as string;

      const { error: updateError } = await db
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile(); // ✅ sync context
      showToast('Avatar updated!');
    } catch (err) {
      console.error(err);
      showToast('Avatar upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // ── Profile save ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await db
        .from('profiles')
        .update({
          full_name: name       || null,
          cohort:    cohort     || null,  // ✅ saves the group name as-is (e.g. "Cohort 1")
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile(); // ✅ re-fetches profile into AuthContext so UI reflects changes
      showToast('Profile updated!');
    } catch (err) {
      console.error('[Settings] save failed', err);
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        <div className="max-w-lg">

          {/* ── Profile card ── */}
          <div className="card mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>
              Profile
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-5">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 52, height: 52, position: 'relative' }}
                  title="Click to change avatar"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Avatar name={name || 'User'} size="lg" />
                  )}
                  <div
                    className="avatar-overlay"
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', opacity: uploading ? 1 : 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {uploading
                      ? <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>…</span>
                      : <span style={{ fontSize: 14 }}>📷</span>
                    }
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />

                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload photo"
                  style={{
                    position: 'absolute', bottom: 0, right: -2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#6366f1', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0, fontSize: 10, color: '#fff', lineHeight: 1,
                  }}
                >
                  {uploading ? '…' : '✎'}
                </button>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {name || 'No name'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  {user?.email}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  style={{ marginTop: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
              </div>
            </div>

            {/* Full Name */}
            <FormField label="Full Name">
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </FormField>

            {/* ── Group / Cohort dropdown ── */}
            <div className="mt-3">
              <FormField label="Group">
                <select
                  value={cohort}
                  onChange={e => setCohort(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    paddingLeft: 10,
                    paddingRight: 32,
                    borderRadius: 8,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 13,
                    color: cohort ? '#1e293b' : '#94a3b8',
                    background: '#fff',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#6366f1')}
                  onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
                >
                  <option value="">— Select a group —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.icon ? `${g.icon} ${g.name}` : g.name}
                    </option>
                  ))}
                </select>
              </FormField>

              {cohort && (
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Currently in: <strong style={{ color: '#6366f1' }}>{cohort}</strong>
                  <button
                    onClick={() => setCohort('')}
                    style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    ✕ clear
                  </button>
                </p>
              )}
            </div>

            <div className="mt-4">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* ── Account card ── */}
          <div className="card">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Account
            </div>
            <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
            <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
          </div>

        </div>
      </div>

      <style>{`
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>
    </Layout>
  );
}