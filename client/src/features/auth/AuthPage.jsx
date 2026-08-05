import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ArrowLeft, Shield, ChevronRight, Eye, EyeOff, AlertTriangle,
  CheckCircle2, User, KeyRound, Mail, ShieldAlert, Sparkles, Anchor, Radio
} from 'lucide-react';
import cyberDeckImg from '../../assets/cyber_security_deck.png';

const ADMIN_EMAIL = 'adminlogistics@gmail.com';
const ADMIN_PASSWORD = 'zxcvbnm0987654321';

export const AuthPage = () => {
  const { login, register, returnToLanding } = useAuth();

  // Mode: 'SIGN_IN' | 'SIGN_UP'
  const [mode, setMode] = useState('SIGN_IN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI status feedback
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === 'SIGN_IN';
  const isAdminCredentials = email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD;

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  // Preset Admin Credentials shortcut button handler
  const fillAdminCredentials = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
    setMode('SIGN_IN');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignIn) {
        // Sign In Flow
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error);
        }
      } else {
        // Sign Up Flow
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please re-enter your password.');
          setIsSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }

        const result = await register(email, password, fullName);
        if (result.success) {
          setSuccessMessage(result.message || 'Account created successfully! Please sign in.');
          setMode('SIGN_IN');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected system error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#06090f] grid grid-cols-1 lg:grid-cols-12 font-sans text-slate-100 overflow-hidden">

      {/* ── Left Panel (40%): Generative Cybersecurity Deck Graphic ─────────────── */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-[#090d16] border-r border-slate-800/60 p-10 flex-col justify-between overflow-hidden group">
        <img
          src={cyberDeckImg}
          alt="Cyber Security Deck"
          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/70 to-[#090d16]/90" />

        {/* Top Header & Security Badge */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800/80 rounded-full self-start shadow-md backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-chip-blink" />
            <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              ZERO TRUST AUTHENTICATION PERIMETER
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 mt-2">
            <Anchor className="h-5 w-5 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
              OPERATIONS RESEARCH GATEWAY
            </span>
          </div>
        </div>

        {/* Bottom Hero Text Overlay */}
        <div className="relative z-10 flex flex-col gap-4">
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight font-sans leading-tight">
            Cascading Logistics <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
              Delay Intelligence OS
            </span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans">
            Stateless role-based identity security portal. Route predictions, scans, and facility queues protected by zero-trust encryption protocols.
          </p>

          {/* Master Admin Credential Fill Shortcut */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-300">System Admin Bootstrapper</span>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl text-[10px] font-mono font-bold text-amber-400 transition-all cursor-pointer shadow-sm"
            >
              Fill Master Admin Creds
            </button>
          </div>
        </div>

      </div>

      {/* ── Right Panel (60%): Authentication Form & Controls ─────────────────────────── */}
      <div className="lg:col-span-7 relative flex items-center justify-center p-6 sm:p-12 bg-[#06090f]">

        {/* Back to Hub button */}
        <button
          onClick={returnToLanding}
          className="absolute top-6 left-8 flex items-center gap-1.5 text-slate-500 hover:text-slate-200 text-xs font-mono font-semibold transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>BACK TO COMMAND HUB</span>
        </button>

        {/* Auth Card Container */}
        <div className="w-full max-w-md border border-slate-800/60 bg-[#0d1321] rounded-lg p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6">

          {/* Card Header */}
          <div className="flex flex-col gap-4 border-b border-slate-800/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#06090f] border border-slate-800/80 rounded-lg">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-100 uppercase tracking-tight font-sans">
                  {isSignIn ? 'System Operator Sign In' : 'Operator Onboarding'}
                </h1>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5">
                  RBAC SECURITY FRAMEWORK v2.4
                </p>
              </div>
            </div>

            {/* Segmented Dual-Mode Toggle */}
            <div className="grid grid-cols-2 p-1 bg-[#06090f] border border-slate-800/80 rounded-lg mt-1 font-mono">
              <button
                type="button"
                id="auth-toggle-signin"
                onClick={() => handleModeSwitch('SIGN_IN')}
                className={`py-2 text-center text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                  isSignIn
                    ? 'bg-[#0d1321] text-emerald-400 border border-slate-700/60 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                [ Sign In ]
              </button>
              <button
                type="button"
                id="auth-toggle-signup"
                onClick={() => handleModeSwitch('SIGN_UP')}
                className={`py-2 text-center text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                  !isSignIn
                    ? 'bg-[#0d1321] text-emerald-400 border border-slate-700/60 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                [ Create Account ]
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Create Account Mode: Full Name */}
            {!isSignIn && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3 w-3 text-slate-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="auth-fullname"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(null); }}
                  placeholder="Alexander Mercer"
                  required={!isSignIn}
                  className="w-full bg-[#0d1321] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-slate-500" />
                Email Address
              </label>
              <input
                type="email"
                id="auth-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="operator@logistics.com"
                autoComplete="email"
                required
                className="w-full bg-[#0d1321] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="h-3 w-3 text-slate-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••••••••"
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  required
                  className="w-full bg-[#0d1321] border border-slate-800/80 rounded-xl px-4 py-3 pr-10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Create Account Mode: Password Confirmation */}
            {!isSignIn && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-slate-500" />
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••••••••"
                  autoComplete="new-password"
                  required={!isSignIn}
                  className="w-full bg-[#0d1321] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
              </div>
            )}

            {/* Viewer Access Notice for Create Account Mode */}
            {!isSignIn && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-snug font-sans">
                  <strong className="text-slate-200">Role Elevation Policy:</strong> New accounts are initialized with Read-Only <span className="font-mono text-sky-400 font-bold">VIEWER</span> access. Contact your administrator for role elevation.
                </p>
              </div>
            )}

            {/* Admin Credentials Detection Hint */}
            {isSignIn && isAdminCredentials && (
              <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-2xl flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-chip-blink" />
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  ADMIN credentials verified. Unlocking Full System Control Panel...
                </span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 font-sans leading-tight">{successMessage}</p>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-wider">AUTHENTICATION ERROR</p>
                  <p className="text-[11px] font-medium leading-snug text-red-300 font-sans">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700/60 hover:border-emerald-500 rounded-2xl font-mono text-xs font-bold text-slate-200 hover:text-white transition-all shadow-lg cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-600 border-t-emerald-400 animate-spin" />
                  {isSignIn ? 'Authenticating...' : 'Registering Account...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  {isSignIn ? 'Sign In to Platform' : 'Create Viewer Account'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="border-t border-slate-800/40 pt-4 text-center">
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
              ZERO TRUST SECURITY PERIMETER · AUDIT LOGGED
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
