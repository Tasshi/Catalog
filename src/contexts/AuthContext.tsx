// import { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { supabase } from '../lib/supabase';
// import type { User } from '@supabase/supabase-js';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// interface Profile {
//   id: string;
//   full_name: string;
//   role?: string;
//   cohort?: string | null;
//   avatar_url?: string | null;
//   email?: string | null;
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
//   const justSignedUp          = useRef(false);

//   const canUpload = !!profile?.cohort;

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
//       // Trigger handles profile creation — just fetch it.
//       // Small retry in case the trigger hasn't fired yet.
//       let retries = 3;
//       while (retries > 0) {
//         const { data } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', session.user.id)
//           .single();
//         if (data) {
//           setProfile(data);
//           break;
//         }
//         retries--;
//         await new Promise(r => setTimeout(r, 500));
//       }
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

//   // ✅ FIX: capture the session from signInWithPassword and apply it directly.
//   // This bypasses the onAuthStateChange listener (which has guards that can skip it)
//   // and immediately updates user + profile state, allowing Auth.tsx's useEffect to redirect.
//   async function signIn(email: string, password: string) {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//     await applySession(data.session);
//   }

//   async function signUp(email: string, password: string, fullName: string) {
//     justSignedUp.current = true;
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { full_name: fullName }, // ← pass name in metadata so trigger picks it up
//       },
//     });
//     if (error) {
//       justSignedUp.current = false;
//       throw error;
//     }
//     // Trigger auto-creates the profile — but update full_name explicitly
//     // in case the user registered with email (trigger uses metadata above).
//     if (data.user) {
//       await db.from('profiles')
//         .upsert({ id: data.user.id, full_name: fullName })
//         .eq('id', data.user.id);
//     }
//     await supabase.auth.signOut();
//     justSignedUp.current = false;
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

// export function useAuth(): AuthContextType {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Profile {
  id: string;
  full_name: string;
  role?: string;
  cohort?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  canUpload: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>; // ← added phone?
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
  const justSignedUp          = useRef(false);

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
      let retries = 3;
      while (retries > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) {
          setProfile(data);
          break;
        }
        retries--;
        await new Promise(r => setTimeout(r, 500));
      }
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
    if (error) throw error;
    await applySession(data.session);
  }

  async function signUp(email: string, password: string, fullName: string, phone?: string) { // ← added phone?
    justSignedUp.current = true;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(phone ? { phone } : {}), // ← pass phone in metadata if provided
        },
      },
    });
    if (error) {
      justSignedUp.current = false;
      throw error;
    }
    if (data.user) {
      await db.from('profiles')
        .upsert({
          id:        data.user.id,
          full_name: fullName,
          ...(phone ? { phone } : {}), // ← persist phone to profiles row if provided
        })
        .eq('id', data.user.id);
    }
    await supabase.auth.signOut();
    justSignedUp.current = false;
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

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}