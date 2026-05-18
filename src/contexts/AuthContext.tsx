// import { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase';
// import type { User } from '@supabase/supabase-js'

// // ─── Types ──────────────────────────────────────────────────────────────────────

// interface Profile {
//   id: string;
//   full_name: string;
//   role?: string;
//   [key: string]: unknown;
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string, fullName: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   signInWithGoogle: () => Promise<void>;
// }

// // ─── Context ────────────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextType | null>(null);

// // ─── Provider ───────────────────────────────────────────────────────────────────

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser]       = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);

//   // ── Helpers ───────────────────────────────────────────────────────────────────
//   // ✅ Declared BEFORE the useEffect that calls it

//   async function fetchProfile(userId: string) {
//     const { data } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();
//     setProfile(data);
//   }

//   // ── Auth state listener ───────────────────────────────────────────────────────

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
//         setUser(session?.user ?? null);
//         if (session?.user) fetchProfile(session.user.id); // ✅ now in scope
//         else setProfile(null);
//         setLoading(false);
//       },
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   // ── Auth methods ──────────────────────────────────────────────────────────────

//   async function signIn(email: string, password: string) {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//   }

//   async function signUp(email: string, password: string, fullName: string) {
//     const { data, error } = await supabase.auth.signUp({ email, password });
//     if (error) throw error;
//     if (data.user) {
//       await supabase
//         .from('profiles')
//         .insert({ id: data.user.id, full_name: fullName });
//     }
//   }

//   async function signOut() {
//     await supabase.auth.signOut();
//   }

//   /**
//    * Sign in with Google via Supabase OAuth.
//    *
//    * HOW IT WORKS:
//    * Supabase redirects the user to Google's consent screen, then back to
//    * `redirectTo`. The `onAuthStateChange` listener above picks up the session
//    * automatically — no extra code needed in Auth.tsx.
//    *
//    * SETUP (one-time, in Supabase dashboard):
//    * 1. Go to Authentication → Providers → Google → Enable
//    * 2. Add your Google OAuth Client ID + Secret (from console.cloud.google.com)
//    * 3. Add your site URL to the Supabase "Redirect URLs" allowlist, e.g.:
//    *      http://localhost:5173
//    *      https://your-production-domain.com
//    */
//   async function signInWithGoogle() {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: window.location.origin,
//       },
//     });
//     if (error) throw error;
//   }

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <AuthContext.Provider
//       value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ─── Hook ────────────────────────────────────────────────────────────────────────

// export const useAuth = (): AuthContextType => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string;
  role?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initDone              = useRef(false);

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

    // Eagerly read session from localStorage — fires once, immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initDone.current = true;
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');

        // INITIAL_SESSION is fired by Supabase on mount — getSession already
        // handles this, so skip it to prevent a double fetch/render
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
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName });
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};