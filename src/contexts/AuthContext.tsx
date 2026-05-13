import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string;
  role?: string;
  [key: string]: unknown; // bug fix: any → unknown (safer index signature)
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Added: Google OAuth — Supabase opens a popup/redirect, no Firebase needed
  signInWithGoogle: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Let onAuthStateChange own the loading state entirely.
    //
    // WHY THIS FIXES THE REDIRECT BUG:
    // After Google OAuth, the browser lands back on your app with a token
    // fragment in the URL (#access_token=...). Supabase parses this and fires
    // onAuthStateChange with SIGNED_IN. But if we call setLoading(false) inside
    // getSession().then() first, the route guard briefly sees
    // { user: null, loading: false } and redirects back to /auth before the
    // SIGNED_IN event arrives.
    //
    // Moving setLoading(false) into onAuthStateChange guarantees it only fires
    // after Supabase has fully resolved the session — whether from a stored
    // token, a password sign-in, or an OAuth redirect callback.
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(
    //   (_event, session) => {
    //     setUser(session?.user ?? null);
    //     if (session?.user) fetchProfile(session.user.id);
    //     else setProfile(null);
    //     setLoading(false); // ← moved here from getSession().then()
    //   },
    // );
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('🔐 Auth event:', _event, '| User:', session?.user?.email ?? 'null');
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

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
        // After Google redirects back, Supabase lands the user here.
        // Change to your production URL when deploying.
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // Note: execution stops here — the browser navigates away to Google.
    // The session is handled by onAuthStateChange once the user returns.
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
