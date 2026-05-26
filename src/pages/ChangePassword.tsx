import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const rules: Rule[] = [
  { label: 'At least 8 characters',  test: v => v.length >= 8 },
  { label: 'One uppercase letter',   test: v => /[A-Z]/.test(v) },
  { label: 'One number',             test: v => /[0-9]/.test(v) },
  { label: 'One special character',  test: v => /[^A-Za-z0-9]/.test(v) },
];

export default function ChangePassword() {
  const navigate = useNavigate();

  const [current,     setCurrent]     = useState('');
  const [next,        setNext]        = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext,    setShowNext]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const passed      = rules.filter(r => r.test(next));
  const strength    = passed.length;
  const allRulesMet = strength === rules.length;
  const matches     = next !== '' && next === confirm;
  const canSubmit   = current !== '' && allRulesMet && matches && !loading;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user session found.');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate(-1), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <Header title="Change Password" />
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-900">Password updated</h2>
              <p className="text-sm text-slate-500 mt-1">You'll be redirected shortly.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Change Password" />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 flex items-start justify-center">
        <div className="w-full max-w-md">

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

            {/* Card header */}
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <KeyRound size={17} strokeWidth={1.5} style={{ color: '#EB5800' }} />
              </div>
              <div>
                <h1 className="text-base font-medium text-slate-900 leading-5">Change your password</h1>
                <p className="text-xs text-slate-400 mt-0.5">Choose a strong password you haven't used before.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

              <Field
                label="Current password"
                value={current}
                onChange={setCurrent}
                show={showCurrent}
                toggleShow={() => setShowCurrent(p => !p)}
                placeholder="Enter current password"
              />

              <div className="border-t border-slate-100 -mx-6" />

              <Field
                label="New password"
                value={next}
                onChange={setNext}
                show={showNext}
                toggleShow={() => setShowNext(p => !p)}
                placeholder="Enter new password"
              />

              {next.length > 0 && (
                <div className="-mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {rules.map(rule => {
                      const ok = rule.test(next);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {ok
                            ? <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                            : <XCircle     size={12} className="text-slate-300 flex-shrink-0" />
                          }
                          <span className={`text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Field
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                show={showConfirm}
                toggleShow={() => setShowConfirm(p => !p)}
                placeholder="Re-enter new password"
                status={confirm.length > 0 ? (matches ? 'match' : 'mismatch') : undefined}
              />

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={canSubmit ? { background: '#EB5800' } : undefined}
                className={`w-full py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-all duration-150 ${
                  canSubmit
                    ? 'text-white hover:opacity-90 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#CC4D00'; }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#EB5800'; }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ── Reusable password field ── */
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
  placeholder: string;
  status?: 'match' | 'mismatch';
}

function Field({ label, value, onChange, show, toggleShow, placeholder, status }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div
        className="flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-150 focus-within:border-[#EB5800]"
        style={{
          borderColor:
            status === 'match'    ? '#22c55e' :
            status === 'mismatch' ? '#ef4444' :
            '#e2e8f0',
          background: '#fff',
        }}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onCopy={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          placeholder={placeholder}
          className="flex-1 text-sm text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 flex items-center transition-colors duration-150"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
        </button>
        {status === 'match'    && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
        {status === 'mismatch' && <XCircle      size={14} className="text-red-400 flex-shrink-0" />}
      </div>
      {status === 'mismatch' && <p className="text-xs text-red-400">Passwords do not match</p>}
      {status === 'match'    && <p className="text-xs text-green-500">Passwords match</p>}
    </div>
  );
}