// import { useState, useEffect, useTransition } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import bgImage from '../assets/airport-dark-bg.webp';

// type Mode = 'signin' | 'signup' | 'forgot';

// // ── Icons ─────────────────────────────────────────────────────────────────────

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

// function IconArrowLeft() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <path d="M19 12H5M12 5l-7 7 7 7"/>
//     </svg>
//   );
// }

// // ── Shared styles ─────────────────────────────────────────────────────────────

// const inputCls =
//   'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
//   'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
//   'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
//   'focus:ring-2 focus:ring-blue-500/10';

// const REMEMBER_KEY = 'pelsung_remembered_email';

// // ── Component ─────────────────────────────────────────────────────────────────

// export default function Auth() {
//   const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
//   const navigate = useNavigate();
//   const [isPending, startTransition] = useTransition();

//   // ── Core form state ────────────────────────────────────────────────────────
//   const [mode, setMode]               = useState<Mode>('signin');
//   const [email, setEmail]             = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
//   const [password, setPassword]       = useState('');
//   const [name, setName]               = useState('');
//   const [error, setError]             = useState('');
//   const [formLoading, setFormLoading] = useState(false);
//   const [showPass, setShowPass]       = useState(false);

//   // ── Remember Me ────────────────────────────────────────────────────────────
//   const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));

//   // ── Forgot Password state ──────────────────────────────────────────────────
//   const [forgotEmail, setForgotEmail]     = useState('');
//   const [forgotSent, setForgotSent]       = useState(false);
//   const [forgotLoading, setForgotLoading] = useState(false);
//   const [forgotError, setForgotError]     = useState('');

//   // ── Redirect if already logged in ─────────────────────────────────────────
//   useEffect(() => {
//     if (!loading && user) {
//       startTransition(() => navigate('/catalog'));
//     }
//   }, [user, loading]);

//   if (loading || isPending) return null;

//   // ── Handlers ───────────────────────────────────────────────────────────────

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setError('');
//     setFormLoading(true);
//     try {
//       if (mode === 'signin') {
//         await signIn(email, password);
//         if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
//         else            localStorage.removeItem(REMEMBER_KEY);
//       } else {
//         await signUp(email, password, name);
//       }
//       startTransition(() => navigate('/catalog'));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Something went wrong');
//     } finally {
//       setFormLoading(false);
//     }
//   }

//   async function handleGoogle() {
//     setError('');
//     setFormLoading(true);
//     try {
//       await signInWithGoogle();
//       startTransition(() => navigate('/catalog'));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Google sign-in failed');
//     } finally {
//       setFormLoading(false);
//     }
//   }

//   async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setForgotError('');
//     setForgotLoading(true);
//     try {
//       await resetPassword(forgotEmail);
//       setForgotSent(true);
//     } catch (err) {
//       setForgotError(err instanceof Error ? err.message : 'Failed to send reset email');
//     } finally {
//       setForgotLoading(false);
//     }
//   }

//   function openForgot() {
//     setForgotEmail(email);
//     setForgotSent(false);
//     setForgotError('');
//     setMode('forgot');
//   }

//   function backToSignIn() {
//     setMode('signin');
//     setForgotSent(false);
//     setForgotError('');
//     setError('');
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────

//   return (
//     <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

//       {/* Background */}
//       <div className="fixed inset-0 z-0 overflow-hidden brightness-50">
//         <img src={bgImage} alt="" className="w-full h-full object-cover" />
//       </div>
//       <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

//       {/* Card */}
//       <div className="relative z-[2] w-full max-w-[420px]">

//         {/* Logo */}
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

//         {/* Panel */}
//         <div className="bg-white/95 backdrop-blur-sm rounded-[18px] px-8 pt-7 pb-7 shadow-[0_32px_64px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)]">

//           {mode === 'forgot' ? (
//             <div>
//               <button
//                 type="button"
//                 onClick={backToSignIn}
//                 className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 transition-colors mb-5 bg-transparent border-0 cursor-pointer p-0"
//               >
//                 <IconArrowLeft />
//                 Back to Sign In
//               </button>

