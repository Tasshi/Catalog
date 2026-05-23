// import { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { supabase } from '../lib/supabase';
// import type { User } from '@supabase/supabase-js';

// interface Profile {
//   id: string;
//   full_name: string;
//   role?: string;
//   cohort?: string | null;
//   avatar_url?: string | null;
//   email?: string | null;
//   phone?: string | null;
//   [key: string]: unknown;
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   loading: boolean;
//   canUpload: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ needsConfirmation: boolean }>;
//   signOut: () => Promise<void>;
//   signInWithGoogle: () => Promise<void>;
//   resetPassword: (email: string) => Promise<void>;
//   refreshProfile: () => Promise<void>;
//   resendConfirmationEmail: (email: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser]       = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const initDone              = useRef(false);
//   const justSignedUp          = useRef(false);

//   const canUpload = !!profile?.cohort;

//   async function fetchProfile(userId: string) {
//     const { data, error } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     if (error) {
//       console.error('❌ fetchProfile error:', error.message, error.code);
//     }

//     setProfile(data ?? null);
//   }

//   async function applySession(session: { user: User } | null) {
//     try {
//       if (session?.user) {
//         const u = session.user;
//         setUser(u);

//         let retries = 3;
//         while (retries > 0) {
//           const { data, error } = await supabase
//             .from('profiles')
//             .select('*')
//             .eq('id', u.id)
//             .single();

//           if (data) { setProfile(data); break; }

//           // PGRST116 = 0 rows. Two possible causes:
//           //   1. Profile was never created (trigger missing) → upsert to create it.
//           //   2. Profile EXISTS but RLS SELECT policy is missing → upsert returns null too.
//           //      Fix: run the SQL policies below in Supabase SQL Editor.
//           if (error?.code === 'PGRST116') {
//             const meta      = u.user_metadata ?? {};
//             const full_name = (meta.full_name ?? meta.name ?? u.email ?? '') as string;

//             const { data: created, error: upsertErr } = await supabase
//               .from('profiles')
//               .upsert(
//                 { id: u.id, full_name, role: 'user', email: u.email ?? null, phone: (meta.phone ?? null) as string | null },
//                 { onConflict: 'id', ignoreDuplicates: true },
//               )
//               .select('*')
//               .single();

//             if (created) {
//               setProfile(created);
//             } else {
//               console.error(
//                 '❌ Profile unavailable — likely missing RLS SELECT policy.\n' +
//                 'Run this in Supabase SQL Editor:\n' +
//                 '  CREATE POLICY "select_own" ON profiles FOR SELECT USING (auth.uid() = id);\n' +
//                 '  CREATE POLICY "insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);\n' +
//                 '  CREATE POLICY "update_own" ON profiles FOR UPDATE USING (auth.uid() = id);',
//                 upsertErr?.message,
//               );
//             }
//             break;
//           }

//           console.warn(`⚠️ Profile fetch attempt failed (${4 - retries}/3):`, error?.message, error?.code);
//           retries--;
//           if (retries > 0) await new Promise(r => setTimeout(r, 500));
//         }
//       } else {
//         setUser(null);
//         setProfile(null);
//       }
//     } catch (err) {
//       console.error('❌ applySession unexpected error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     let mounted = true;

//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (!mounted) return;
//       initDone.current = true;
//       applySession(session);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         if (!mounted) return;
//         console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
//         if (_event === 'INITIAL_SESSION') return;
//         if (_event === 'PASSWORD_RECOVERY') return;
//         if (justSignedUp.current) return;
//         applySession(session);
//       },
//     );

//     return () => {
//       mounted = false;
//       subscription.unsubscribe();
//     };
//   }, []);

//   async function signIn(email: string, password: string) {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) {
//       console.error('🔴 signIn error:', { message: error.message, code: (error as { code?: string }).code, status: error.status });
//       throw error;
//     }
//     await applySession(data.session);
//   }

//   async function signUp(
//     email: string,
//     password: string,
//     fullName: string,
//     phone?: string,
//   ): Promise<{ needsConfirmation: boolean }> {
//     justSignedUp.current = true;
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             full_name: fullName,
//             ...(phone ? { phone } : {}),
//           },
//         },
//       });

//       if (error) throw error;

//       // Profile is created automatically by the DB trigger (handle_new_user)
//       // If session is null after signup, email confirmation is required
//       const needsConfirmation = !data.session;

//       if (needsConfirmation) {
//         await supabase.auth.signOut();
//       } else {
//         // Confirmation OFF — user is already signed in
//         justSignedUp.current = false;
//         await applySession(data.session);
//       }

//       return { needsConfirmation };
//     } finally {
//       justSignedUp.current = false;
//     }
//   }

//   async function signOut() {
//     await supabase.auth.signOut();
//   }

//   async function signInWithGoogle() {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: { redirectTo: window.location.origin },
//     });
//     if (error) throw error;
//   }

