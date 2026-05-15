// import { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase';
// import type { User } from '@supabase/supabase-js'

// // ─── Types ──────────────────────────────────────────────────────────────────────

// interface Profile {
//   id: string;
//   full_name: string;
//   role?: string;
//   [key: string]: unknown; // bug fix: any → unknown (safer index signature)
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string, fullName: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   // Added: Google OAuth — Supabase opens a popup/redirect, no Firebase needed
//   signInWithGoogle: () => Promise<void>;
// }

// // ─── Context ────────────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextType | null>(null);

// // ─── Provider ───────────────────────────────────────────────────────────────────

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser]       = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
//         setUser(session?.user ?? null);
//         if (session?.user) fetchProfile(session.user.id);
//         else setProfile(null);
//         setLoading(false);
//       },
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   // ── Helpers ───────────────────────────────────────────────────────────────────

//   async function fetchProfile(userId: string) {
//     const { data } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();
//     setProfile(data);
//   }

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
//         // After Google redirects back, Supabase lands the user here.
//         // Change to your production URL when deploying.
//         redirectTo: window.location.origin,
//       },
//     });
//     if (error) throw error;
//     // Note: execution stops here — the browser navigates away to Google.
//     // The session is handled by onAuthStateChange once the user returns.
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

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js'

// ─── Types ──────────────────────────────────────────────────────────────────────

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

// ─── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  // ✅ Declared BEFORE the useEffect that calls it

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  // ── Auth state listener ───────────────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id); // ✅ now in scope
        else setProfile(null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────────────────

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase
        .from('profiles')
        .insert({ id: data.user.id, full_name: fullName });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  /**
   * Sign in with Google via Supabase OAuth.
   *
   * HOW IT WORKS:
   * Supabase redirects the user to Google's consent screen, then back to
   * `redirectTo`. The `onAuthStateChange` listener above picks up the session
   * automatically — no extra code needed in Auth.tsx.
   *
   * SETUP (one-time, in Supabase dashboard):
   * 1. Go to Authentication → Providers → Google → Enable
   * 2. Add your Google OAuth Client ID + Secret (from console.cloud.google.com)
   * 3. Add your site URL to the Supabase "Redirect URLs" allowlist, e.g.:
   *      http://localhost:5173
   *      https://your-production-domain.com
   */
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};