//               {forgotSent ? (
//                 <div className="text-center py-2">
//                   <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
//                     <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-green-500">
//                       <rect x="2" y="4" width="20" height="16" rx="2"/>
//                       <path d="m2 7 10 7 10-7"/>
//                       <path stroke="#22c55e" strokeWidth="2.2" d="M8 12.5l2.5 2.5 5-5"/>
//                     </svg>
//                   </div>
//                   <h2 className="text-[17px] font-semibold text-slate-800 mb-2">Check your inbox</h2>
//                   <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
//                     A password reset link was sent to{' '}
//                     <span className="font-medium text-slate-700">{forgotEmail}</span>.
//                     Check your spam folder if you don't see it within a minute.
//                   </p>
//                   <button
//                     type="button"
//                     onClick={backToSignIn}
//                     className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 cursor-pointer border-0"
//                   >
//                     Back to Sign In
//                   </button>
//                 </div>
//               ) : (
//                 <>
//                   <h2 className="text-[17px] font-semibold text-slate-800 mb-1">Forgot password?</h2>
//                   <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
//                     Enter your account email and we'll send you a reset link.
//                   </p>

//                   <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
//                     <div className="flex flex-col gap-1.5">
//                       <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                         Email
//                       </label>
//                       <div className="relative">
//                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                           <IconMail />
//                         </span>
//                         <input
//                           className={inputCls}
//                           type="email"
//                           placeholder="you@example.com"
//                           value={forgotEmail}
//                           onChange={e => setForgotEmail(e.target.value)}
//                           required
//                           autoFocus
//                         />
//                       </div>
//                     </div>

//                     {forgotError && (
//                       <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
//                         {forgotError}
//                       </div>
//                     )}

//                     <button
//                       type="submit"
//                       disabled={forgotLoading}
//                       className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed tracking-wide cursor-pointer border-0"
//                     >
//                       {forgotLoading ? 'Sending…' : 'Send Reset Link'}
//                     </button>
//                   </form>
//                 </>
//               )}
//             </div>

//           ) : (
//             <>
//               {/* Tabs */}
//               <div className="flex border-b border-slate-200 mb-6">
//                 {([['signin', 'Sign In'], ['signup', 'Create Account']] as [Mode, string][]).map(([v, l]) => (
//                   <button
//                     key={v}
//                     type="button"
//                     onClick={() => { setMode(v); setError(''); }}
//                     className={[
//                       'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
//                       'transition-all duration-200 -mb-px border-b-2',
//                       mode === v
//                         ? 'text-slate-900 border-blue-600'
//                         : 'text-slate-400 border-transparent hover:text-slate-600',
//                     ].join(' ')}
//                   >
//                     {l}
//                   </button>
//                 ))}
//               </div>

//               {/* Form */}
//               <form onSubmit={handleSubmit} className="flex flex-col gap-4">

//                 {mode === 'signup' && (
//                   <div className="flex flex-col gap-1.5">
//                     <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                       Full Name
//                     </label>
//                     <div className="relative">
//                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                         <IconUser />
//                       </span>
//                       <input
//                         className={inputCls}
//                         placeholder="Karma Wangdi"
//                         value={name}
//                         onChange={e => setName(e.target.value)}
//                         required
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                     Email
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                       <IconMail />
//                     </span>
//                     <input
//                       className={inputCls}
//                       type="email"
//                       placeholder="you@example.com"
//                       value={email}
//                       onChange={e => setEmail(e.target.value)}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                       <IconLock />
//                     </span>
//                     <input
//                       className={`${inputCls} pr-10`}
//                       type={showPass ? 'text' : 'password'}
//                       placeholder="••••••••••"
//                       value={password}
//                       onChange={e => setPassword(e.target.value)}
//                       required
//                       minLength={6}
//                     />
//                     <button
//                       type="button"
//                       tabIndex={-1}
//                       aria-label={showPass ? 'Hide password' : 'Show password'}
//                       onClick={() => setShowPass(p => !p)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0"
//                     >
//                       {showPass ? <IconEyeOff /> : <IconEye />}
//                     </button>
//                   </div>

