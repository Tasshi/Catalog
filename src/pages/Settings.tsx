// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import { useAuth } from '../contexts/AuthContext';
// import { useState } from 'react';
// import { supabase } from '../lib/supabase';
// import { useApp } from '../contexts/AppContext';
// import { Button, FormField } from '../components/layout/ui';
// import { Avatar } from '../components/layout/ui';

// export default function Settings() {
//   const { profile, user } = useAuth();
//   const { showToast } = useApp();
//   const [name, setName] = useState(profile?.full_name || '');
//   const [saving, setSaving] = useState(false);

//   async function handleSave() {
//     setSaving(true);
//     const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
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
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { Button, FormField } from '../components/layout/ui';
import { Avatar } from '../components/layout/ui';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function Settings() {
  const { profile, user } = useAuth();
  const { showToast } = useApp();
  const [name, setName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await db.from('profiles').update({ full_name: name }).eq('id', user.id); // ✅ fixed
    setSaving(false);
    if (error) showToast('Save failed', 'error');
    else showToast('Profile updated!');
  }

  return (
    <Layout>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        <div className="max-w-lg">
          <div className="card mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text3)' }}>Profile</div>
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={name || 'User'} size="lg" />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name || 'No name'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</div>
              </div>
            </div>
            <FormField label="Full Name">
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
            </FormField>
            <div className="mt-4">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Account</div>
            <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>Email</div>
            <div className="text-sm" style={{ color: 'var(--text3)' }}>{user?.email}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}