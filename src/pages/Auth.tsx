// import { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import bgImage from '../assets/airport-dark-bg.webp';

// type Mode = 'signin' | 'signup';

// // ─── Google SVG icon ──────────────────────────────────────────────────────────

// function GoogleIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
//       <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
//       <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
//       <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
//       <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
//     </svg>
//   );
// }

// // ─── Icon components ──────────────────────────────────────────────────────────

// function IconUser() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
//       <circle cx="12" cy="7" r="4"/>
//     </svg>
//   );
// }

// function IconMail() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <rect x="2" y="4" width="20" height="16" rx="2"/>
//       <path d="m2 7 10 7 10-7"/>
//     </svg>
//   );
// }

// function IconLock() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <rect x="3" y="11" width="18" height="11" rx="2"/>
//       <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
//     </svg>
//   );
// }

// function IconEye() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//       <circle cx="12" cy="12" r="3"/>
//     </svg>
//   );
// }

// function IconEyeOff() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
//       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
//       <line x1="1" y1="1" x2="23" y2="23"/>
//     </svg>
//   );
// }

// // ─── Shared input class ───────────────────────────────────────────────────────

// const inputCls =
//   'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
//   'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
//   'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
//   'focus:ring-2 focus:ring-blue-500/10';

// // ─── Component ───────────────────────────────────────────────────────────────

// export default function Auth() {
//   const { signIn, signUp, signInWithGoogle } = useAuth();
//   const navigate = useNavigate();

//   const [mode, setMode]         = useState<Mode>('signin');
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName]         = useState('');
//   const [error, setError]       = useState('');
//   const [loading, setLoading]   = useState(false);
//   const [showPass, setShowPass] = useState(false);

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       if (mode === 'signin') await signIn(email, password);
//       else await signUp(email, password, name);
//       navigate('/catalog');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleGoogle() {
//     setError('');
//     setLoading(true);
//     try {
//       await signInWithGoogle();
//       navigate('/catalog');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Google sign-in failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     /* ── Root: full-bleed background image ───────────────────────────────── */
//     <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

//           {/* Background image */}
//        <div className="fixed inset-0 z-0 overflow-hidden brightness-50">
//       <img
//         src={bgImage}
//         alt=""
//         className="w-full h-full object-cover"
//       />
//     </div>
        
      

//       {/* Vignette */}
//       <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

//       {/* Card */}
//       <div className="relative z-[2] w-full max-w-[420px]">

//         {/* ── Logo ── */}
//         <div className="text-center mb-7">
//           <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-xl mx-auto mb-3.5 shadow-[0_8px_32px_rgba(37,99,235,0.4)]">
//             🗄
//           </div>
//           <h1 className="text-[30px] font-semibold text-white tracking-tight drop-shadow-lg mb-1 font-serif">
//             Pelsung Portal
//           </h1>
//           <p className="text-[13px] text-white/60 font-light tracking-wide">
//             Secure file repository &amp; collaboration
//           </p>
//         </div>

//         {/* ── Panel ── */}
//         <div className="bg-white/95 backdrop-blur-sm rounded-[18px] px-8 pt-7 pb-7 shadow-[0_32px_64px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)]">

//           {/* Tabs */}
//           <div className="flex border-b border-slate-200 mb-6">
//             {([['signin', 'Sign In'], ['signup', 'Create Account']] as const).map(([v, l]) => (
//               <button
//                 key={v}
//                 type="button"
//                 onClick={() => { setMode(v); setError(''); }}
//                 className={[
//                   'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
//                   'transition-all duration-200 -mb-px border-b-2',
//                   mode === v
//                     ? 'text-slate-900 border-blue-600'
//                     : 'text-slate-400 border-transparent hover:text-slate-600',
//                 ].join(' ')}
//               >
//                 {l}
//               </button>
//             ))}
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="flex flex-col gap-4">

