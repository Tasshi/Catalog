import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────────

type Mode = 'signin' | 'signup';

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  // Page
  page:       'min-h-screen flex items-center justify-center p-4 bg-[var(--navy)]',
  bgFixed:    'fixed inset-0 pointer-events-none overflow-hidden',
  bgBlobTR:   'absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 bg-[radial-gradient(circle,var(--blue),transparent)]',
  bgBlobBL:   'absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 bg-[radial-gradient(circle,var(--cyan),transparent)]',

  // Card
  card:       'w-full max-w-sm relative animate-slideUp',

  // Logo block
  logoWrap:   'text-center mb-8',
  logoIcon:   'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 bg-[linear-gradient(135deg,var(--blue),var(--cyan))]',
  logoTitle:  'font-serif text-3xl mb-1 text-[var(--text)]',
  logoSub:    'text-sm text-[var(--text3)]',

  // Panel
  panel:      'rounded-xl p-6 bg-[var(--navy2)] border border-[var(--border2)]',

  // Tabs
  tabBar:     'flex mb-5 border-b border-[var(--border)]',
  // Active / inactive tab styles — applied via helper below
  tabBase:    'pb-2.5 px-1 mr-5 text-sm font-medium transition-all bg-transparent border-0 cursor-pointer -mb-px',
  tabActive:  'text-[var(--cyan)] border-b-2 border-[var(--cyan)]',
  tabInactive:'text-[var(--text3)] border-b-2 border-transparent',

  // Form
  form:       'flex flex-col gap-3.5',
  fieldWrap:  '',
  label:      'form-label block mb-1.5',
  input:      'form-input',

  // Error banner
  error:      'text-xs px-3 py-2 rounded-lg bg-[rgba(229,62,62,0.1)] text-[#fc8181] border border-[rgba(229,62,62,0.2)]',

  // Primary submit button
  submitBtn:  [
    'w-full py-2.5 rounded-lg text-sm font-medium text-white mt-1 transition-all',
    'bg-[linear-gradient(135deg,var(--blue),var(--blue2))]',
    'disabled:opacity-70',
  ].join(' '),

  // Divider
  dividerWrap:'flex items-center gap-3 my-1',
  dividerLine:'flex-1 h-px bg-[var(--border)]',
  dividerText:'text-xs text-[var(--text3)]',

  // Google button
  googleBtn:  [
    'w-full flex items-center justify-center gap-2.5',
    'py-2.5 rounded-lg text-sm font-medium transition-all',
    'bg-white text-slate-700 border border-slate-200',
    'hover:bg-slate-50 active:bg-slate-100',
    'disabled:opacity-70',
  ].join(' '),

  // Footer
  footer:     'text-center text-xs mt-4 text-[var(--text3)]',
} as const;

// ─── Helper ──────────────────────────────────────────────────────────────────────

function tabClass(active: boolean) {
  return `${styles.tabBase} ${active ? styles.tabActive : styles.tabInactive}`;
}

// ─── Google SVG icon (no external dependency needed) ────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────────

export default function Auth() {
  // Bug fix: typed useAuth to include signInWithGoogle
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Bug fix: mode typed as Mode union instead of plain string
  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // Bug fix: typed the event parameter; renamed catch variable from `e` to `err`
  // to avoid shadowing the outer FormEvent `e`.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, name);
      navigate('/');
    } catch (err) {
      // Bug fix: err is unknown in strict TS — narrow before accessing .message
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      // Calls signInWithGoogle() from AuthContext (wraps Firebase signInWithPopup
      // or equivalent). Add it to your AuthContext if not already present:
      //
      //   import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
      //   async function signInWithGoogle() {
      //     const provider = new GoogleAuthProvider();
      //     await signInWithPopup(auth, provider);
      //   }
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Background blobs */}
      <div className={styles.bgFixed}>
        <div className={styles.bgBlobTR} />
        <div className={styles.bgBlobBL} />
      </div>

      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>🗄</div>
          <h1 className={styles.logoTitle}>Pelsung Portal</h1>
          <p className={styles.logoSub}>Secure file repository &amp; collaboration</p>
        </div>

        <div className={styles.panel}>

          {/* Tabs */}
          {/*
            Bug fix 1: duplicate `border` / `borderBottom` keys in the style
            object — the second borderBottom silently overwrote `border: none`,
            leaving the default browser button border visible. Replaced with
            Tailwind classes that compose without conflict.

            Bug fix 2: added type="button" so clicking a tab inside the <form>
            does NOT trigger form submission.
          */}
          <div className={styles.tabBar}>
            {([['signin', 'Sign In'], ['signup', 'Create Account']] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={tabClass(mode === v)}
              >
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>

            {mode === 'signup' && (
              <div className={styles.fieldWrap}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.input}
                  placeholder="Karma Wangdi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.fieldWrap}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldWrap}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

          </form>

          {/* Divider */}
          <div className={styles.dividerWrap}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className={styles.googleBtn}
          >
            <GoogleIcon />
            Continue with Google
          </button>

        </div>

        <p className={styles.footer}>FileVault · Secure · Private · Organized</p>

      </div>
    </div>
  );
}
