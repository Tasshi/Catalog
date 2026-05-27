import { useState, useTransition, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bgImage from '../assets/gelephu-bg.jpg';
import logoImage from '../assets/Logo.png';

type Mode = 'signin' | 'signup' | 'forgot';

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

function IconUser() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.1 6.1l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const btnCls =
  'w-full py-3 rounded-xl text-sm font-bold text-white tracking-wide cursor-pointer ' +
  'transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ' +
  'bg-[#054159] ' +
  'hover:bg-[#0a5c6f] ' +
  'active:bg-[#043347] ' +
  'hover:-translate-y-px ' +
  '[border:2px_solid_rgba(255,255,255,0.5)] ' +
  'hover:[border-color:rgba(255,255,255,0.85)] ' +
  'shadow-[0_4px_18px_rgba(5,65,89,0.35)] ' +
  'hover:shadow-[0_8px_28px_rgba(5,65,89,0.45)]';

const inputCls =
  'w-full pl-9 pr-4 py-2.5 rounded-xl ' +
  'text-white text-sm placeholder:text-white/45 outline-none ' +
  'transition-all duration-200 ' +
  '[border:2px_solid_rgba(255,255,255,0.45)] [background:rgba(255,255,255,0.12)] ' +
  'focus:[border-color:rgba(255,255,255,0.9)] focus:[background:rgba(255,255,255,0.18)] ' +
  'focus:[box-shadow:0_0_0_3px_rgba(255,255,255,0.15),0_0_10px_rgba(255,255,255,0.15)]';

const REMEMBER_KEY = 'pelsung_remembered_email';

interface PasswordRule {
  label: string;
  test:  (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',       test: pw => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: pw => /[A-Z]/.test(pw) },
  { label: 'One number (0–9)',             test: pw => /[0-9]/.test(pw) },
  { label: 'One special character (!@#…)', test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

function validatePassword(pw: string): string | null {
  if (!PASSWORD_RULES[0].test(pw)) return 'Password must be at least 8 characters.';
  if (!PASSWORD_RULES[1].test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!PASSWORD_RULES[2].test(pw)) return 'Password must contain at least one number.';
  if (!PASSWORD_RULES[3].test(pw)) return 'Password must contain at least one special character.';
  return null;
}

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Something went wrong');
  const code = (err as { code?: string }).code ?? '';
  const msg  = raw.toLowerCase();

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed'))
    return 'Please confirm your email before signing in.';
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('already exists'))
    return 'An account with this email already exists.';
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return 'Incorrect email or password.';
  if (msg.includes('password should be at least'))
    return 'Password must be at least 8 characters.';
  return raw;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const color  = colors[passed - 1] ?? '#e2e8f0';
  const label  = labels[passed - 1] ?? '';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < passed ? color : '#e2e8f0',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PASSWORD_RULES.map((rule, i) => {
          const ok = rule.test(password);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                background: ok ? '#22c55e' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}>
                {ok && <IconCheck />}
              </div>
              <span style={{ fontSize: 11.5, color: ok ? '#4ade80' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
      {password.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 6, textAlign: 'right', transition: 'color 0.25s' }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, resendConfirmationEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode]                   = useState<Mode>('signin');
  const [email, setEmail]                 = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword]           = useState('');
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [error, setError]                 = useState('');
  const [formLoading, setFormLoading]     = useState(false);
  const [showPass, setShowPass]           = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [rememberMe, setRememberMe]       = useState(() => !!localStorage.getItem(REMEMBER_KEY));

  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]     = useState('');

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent]       = useState(false);
  const [showConfirmHint, setShowConfirmHint] = useState(false);

  // ── KEY FIX: Listen for PASSWORD_RECOVERY event ──────────────────────────
  // When the user clicks the reset link in Gmail, it opens a NEW tab.
  // Supabase broadcasts the PASSWORD_RECOVERY auth event to ALL open tabs
  // of your app. This listener catches it in the ORIGINAL tab and navigates
  // it to /reset-password — so the user can work in the tab they were
  // already using, and the new tab becomes irrelevant.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleResend() {
    if (!email || resendLoading) return;
    setResendLoading(true);
    try {
      await resendConfirmationEmail(email);
      setResendSent(true);
    } catch {
      // silently ignore — Supabase may throttle, that's fine
    } finally {
      setResendLoading(false);
    }
  }

  // Redirect if already logged in
  if (!loading && !isPending && user) {
    startTransition(() => navigate('/catalog'));
    return null;
  }
  if (loading || isPending) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      const pwErr = validatePassword(password);
      if (pwErr) { setError(pwErr); return; }
    }

    setFormLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
        else            localStorage.removeItem(REMEMBER_KEY);
        startTransition(() => navigate('/catalog'));
      } else {
        const { needsConfirmation } = await signUp(email, password, name, phone || undefined);
        setName('');
        setPassword('');
        setPhone('');
        if (needsConfirmation) {
          setSignupSuccess(true);
          setMode('signin');
        } else {
          startTransition(() => navigate('/catalog'));
        }
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      const msg  = (err instanceof Error ? err.message : '').toLowerCase();
      const isCredentialError = code === 'invalid_credentials' || msg.includes('invalid login credentials');
      if (mode === 'signin' && isCredentialError) {
        setShowConfirmHint(true);
        setError('Incorrect email or password. If you have a new account, confirm your email first.');
      } else {
        setShowConfirmHint(false);
        setError(friendlyError(err));
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setFormLoading(true);
    try {
      await signInWithGoogle();
      startTransition(() => navigate('/catalog'));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(friendlyError(err));
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgot() {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError('');
    setMode('forgot');
  }

  function backToSignIn() {
    setMode('signin');
    setForgotSent(false);
    setForgotError('');
    setError('');
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setSignupSuccess(false);
    setShowConfirmHint(false);
    setResendSent(false);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

      {/* Cinematic keyframes */}
      {/* Background — static */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.85) saturate(1.35) sepia(0.1) contrast(1.05)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 58%, rgba(255,160,50,0.22) 0%, rgba(200,100,10,0.1) 45%, transparent 70%)',
          opacity: 0.85,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 25%, rgba(0,0,0,0.38) 70%, rgba(0,0,0,0.65) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,5,20,0.38) 0%, transparent 28%, transparent 72%, rgba(5,2,10,0.42) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(108deg, transparent 25%, rgba(255,185,70,0.05) 50%, transparent 72%)',
        }} />
      </div>

      <div className="relative z-[2] w-full max-w-[440px]">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-[80px] h-[80px] rounded-full mx-auto mb-3.5 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_3px_rgba(255,255,255,0.25)]">
            <img src={logoImage} alt="Pelsung Portal" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[30px] font-semibold text-white tracking-tight drop-shadow-lg mb-1 font-serif">
            Pelsung Portal
          </h1>
          <p className="text-[13px] text-white/55 font-light tracking-wide">
            Secure file repository &amp; collaboration
          </p>
        </div>

        {/* Card */}
        <div
          className="backdrop-blur-2xl rounded-[22px] px-8 pt-7 pb-7"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,240,210,0.14) 100%)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' ? (
            <div>
              <button type="button" onClick={backToSignIn}
                className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white/80 transition-colors mb-5 bg-transparent border-0 cursor-pointer p-0">
                <IconArrowLeft /> Back to Sign In
              </button>

              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-green-400/12 border border-green-400/25 flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" fill="none" stroke="#4ade80" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m2 7 10 7 10-7"/>
                      <path stroke="#4ade80" strokeWidth="2.2" d="M8 12.5l2.5 2.5 5-5"/>
                    </svg>
                  </div>
                  <h2 className="text-[17px] font-semibold text-white mb-2">Check your inbox</h2>
                  <p className="text-[13px] text-white/50 leading-relaxed mb-6">
                    A password reset link was sent to{' '}
                    <span className="font-medium text-white/80">{forgotEmail}</span>.
                    {' '}Click the link in the email and this tab will automatically open the reset form.
                  </p>
                  <button type="button" onClick={backToSignIn} className={btnCls}>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-[17px] font-semibold text-white mb-1">Forgot password?</h2>
                  <p className="text-[12.5px] text-white/50 mb-5 leading-relaxed">
                    Enter your account email and we'll send you a reset link.
                    Keep this tab open — clicking the link in your email will bring the reset form right here.
                  </p>
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-white/55 uppercase tracking-wide">Email</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex"><IconMail /></span>
                        <input className={inputCls} type="email" placeholder="you@example.com"
                          value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus />
                      </div>
                    </div>
                    {forgotError && (
                      <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-500/12 text-red-300 border border-red-400/25">{forgotError}</div>
                    )}
                    <button type="submit" disabled={forgotLoading} className={btnCls}>
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
            </div>

          ) : (
            <>
              {/* ── TABS ── */}
              <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
                {([['signin', 'Sign In'], ['signup', 'Create Account']] as [Mode, string][]).map(([v, l]) => (
                  <button key={v} type="button"
                    onClick={() => switchMode(v as Mode)}
                    className={[
                      'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
                      'transition-all duration-200 -mb-px border-b-2',
                      mode === v
                        ? 'text-white border-amber-400'
                        : 'text-white/40 border-transparent hover:text-white/70',
                    ].join(' ')}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Dynamic status banner */}
              {signupSuccess && mode === 'signin' && (
                <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-green-400/10 text-green-300 border border-green-400/25 mb-4">
                  ✓ Account created! Please check your email to confirm, then sign in.
                  <div className="mt-1.5">
                    {resendSent ? (
                      <span className="text-green-600 font-medium">Confirmation email resent!</span>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={resendLoading}
                        className="text-green-700 underline underline-offset-2 bg-transparent border-0 cursor-pointer p-0 disabled:opacity-50">
                        {resendLoading ? 'Sending…' : "Didn't receive it? Resend email"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* ── SIGNUP-ONLY FIELDS ── */}
                {mode === 'signup' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-white/55 uppercase tracking-wide">Full Name</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex"><IconUser /></span>
                        <input className={inputCls} placeholder="Karma Wangdi"
                          value={name} onChange={e => setName(e.target.value)} required autoFocus />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-white/55 uppercase tracking-wide flex items-center gap-1.5">
                        Phone Number
                        <span className="text-[10px] font-normal text-white/35 normal-case bg-white/10 px-1.5 py-0.5 rounded-md">Optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex"><IconPhone /></span>
                        <input className={inputCls} type="tel" placeholder="+975 17 123 456"
                          value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <p className="text-[11px] text-white/35 pl-0.5">
                        Used for account recovery only. We never share your number.
                      </p>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-white/55 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex"><IconMail /></span>
                    <input className={inputCls} type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-white/55 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex"><IconLock /></span>
                    <input
                      className={`${inputCls} pr-10`}
                      type={showPass ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Min 8 · uppercase · number · special' : '••••••••••'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onCopy={e => e.preventDefault()}
                      onCut={e => e.preventDefault()}
                      required
                      minLength={mode === 'signup' ? 8 : 1}
                    />
                    <button type="button" tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0">
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {mode === 'signup' && <PasswordStrength password={password} />}

                  {mode === 'signin' && (
                    <div className="flex items-center justify-between mt-1">
                      <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none group">
                        <input id="remember-me" type="checkbox" checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)} className="sr-only" />
                        <div className={[
                          'w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center pointer-events-none flex-shrink-0',
                          rememberMe ? 'bg-amber-500 border-amber-500' : 'bg-white/8 border-white/25 group-hover:border-white/45',
                        ].join(' ')}>
                          {rememberMe && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-[12px] text-white/50 group-hover:text-white/75 transition-colors">Remember me</span>
                      </label>
                      <button type="button" onClick={openForgot}
                        className="text-[12px] text-amber-400 hover:text-amber-300 hover:underline bg-transparent border-0 cursor-pointer p-0 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-500/12 text-red-300 border border-red-400/25">
                    {error}
                    {showConfirmHint && email && (
                      <div className="mt-1.5">
                        {resendSent ? (
                          <span className="text-green-400 font-medium">Confirmation email sent! Check your inbox.</span>
                        ) : (
                          <button type="button" onClick={handleResend} disabled={resendLoading}
                            className="underline underline-offset-2 bg-transparent border-0 cursor-pointer p-0 text-red-300 hover:text-red-200 disabled:opacity-50">
                            {resendLoading ? 'Sending…' : 'Resend confirmation email'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={formLoading} className={`${btnCls} mt-1`}>
                  {formLoading
                    ? 'Please wait…'
                    : mode === 'signin' ? 'Login' : 'Create Account'}
                </button>

              </form>

              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-px bg-white/30" />
                <span className="text-xs text-white/60">or</span>
                <span className="flex-1 h-px bg-white/30" />
              </div>

              <button type="button" disabled={formLoading} onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  color: '#374151',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.98)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15), 0 0 10px rgba(255,255,255,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.88)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="text-center text-[12px] text-white/35 mt-5">
                Need help?{' '}
                <a href="mailto:support@pelsung.com" className="text-amber-400 hover:text-amber-300 hover:underline">Contact support</a>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-[11px] mt-5 tracking-widest uppercase text-white/40">
          FileVault · Secure · Private · Organized
        </p>
      </div>
    </div>
  );
}