//                   {mode === 'signin' && (
//                     <div className="flex items-center justify-between mt-1">
//                       <label className="flex items-center gap-2 cursor-pointer select-none group">
//                         <div className="relative flex-shrink-0">
//                           <input
//                             type="checkbox"
//                             checked={rememberMe}
//                             onChange={e => setRememberMe(e.target.checked)}
//                             className="sr-only"
//                           />
//                           <div
//                             onClick={() => setRememberMe(p => !p)}
//                             className={[
//                               'w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer',
//                               rememberMe
//                                 ? 'bg-blue-600 border-blue-600'
//                                 : 'bg-slate-50 border-slate-300 hover:border-slate-400',
//                             ].join(' ')}
//                           >
//                             {rememberMe && (
//                               <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
//                                 <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
//                               </svg>
//                             )}
//                           </div>
//                         </div>
//                         <span className="text-[12px] text-slate-500 group-hover:text-slate-700 transition-colors">
//                           Remember me
//                         </span>
//                       </label>

//                       <button
//                         type="button"
//                         onClick={openForgot}
//                         className="text-[12px] text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 cursor-pointer p-0 transition-colors"
//                       >
//                         Forgot password?
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {error && (
//                   <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
//                     {error}
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={formLoading}
//                   className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 tracking-wide cursor-pointer border-0"
//                 >
//                   {formLoading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Create Account'}
//                 </button>

//               </form>

//               <div className="flex items-center gap-3 my-4">
//                 <span className="flex-1 h-px bg-slate-200" />
//                 <span className="text-xs text-slate-400">or</span>
//                 <span className="flex-1 h-px bg-slate-200" />
//               </div>

//               <button
//                 type="button"
//                 disabled={formLoading}
//                 onClick={handleGoogle}
//                 className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
//               >
//                 <GoogleIcon />
//                 Continue with Google
//               </button>

//               <p className="text-center text-[12px] text-slate-400 mt-5">
//                 Need help?{' '}
//                 <a href="mailto:support@pelsung.com" className="text-blue-600 hover:underline">
//                   Contact support
//                 </a>
//               </p>
//             </>
//           )}

//         </div>

//         <p className="text-center text-[11px] text-white/40 mt-5 tracking-widest uppercase">
//           FileVault · Secure · Private · Organized
//         </p>

//       </div>
//     </div>
//   );
// }
// import { useState, useEffect, useTransition } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import bgImage from '../assets/airport-dark-bg.webp';

// type Mode = 'signin' | 'signup' | 'forgot';

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

// function IconArrowLeft() {
//   return (
//     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
//       <path d="M19 12H5M12 5l-7 7 7 7"/>
//     </svg>
//   );
// }

// const inputCls =
//   'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
//   'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
//   'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
//   'focus:ring-2 focus:ring-blue-500/10';

// const REMEMBER_KEY = 'pelsung_remembered_email';

// function friendlyError(raw: string): string {
//   const msg = raw.toLowerCase();
//   if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('already exists')) {
//     return 'User already exists!';
//   }
//   if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
//     return 'Incorrect email or password.';
//   }
//   if (msg.includes('email not confirmed')) {
//     return 'Please confirm your email before signing in.';
//   }
//   if (msg.includes('password should be at least')) {
//     return 'Password must be at least 6 characters.';
//   }
//   return raw;
// }

// export default function Auth() {
//   const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
//   const navigate = useNavigate();
//   const [isPending, startTransition] = useTransition();

//   const [mode, setMode]               = useState<Mode>('signin');
//   const [email, setEmail]             = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
//   const [password, setPassword]       = useState('');
//   const [name, setName]               = useState('');
//   const [error, setError]             = useState('');
//   const [formLoading, setFormLoading] = useState(false);
//   const [showPass, setShowPass]       = useState(false);
//   const [signupSuccess, setSignupSuccess] = useState(false);

//   const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));

//   const [forgotEmail, setForgotEmail]     = useState('');
//   const [forgotSent, setForgotSent]       = useState(false);
//   const [forgotLoading, setForgotLoading] = useState(false);
//   const [forgotError, setForgotError]     = useState('');

//   useEffect(() => {
//     if (!loading && user) {
//       startTransition(() => navigate('/catalog'));
//     }
//   }, [user, loading]);

//   if (loading || isPending) return null;

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setError('');
//     setFormLoading(true);
//     try {
//       if (mode === 'signin') {
//         await signIn(email, password);
//         if (rememberMe) localStorage.setItem(REMEMBER_KEY, email);
//         else            localStorage.removeItem(REMEMBER_KEY);
//         startTransition(() => navigate('/catalog'));
//       } else {
//         await signUp(email, password, name);
//         setName('');
//         setPassword('');
//         setSignupSuccess(true);
//         setMode('signin');
//       }
//     } catch (err) {
//       const raw = err instanceof Error ? err.message : 'Something went wrong';
//       setError(friendlyError(raw));
//     } finally {
//       setFormLoading(false);
//     }
//   }

//   async function handleGoogle() {
//     setError('');
//     setFormLoading(true);
//     try {
//       await signInWithGoogle();
//       startTransition(() => navigate('/catalog'));
//     } catch (err) {
//       const raw = err instanceof Error ? err.message : 'Google sign-in failed';
//       setError(friendlyError(raw));
//     } finally {
//       setFormLoading(false);
//     }
//   }

//   async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setForgotError('');
//     setForgotLoading(true);
//     try {
//       await resetPassword(forgotEmail);
//       setForgotSent(true);
//     } catch (err) {
//       const raw = err instanceof Error ? err.message : 'Failed to send reset email';
//       setForgotError(friendlyError(raw));
//     } finally {
//       setForgotLoading(false);
//     }
//   }

//   function openForgot() {
//     setForgotEmail(email);
//     setForgotSent(false);
//     setForgotError('');
//     setMode('forgot');
//   }

//   function backToSignIn() {
//     setMode('signin');
//     setForgotSent(false);
//     setForgotError('');
//     setError('');
//   }

//   return (
//     <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

//       <div className="fixed inset-0 z-0 overflow-hidden brightness-50">
//         <img src={bgImage} alt="" className="w-full h-full object-cover" />
//       </div>
//       <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

//       <div className="relative z-[2] w-full max-w-[420px]">

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

//         <div className="bg-white/95 backdrop-blur-sm rounded-[18px] px-8 pt-7 pb-7 shadow-[0_32px_64px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)]">

//           {mode === 'forgot' ? (
//             <div>
//               <button
//                 type="button"
//                 onClick={backToSignIn}
//                 className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 transition-colors mb-5 bg-transparent border-0 cursor-pointer p-0"
//               >
//                 <IconArrowLeft />
//                 Back to Sign In
//               </button>

//               {forgotSent ? (
//                 <div className="text-center py-2">
//                   <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
//                     <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-green-500">
//                       <rect x="2" y="4" width="20" height="16" rx="2"/>
//                       <path d="m2 7 10 7 10-7"/>
//                       <path stroke="#22c55e" strokeWidth="2.2" d="M8 12.5l2.5 2.5 5-5"/>
//                     </svg>
//                   </div>
//                   <h2 className="text-[17px] font-semibold text-slate-800 mb-2">Check your inbox</h2>
//                   <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
//                     A password reset link was sent to{' '}
//                     <span className="font-medium text-slate-700">{forgotEmail}</span>.
//                     Check your spam folder if you don't see it within a minute.
//                   </p>
//                   <button
//                     type="button"
//                     onClick={backToSignIn}
//                     className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 cursor-pointer border-0"
//                   >
//                     Back to Sign In
//                   </button>
//                 </div>
//               ) : (
//                 <>
//                   <h2 className="text-[17px] font-semibold text-slate-800 mb-1">Forgot password?</h2>
//                   <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
//                     Enter your account email and we'll send you a reset link.
//                   </p>

//                   <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
//                     <div className="flex flex-col gap-1.5">
//                       <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                         Email
//                       </label>
//                       <div className="relative">
//                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                           <IconMail />
//                         </span>
//                         <input
//                           className={inputCls}
//                           type="email"
//                           placeholder="you@example.com"
//                           value={forgotEmail}
//                           onChange={e => setForgotEmail(e.target.value)}
//                           required
//                           autoFocus
//                         />
//                       </div>
//                     </div>

//                     {forgotError && (
//                       <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
//                         {forgotError}
//                       </div>
//                     )}

//                     <button
//                       type="submit"
//                       disabled={forgotLoading}
//                       className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed tracking-wide cursor-pointer border-0"
//                     >
//                       {forgotLoading ? 'Sending…' : 'Send Reset Link'}
//                     </button>
//                   </form>
//                 </>
//               )}
//             </div>

//           ) : (
//             <>
//               {/* Tabs */}
//               <div className="flex border-b border-slate-200 mb-6">
//                 {([['signin', 'Sign In'], ['signup', 'Create Account']] as [Mode, string][]).map(([v, l]) => (
//                   <button
//                     key={v}
//                     type="button"
//                     onClick={() => { setMode(v); setError(''); setSignupSuccess(false); }}
//                     className={[
//                       'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
//                       'transition-all duration-200 -mb-px border-b-2',
//                       mode === v
//                         ? 'text-slate-900 border-blue-600'
//                         : 'text-slate-400 border-transparent hover:text-slate-600',
//                     ].join(' ')}
//                   >
//                     {l}
//                   </button>
//                 ))}
//               </div>

//               {signupSuccess && mode === 'signin' && (
//                 <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 mb-4">
//                   ✓ Account created successfully! Please sign in.
//                 </div>
//               )}

//               <form onSubmit={handleSubmit} className="flex flex-col gap-4">

//                 {mode === 'signup' && (
//                   <div className="flex flex-col gap-1.5">
//                     <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                       Full Name
//                     </label>
//                     <div className="relative">
//                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                         <IconUser />
//                       </span>
//                       <input
//                         className={inputCls}
//                         placeholder="Karma Wangdi"
//                         value={name}
//                         onChange={e => setName(e.target.value)}
//                         required
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                     Email
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                       <IconMail />
//                     </span>
//                     <input
//                       className={inputCls}
//                       type="email"
//                       placeholder="you@example.com"
//                       value={email}
//                       onChange={e => setEmail(e.target.value)}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-1.5">
//                   <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex">
//                       <IconLock />
//                     </span>
//                     <input
//                       className={`${inputCls} pr-10`}
//                       type={showPass ? 'text' : 'password'}
//                       placeholder="••••••••••"
//                       value={password}
//                       onChange={e => setPassword(e.target.value)}
//                       required
//                       minLength={6}
//                     />
//                     <button
//                       type="button"
//                       tabIndex={-1}
//                       aria-label={showPass ? 'Hide password' : 'Show password'}
//                       onClick={() => setShowPass(p => !p)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0"
//                     >
//                       {showPass ? <IconEyeOff /> : <IconEye />}
//                     </button>
//                   </div>

//                   {mode === 'signin' && (
//                     <div className="flex items-center justify-between mt-1">

//                       {/* ── Remember Me — fixed: real checkbox drives state, label wraps everything ── */}
//                       <label
//                         htmlFor="remember-me"
//                         className="flex items-center gap-2 cursor-pointer select-none group"
//                       >
//                         {/* Hidden native checkbox — clicking anywhere in the label toggles it */}
//                         <input
//                           id="remember-me"
//                           type="checkbox"
//                           checked={rememberMe}
//                           onChange={e => setRememberMe(e.target.checked)}
//                           className="sr-only"
//                         />
//                         {/* Visual checkbox — purely decorative, pointer-events-none so clicks fall through to the label */}
//                         <div
//                           className={[
//                             'w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center pointer-events-none flex-shrink-0',
//                             rememberMe
//                               ? 'bg-blue-600 border-blue-600'
//                               : 'bg-slate-50 border-slate-300 group-hover:border-slate-400',
//                           ].join(' ')}
//                         >
//                           {rememberMe && (
//                             <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
//                               <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
//                             </svg>
//                           )}
//                         </div>
//                         <span className="text-[12px] text-slate-500 group-hover:text-slate-700 transition-colors">
//                           Remember me
//                         </span>
//                       </label>

//                       <button
//                         type="button"
//                         onClick={openForgot}
//                         className="text-[12px] text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 cursor-pointer p-0 transition-colors"
//                       >
//                         Forgot password?
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {error && (
//                   <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
//                     {error}
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={formLoading}
//                   className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 tracking-wide cursor-pointer border-0"
//                 >
//                   {formLoading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Create Account'}
//                 </button>

//               </form>

//               <div className="flex items-center gap-3 my-4">
//                 <span className="flex-1 h-px bg-slate-200" />
//                 <span className="text-xs text-slate-400">or</span>
//                 <span className="flex-1 h-px bg-slate-200" />
//               </div>

//               <button
//                 type="button"
//                 disabled={formLoading}
//                 onClick={handleGoogle}
//                 className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
//               >
//                 <GoogleIcon />
//                 Continue with Google
//               </button>

//               <p className="text-center text-[12px] text-slate-400 mt-5">
//                 Need help?{' '}
//                 <a href="mailto:support@pelsung.com" className="text-blue-600 hover:underline">
//                   Contact support
//                 </a>
//               </p>
//             </>
//           )}

//         </div>

//         <p className="text-center text-[11px] text-white/40 mt-5 tracking-widest uppercase">
//           FileVault · Secure · Private · Organized
//         </p>

//       </div>
//     </div>
//   );
// }
import { useState, useTransition } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/airport-dark-bg.webp';

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

const inputCls =
  'w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 ' +
  'text-slate-800 text-sm placeholder:text-slate-400 outline-none ' +
  'transition-all duration-200 focus:border-blue-500 focus:bg-white ' +
  'focus:ring-2 focus:ring-blue-500/10';

const REMEMBER_KEY = 'pelsung_remembered_email';

// ── Password rules ────────────────────────────────────────────────────────────
interface PasswordRule {
  label: string;
  test:  (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',        test: pw => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)',    test: pw => /[A-Z]/.test(pw) },
  { label: 'One number (0–9)',              test: pw => /[0-9]/.test(pw) },
  { label: 'One special character (!@#…)',  test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

function validatePassword(pw: string): string | null {
  if (!PASSWORD_RULES[0].test(pw)) return 'Password must be at least 8 characters.';
  if (!PASSWORD_RULES[1].test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!PASSWORD_RULES[2].test(pw)) return 'Password must contain at least one number.';
  if (!PASSWORD_RULES[3].test(pw)) return 'Password must contain at least one special character.';
  return null;
}

function friendlyError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('already exists')) return 'An account with this email already exists.';
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) return 'Incorrect email or password.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (msg.includes('password should be at least')) return 'Password must be at least 8 characters.';
  return raw;
}

// ── Password strength meter ───────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const color  = colors[passed - 1] ?? '#e2e8f0';
  const label  = labels[passed - 1] ?? '';

  return (
    <div style={{ marginTop: 8 }}>
      {/* Bar — 4 segments for 4 rules */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < passed ? color : '#e2e8f0',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      {/* Rules checklist */}
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
              <span style={{ fontSize: 11.5, color: ok ? '#15803d' : '#94a3b8', transition: 'color 0.2s' }}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
      {password.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 600, color: color, marginTop: 6, textAlign: 'right', transition: 'color 0.25s' }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode]               = useState<Mode>('signin');
  const [email, setEmail]             = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword]       = useState('');
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [error, setError]             = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [rememberMe, setRememberMe]   = useState(() => !!localStorage.getItem(REMEMBER_KEY));

  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]     = useState('');

  // redirect if already logged in
  if (!loading && !isPending && user) {
    startTransition(() => navigate('/catalog'));
    return null;
  }
  if (loading || isPending) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    // Extra password validation on signup
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
        // Pass phone as metadata so AuthContext / signUp can store it
        await signUp(email, password, name, phone || undefined);
        setName(''); setPassword(''); setPhone('');
        setSignupSuccess(true);
        setMode('signin');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyError(raw));
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
      const raw = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(friendlyError(raw));
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
      const raw = err instanceof Error ? err.message : 'Failed to send reset email';
      setForgotError(friendlyError(raw));
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgot() {
    setForgotEmail(email); setForgotSent(false);
    setForgotError(''); setMode('forgot');
  }

  function backToSignIn() {
    setMode('signin'); setForgotSent(false);
    setForgotError(''); setError('');
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden brightness-50">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-[2] w-full max-w-[440px]">

        {/* Header */}
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

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-[18px] px-8 pt-7 pb-7 shadow-[0_32px_64px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.2)]">

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' ? (
            <div>
              <button type="button" onClick={backToSignIn}
                className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 transition-colors mb-5 bg-transparent border-0 cursor-pointer p-0">
                <IconArrowLeft /> Back to Sign In
              </button>

              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-green-500">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m2 7 10 7 10-7"/>
                      <path stroke="#22c55e" strokeWidth="2.2" d="M8 12.5l2.5 2.5 5-5"/>
                    </svg>
                  </div>
                  <h2 className="text-[17px] font-semibold text-slate-800 mb-2">Check your inbox</h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                    A password reset link was sent to{' '}
                    <span className="font-medium text-slate-700">{forgotEmail}</span>.
                  </p>
                  <button type="button" onClick={backToSignIn}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 cursor-pointer border-0">
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-[17px] font-semibold text-slate-800 mb-1">Forgot password?</h2>
                  <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
                    Enter your account email and we'll send you a reset link.
                  </p>
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Email</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex"><IconMail /></span>
                        <input className={inputCls} type="email" placeholder="you@example.com"
                          value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus />
                      </div>
                    </div>
                    {forgotError && (
                      <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">{forgotError}</div>
                    )}
                    <button type="submit" disabled={forgotLoading}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed tracking-wide cursor-pointer border-0">
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
            </div>

          ) : (
            <>
              {/* ── TABS ── */}
              <div className="flex border-b border-slate-200 mb-6">
                {([['signin', 'Sign In'], ['signup', 'Create Account']] as [Mode, string][]).map(([v, l]) => (
                  <button key={v} type="button"
                    onClick={() => { setMode(v); setError(''); setSignupSuccess(false); }}
                    className={[
                      'pb-3 mr-5 text-sm font-medium bg-transparent border-0 cursor-pointer',
                      'transition-all duration-200 -mb-px border-b-2',
                      mode === v ? 'text-slate-900 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600',
                    ].join(' ')}>
                    {l}
                  </button>
                ))}
              </div>

              {signupSuccess && mode === 'signin' && (
                <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 mb-4">
                  ✓ Account created! Please check your email to confirm, then sign in.
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* ── SIGNUP-ONLY FIELDS ── */}
                {mode === 'signup' && (
                  <>
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex"><IconUser /></span>
                        <input className={inputCls} placeholder="Karma Wangdi"
                          value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                    </div>

                    {/* Phone (optional) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        Phone Number
                        <span className="text-[10px] font-normal text-slate-400 normal-case bg-slate-100 px-1.5 py-0.5 rounded-md">Optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex"><IconPhone /></span>
                        <input
                          className={inputCls}
                          type="tel"
                          placeholder="+975 17 123 456"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 pl-0.5">
                        Used for account recovery only. We never share your number.
                      </p>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex"><IconMail /></span>
                    <input className={inputCls} type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex"><IconLock /></span>
                    <input
                      className={`${inputCls} pr-10`}
                      type={showPass ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Min 8 · uppercase · number · special' : '••••••••••'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={mode === 'signup' ? 8 : 1}
                    />
                    <button type="button" tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center bg-transparent border-0 cursor-pointer p-0">
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {/* Password strength — signup only */}
                  {mode === 'signup' && <PasswordStrength password={password} />}

                  {/* Remember me + Forgot — signin only */}
                  {mode === 'signin' && (
                    <div className="flex items-center justify-between mt-1">
                      <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none group">
                        <input id="remember-me" type="checkbox" checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)} className="sr-only" />
                        <div className={[
                          'w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center pointer-events-none flex-shrink-0',
                          rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-300 group-hover:border-slate-400',
                        ].join(' ')}>
                          {rememberMe && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-[12px] text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                      </label>
                      <button type="button" onClick={openForgot}
                        className="text-[12px] text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 cursor-pointer p-0 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="text-[12.5px] px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>
                )}

                {/* Submit */}
                <button type="submit" disabled={formLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 hover:-translate-y-px hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 tracking-wide cursor-pointer border-0">
                  {formLoading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Create Account'}
                </button>

              </form>

              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>

              <button type="button" disabled={formLoading} onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="text-center text-[12px] text-slate-400 mt-5">
                Need help?{' '}
                <a href="mailto:support@pelsung.com" className="text-blue-600 hover:underline">Contact support</a>
              </p>
            </>
          )}

        </div>

        <p className="text-center text-[11px] text-white/40 mt-5 tracking-widest uppercase">
          FileVault · Secure · Private · Organized
        </p>

      </div>
    </div>
  );
}