//   async function resetPassword(email: string) {
//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${window.location.origin}/reset-password`,
//     });
//     if (error) throw error;
//   }

//   async function refreshProfile() {
//     if (!user) return;
//     await fetchProfile(user.id);
//   }

//   async function resendConfirmationEmail(email: string) {
//     const { error } = await supabase.auth.resend({ type: 'signup', email });
//     if (error) throw error;
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         profile,
//         loading,
//         canUpload,
//         signIn,
//         signUp,
//         signOut,
//         signInWithGoogle,
//         resetPassword,
//         refreshProfile,
//         resendConfirmationEmail,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth(): AuthContextType {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  role?: string;
  cohort?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  canUpload: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initDone              = useRef(false);
  const justSignedUp          = useRef(false);

  const canUpload = !!profile?.cohort;

  // ── fetchProfile: always gets uid from session if user is null ────────────
  async function fetchProfile(userId?: string) {
    // If no userId passed, get it directly from session
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
    }
    if (!uid) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('❌ fetchProfile error:', error.message, error.code);
    }

    setProfile(data ?? null);
  }

  async function applySession(session: { user: User } | null) {
    try {
      if (session?.user) {
        const u = session.user;
        setUser(u);

        let retries = 3;
        while (retries > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .single();

          if (data) {
            // Sync Google metadata into the profile if fields are missing
            const meta       = u.user_metadata ?? {};
            const isGoogle   = u.app_metadata?.provider === 'google';
            const googleName = (meta.full_name ?? meta.name ?? '') as string;
            const googleAvatar = (meta.avatar_url ?? meta.picture ?? '') as string;
            const needsSync  = isGoogle && (!data.full_name || !data.avatar_url);
            if (needsSync) {
              const patch: Record<string, string> = {};
              if (!data.full_name  && googleName)   patch.full_name  = googleName;
              if (!data.avatar_url && googleAvatar) patch.avatar_url = googleAvatar;
              if (Object.keys(patch).length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: synced } = await (supabase as any)
                  .from('profiles')
                  .update(patch)
                  .eq('id', u.id)
                  .select('*')
                  .single();
                if (synced) { setProfile(synced); break; }
              }
            }
            setProfile(data);
            break;
          }

          if (error?.code === 'PGRST116') {
            const meta       = u.user_metadata ?? {};
            const full_name  = (meta.full_name ?? meta.name ?? u.email ?? '') as string;
            const avatar_url = (meta.avatar_url ?? meta.picture ?? null) as string | null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: created, error: upsertErr } = await (supabase as any)
              .from('profiles')
              .upsert(
                { id: u.id, full_name, avatar_url, role: 'user', email: u.email ?? null, phone: (meta.phone ?? null) as string | null },
                { onConflict: 'id', ignoreDuplicates: false },
              )
              .select('*')
              .single();

            if (created) {
              setProfile(created);
            } else {
              console.error(
                '❌ Profile unavailable — likely missing RLS SELECT policy.\n' +
                'Run this in Supabase SQL Editor:\n' +
                '  CREATE POLICY "select_own" ON profiles FOR SELECT USING (auth.uid() = id);\n' +
                '  CREATE POLICY "insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);\n' +
                '  CREATE POLICY "update_own" ON profiles FOR UPDATE USING (auth.uid() = id);',
                upsertErr?.message,
              );
            }
            break;
          }

          console.warn(`⚠️ Profile fetch attempt failed (${4 - retries}/3):`, error?.message, error?.code);
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 500));
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('❌ applySession unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initDone.current = true;
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
        if (_event === 'INITIAL_SESSION') return;
        if (_event === 'PASSWORD_RECOVERY') return;
        if (justSignedUp.current) return;
        applySession(session);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('🔴 signIn error:', { message: error.message, code: (error as { code?: string }).code, status: error.status });
      throw error;
    }
    await applySession(data.session);
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ): Promise<{ needsConfirmation: boolean }> {
    justSignedUp.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(phone ? { phone } : {}),
          },
        },
      });

      if (error) throw error;

      const needsConfirmation = !data.session;

      if (needsConfirmation) {
        await supabase.auth.signOut();
      } else {
        justSignedUp.current = false;
        await applySession(data.session);
      }

      return { needsConfirmation };
    } finally {
      justSignedUp.current = false;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  // ── refreshProfile: works even when user is null (gets uid from session) ──
  async function refreshProfile() {
    // Try user from state first, fall back to live session
    const uid = user?.id;
    if (uid) {
      await fetchProfile(uid);
    } else {
      // user is null briefly on reload — get uid directly from session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await fetchProfile(session.user.id);
        // Also update user state so the rest of the app has it
        setUser(session.user);
      }
    }
  }

  async function resendConfirmationEmail(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        canUpload,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        refreshProfile,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}