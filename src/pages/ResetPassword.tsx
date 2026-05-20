import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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

// ── Password rules ────────────────────────────────────────────────────────────

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'At least 8 characters',       test: v => v.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: v => /[A-Z]/.test(v) },
  { label: 'One special character (!@#…)', test: v => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v) },
];

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const score  = RULES.filter(r => r.test(password)).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <span className={`text-[11px] font-medium ${
        score === 3 ? 'text-green-600' :
        score === 2 ? 'text-yellow-600' :
        score === 1 ? 'text-orange-500' : 'text-red-500'
      }`}>
        {labels[score]}
      </span>
    </div>
  );
}

function RuleChecklist({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {RULES.map(rule => {
        const pass = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${pass ? 'text-green-600' : 'text-slate-400'}`}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              {pass ? (
                <>
                  <circle cx="6" cy="6" r="6" fill="#22c55e"/>
                  <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <circle cx="6" cy="6" r="5.5" stroke="#cbd5e1"/>
              )}
            </svg>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

const inputCls =
  'w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
  'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
  'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
  'focus:ring-2 focus:ring-blue-500/10';

// ── Component ─────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'ready' | 'expired' | 'done';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [pageState, setPageState]   = useState<PageState>('loading');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type         = params.get('type');
    const errorCode    = params.get('error_code');

    if (errorCode) {
      setPageState('expired');
      return;
    }

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) { console.error('setSession error:', error); setPageState('expired'); }
          else        setPageState('ready');
        });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setPageState(session ? 'ready' : 'expired');
      });
    }
  }, []);

  function validate(): string {
    for (const rule of RULES) {
      if (!rule.test(password)) return `Password must include: ${rule.label.toLowerCase()}.`;
    }
    if (password !== confirm) return "Passwords don't match.";
    return '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');
    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
    } else {
      await supabase.auth.signOut();
      setPageState('done');
      setTimeout(() => navigate('/auth'), 3000);
    }
  }

  const allRulesPass   = RULES.every(r => r.test(password));
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit      = allRulesPass && passwordsMatch && !submitting;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-2">Link expired</h2>
          <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
            This password reset link is invalid or has already been used.
            Request a new one from the sign-in page.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all cursor-pointer border-0"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (pageState === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-2">Password updated!</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Your password has been changed successfully. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  // ── Reset form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-7">
          <div className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-xl mx-auto mb-3 shadow-[0_8px_32px_rgba(37,99,235,0.3)]">
            🗄
          </div>
          <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight mb-1 font-serif">
            Pelsung Portal
          </h1>
        </div>

        <div className="bg-white rounded-[18px] px-8 pt-7 pb-8 shadow-[0_8px_40px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.04)]">
          <h2 className="text-[17px] font-semibold text-slate-800 mb-1">Create new password</h2>
          <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
            Must be at least <strong>8 characters</strong>, include one <strong>uppercase letter</strong> and one <strong>special character</strong>.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
                  <IconLock />
                </span>
                <input
                  className={inputCls}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex bg-transparent border-0 cursor-pointer p-0"
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <StrengthBar password={password} />
              <RuleChecklist password={password} />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
                  <IconLock />
                </span>
                <input
                  className={inputCls}
                  type={showConf ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConf(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex bg-transparent border-0 cursor-pointer p-0"
                >
                  {showConf ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className={`text-[11.5px] ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {error && (
              <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            {/* ── Cancel + Save buttons ── */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 hover:-translate-y-px hover:shadow-lg transition-all duration-200 cursor-pointer border-0"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none tracking-wide cursor-pointer border-0"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}