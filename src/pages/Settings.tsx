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
  fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block',
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 48, borderRadius: 12, border: '1.5px solid #e5e7eb',
  fontSize: 14, color: '#111827', padding: '0 14px', outline: 'none',
  background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};
const primaryBtn: React.CSSProperties = {
  width: '100%', height: 48, borderRadius: 12, border: 'none', background: '#6366f1',
  color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8,
  transition: 'background 0.15s',
};
const iconCircle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: '50%', background: '#ede9fe',
  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
};

const CACHE_KEY = 'settings_profile_cache';

interface ProfileCache {
  full_name: string;
  cohort: string;
  avatar_url: string | null;
  groups: GroupOption[];
}

function loadCache(): ProfileCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ProfileCache) : null;
  } catch { return null; }
}

function saveCache(p: ProfileCache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useApp();

  // ── Initialise from cache instantly — fields never blank on reload ─────────
  const cached = loadCache();
  const [name,            setName]            = useState(cached?.full_name   ?? '');
  const [cohort,          setCohort]          = useState(cached?.cohort      ?? '');
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(cached?.avatar_url ?? null);
  const [groups,          setGroups]          = useState<GroupOption[]>(cached?.groups ?? []);
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    if (!cached?.cohort || !cached.groups?.length) return '';
    return cached.groups.find(g => g.name === cached.cohort)?.id ?? '';
  });

  const [role,      setRole]      = useState<string>('');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  // Skip skeleton if we already have cached data
  const [ready, setReady] = useState(cached !== null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Single effect: polls session directly — never waits for context user ──
  // This is the KEY fix: does NOT depend on user?.id from context.
  // On reload, context user is null briefly, but getSession() always works.
  useEffect(() => {
  let cancelled = false;

  async function init() {
    console.log('🔄 init() started');

    let uid: string | undefined;
    for (let i = 0; i < 10; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
      console.log(`🔑 poll ${i}: uid =`, uid);
      if (uid) break;
      await new Promise(r => setTimeout(r, 300));
    }

    if (!uid) { console.log('❌ no uid found after polling'); return; }
    if (cancelled) { console.log('❌ cancelled'); return; }

    console.log('✅ uid found:', uid);

    const [{ data: groupData, error: groupErr }, { data: profileData, error: profileErr }] = await Promise.all([
      db.from('groups').select('id, name, icon').order('name'),
      db.from('profiles').select('*').eq('id', uid).maybeSingle(),
    ]);

    console.log('📦 groupData:', groupData, 'error:', groupErr);
    console.log('👤 profileData:', profileData, 'error:', profileErr);

    if (cancelled) return;

    const freshGroups: GroupOption[] = groupData ?? [];
    setGroups(freshGroups);

    if (profileData) {
      const freshCohort = (profileData.cohort as string) ?? '';
      console.log('🎯 freshCohort:', freshCohort);
      console.log('🎯 freshGroups:', freshGroups);

      const match = freshGroups.find(g => g.name === freshCohort);
      console.log('🎯 match:', match);

      setCohort(freshCohort);
      setSelectedGroupId(match?.id ?? '');
      setName((profileData.full_name as string) ?? '');
      setAvatarUrl((profileData.avatar_url as string | null) ?? null);
      setRole((profileData.role as string) ?? '');

      saveCache({
        full_name: (profileData.full_name as string) ?? '',
        cohort: freshCohort,
        avatar_url: (profileData.avatar_url as string | null) ?? null,
        groups: freshGroups,
      });
    }

    setReady(true);
    console.log('✅ ready set to true');
  }

  void init();
  return () => { cancelled = true; };
}, []);

  // ── Group dropdown change ─────────────────────────────────────────────────
  function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const groupName = e.target.value;
    setCohort(groupName);
    const match = groups.find(g => g.name === groupName);
    setSelectedGroupId(match?.id ?? '');
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? user?.id;
    if (!uid) return;

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `avatars/${uid}.${ext}`;
      const { error: uploadError } = await (supabase as any).storage
        .from('filevault').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { data } = (supabase as any).storage.from('filevault').getPublicUrl(path);
      const publicUrl = data.publicUrl as string;
      await db.from('profiles').update({ avatar_url: publicUrl }).eq('id', uid);
      setAvatarUrl(publicUrl);
      saveCache({ full_name: name, cohort, avatar_url: publicUrl, groups });
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

  // ── Profile save ──────────────────────────────────────────────────────────
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

      if (role !== 'admin') {
        await db.from('group_members').delete().eq('user_id', uid);
        if (selectedGroupId) {
          const { error: memberError } = await db
            .from('group_members')
            .insert({ group_id: selectedGroupId, user_id: uid, role: 'member' });
          if (memberError && memberError.code !== '23505') throw memberError;
        }
      }
      saveCache({ full_name: name, cohort, avatar_url: avatarUrl, groups });
      await refreshProfile();
      showToast('Profile updated!');
    } catch (err) {
      console.error('[Settings] save failed', err);
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton — only on very first load (no cache yet) ─────────────────────
  if (!ready) {
    return (
      <Layout>
        <Header title="Settings" />
        <div className="flex-1 overflow-y-auto p-6">
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={card}>
              <div className="animate-pulse">
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e5e7eb', marginBottom: 16 }} />
                <div style={{ width: 120, height: 20, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: 220, height: 14, background: '#f3f4f6', borderRadius: 6, marginBottom: 28 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 140, height: 14, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ width: 180, height: 12, background: '#f3f4f6', borderRadius: 6 }} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ width: 72, height: 12, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '100%', height: 48, background: '#f3f4f6', borderRadius: 12 }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 48, height: 12, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '100%', height: 48, background: '#f3f4f6', borderRadius: 12 }} />
                </div>
                <div style={{ width: '100%', height: 48, background: '#e5e7eb', borderRadius: 12 }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <Layout>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={card}>
            <div style={iconCircle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Edit profile</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Update your name, photo and group.</div>

            {/* Avatar row */}
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
                  <div className="avatar-hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: 0, transition: 'opacity 0.15s' }}>
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
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your full name" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e  => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Group dropdown — hidden for admins */}
            {role !== 'admin' && (
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
            )}

            <button
              onClick={handleSave} disabled={saving}
              style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}
              onMouseEnter={e => { if (!saving) (e.currentTarget.style.background = '#4f46e5'); }}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`div:hover > .avatar-hover-overlay { opacity: 1 !important; }`}</style>
    </Layout>
  );
}