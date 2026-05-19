// import { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { supabase } from '../lib/supabase';
// import type { User } from '@supabase/supabase-js';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Profile {
//   id: string;
//   full_name: string;
//   role?: string;
//   cohort?: 'cohort1' | 'cohort2' | 'cohort3' | null;
//   [key: string]: unknown;
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   loading: boolean;
//   canUpload: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string, fullName: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   signInWithGoogle: () => Promise<void>;
//   resetPassword: (email: string) => Promise<void>;
//   refreshProfile: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser]       = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const initDone              = useRef(false);

//   const canUpload = profile?.cohort === 'cohort3';

//   async function fetchProfile(userId: string) {
//     const { data } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();
//     setProfile(data ?? null);
//   }

//   async function applySession(session: { user: User } | null) {
//     if (session?.user) {
//       setUser(session.user);
//       await fetchProfile(session.user.id);
//     } else {
//       setUser(null);
//       setProfile(null);
//     }
//     setLoading(false);
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
//         applySession(session);
//       },
//     );

//     return () => {
//       mounted = false;
//       subscription.unsubscribe();
//     };
//   }, []);

//   async function signIn(email: string, password: string) {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//   }

//   async function signUp(email: string, password: string, fullName: string) {
//     const { data, error } = await supabase.auth.signUp({ email, password });
//     if (error) throw error;
//     if (data.user) {
//       await db.from('profiles').insert({ id: data.user.id, full_name: fullName }); // ✅ fixed
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
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = (): AuthContextType => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string;
  role?: string;
  // ✅ FIX: widened from a narrow union to plain string so any group name
  // (e.g. "Cohort 1", "GMC Directory") can be stored and read back correctly.
  cohort?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  canUpload: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initDone              = useRef(false);

  // ✅ FIX: compare against actual group names, not hardcoded 'cohort3'
  // Adjust this condition to whatever group name should grant upload access.
  const canUpload = !!profile?.cohort;

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  }

  async function applySession(session: { user: User } | null) {
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
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
        applySession(session);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await db.from('profiles').insert({ id: data.user.id, full_name: fullName });
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

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user.id);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};