//             {/* Full name — signup only */}
//             {mode === 'signup' && (
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                   Full Name
//                 </label>
//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                     <IconUser />
//                   </span>
//                   <input
//                     className={inputCls}
//                     placeholder="Karma Wangdi"
//                     value={name}
//                     onChange={e => setName(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Email */}
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                 Email
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                   <IconMail />
//                 </span>
//                 <input
//                   className={inputCls}
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={e => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                 Password
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                   <IconLock />
//                 </span>
//                 <input
//                   className={`${inputCls} pr-10`}
//                   type={showPass ? 'text' : 'password'}
//                   placeholder="••••••••••"
//                   value={password}
//                   onChange={e => setPassword(e.target.value)}
//                   required
//                   minLength={6}
//                 />
//                 <button
//                   type="button"
//                   tabIndex={-1}
//                   aria-label={showPass ? 'Hide password' : 'Show password'}
//                   onClick={() => setShowPass(p => !p)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0"
//                 >
//                   {showPass ? <IconEyeOff /> : <IconEye />}
//                 </button>
//               </div>
//               {mode === 'signin' && (
//                 <div className="text-right">
//                   <a href="#" className="text-[12px] text-blue-600 hover:underline">
//                     Forgot Password?
//                   </a>
//                 </div>
//               )}
//             </div>

//             {/* Error */}
//             {error && (
//               <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
//                 {error}
//               </div>
//             )}

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 tracking-wide cursor-pointer border-0"
//             >
//               {loading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Create Account'}
//             </button>

//           </form>

//           {/* Divider */}
//           <div className="flex items-center gap-3 my-4">
//             <span className="flex-1 h-px bg-slate-200" />
//             <span className="text-xs text-slate-400">or</span>
//             <span className="flex-1 h-px bg-slate-200" />
//           </div>

//           {/* Google */}
//           <button
//             type="button"
//             disabled={loading}
//             onClick={handleGoogle}
//             className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
//           >
//             <GoogleIcon />
//             Continue with Google
//           </button>

//           {/* Support */}
//           <p className="text-center text-[12px] text-slate-400 mt-5">
//             Need help?{' '}
//             <a href="mailto:support@pelsung.com" className="text-blue-600 hover:underline">
//               Contact support
//             </a>
//           </p>

//         </div>

//         {/* Footer */}
//         <p className="text-center text-[11px] text-white/40 mt-5 tracking-widest uppercase">
//           FileVault · Secure · Private · Organized
//         </p>

//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/airport-dark-bg.webp';

type Mode = 'signin' | 'signup';

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

const inputCls =
  'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
  'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
  'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
  'focus:ring-2 focus:ring-blue-500/10';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth(); // ← added user, loading
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();                  // ← added

  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [formLoading, setFormLoading] = useState(false);                 // ← renamed to avoid clash
  const [showPass, setShowPass] = useState(false);

  // ── If already signed in, redirect instantly ─────────────────────────────
  useEffect(() => {
    if (!loading && user) {
      startTransition(() => navigate('/catalog'));
    }
  }, [user, loading]);

  // ── Don't render the form while Supabase is rehydrating the session ──────
  if (loading || isPending) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, name);
      startTransition(() => navigate('/catalog'));                        // ← wrapped
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setFormLoading(true);
    try {
      await signInWithGoogle();
      startTransition(() => navigate('/catalog'));                        // ← wrapped
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

      {/* Background image */}
      <div className="fixed inset-0 z-0 overflow-hidden brightness-50">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Vignette */}
      <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      {/* Card */}
      <div className="relative z-[2] w-full max-w-[420px]">

        {/* ── Logo ── */}
        <div className="text-center mb-7">
          <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-xl mx-auto mb-3.5 shadow-[0_8px_32px_rgba(37,99,235,0.4)]">
            🗄
          </div>
          <h1 className="text-[30px] font-semibold text-white tracking-tight drop-shadow-lg mb-1 font-serif">
            Pelsung Portal
          </h1>
          <p className="text-[13px] text-white/60 font-light tracking-wide">
            Secure file repository &amp; collaboration
          </p>
        </div>

        {/* ── Panel ── */}
        <div className="bg-white/95 backdrop-blur-sm rounded-[18px] px-8 pt-7 pb-7 shadow-[0_32px_64px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)]">

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            {([['signin', 'Sign In'], ['signup', 'Create Account']] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => { setMode(v); setError(''); }}
                className={[
                  'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
                  'transition-all duration-200 -mb-px border-b-2',
                  mode === v
                    ? 'text-slate-900 border-blue-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
                    <IconUser />
                  </span>
                  <input
                    className={inputCls}
                    placeholder="Karma Wangdi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
                  <IconMail />
                </span>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
                  <IconLock />
                </span>
                <input
                  className={`${inputCls} pr-10`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0"
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {mode === 'signin' && (
                <div className="text-right">
                  <a href="#" className="text-[12px] text-blue-600 hover:underline">
                    Forgot Password?
                  </a>
                </div>
              )}
            </div>

            {error && (
              <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 tracking-wide cursor-pointer border-0"
            >
              {formLoading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Create Account'}
            </button>

          </form>

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            disabled={formLoading}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-[12px] text-slate-400 mt-5">
            Need help?{' '}
            <a href="mailto:support@pelsung.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>

        </div>

        <p className="text-center text-[11px] text-white/40 mt-5 tracking-widest uppercase">
          FileVault · Secure · Private · Organized
        </p>

      </div>
    </div>
  );
}