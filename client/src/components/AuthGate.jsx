import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeft, Shield, ChevronRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import containerTerminal from '../assets/container_terminal.png';

const ROLES = [
  { value: 'OPERATIONS_MANAGER', label: 'OPS_MGR',  fullLabel: 'Operations Manager' },
  { value: 'WAREHOUSE_MANAGER',  label: 'WH_MGR',   fullLabel: 'Warehouse Manager' },
  { value: 'VIEWER',             label: 'VIEWER',    fullLabel: 'Viewer' },
  { value: 'ADMIN',              label: 'ADMIN',     fullLabel: 'System Administrator', restricted: true },
];

export const AuthGate = () => {
  const { login, returnToLanding } = useAuth();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [selectedRole, setSelectedRole] = useState('OPERATIONS_MANAGER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminSelected = selectedRole === 'ADMIN';
  const isFormFilled    = email.trim().length > 0 && password.trim().length > 0;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 380));
    const result = login(email, password, selectedRole);
    if (!result.success) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-split-container font-sans text-slate-100 overflow-hidden">

      {/* ── Left Panel: Twilight Container Terminal ─────────────── */}
      <div className="auth-left-panel">
        {/* Base image */}
        <img src={containerTerminal} className="auth-left-img" alt="Container Terminal Twilight" />

        {/* Bottom-to-top + right-edge fade overlay */}
        <div className="auth-left-overlay" />

        {/* Amber particle dots */}
        <div className="auth-left-particles" />

        {/* Perimeter tag top-left */}
        <div className="auth-perimeter-tag">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-chip-blink" />
          <span className="font-mono text-[9px] font-bold tracking-widest text-amber-500 uppercase">
            SECURE_PERIMETER · ZONE ALPHA
          </span>
        </div>

        {/* Bottom text content */}
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
              OPERATIONAL HUB GATEWAY
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight font-sans leading-tight">
            Container<br />Terminal OS
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-sans mt-1">
            Twilight warning operations active. Unauthorized attempts are
            automatically logged to the audit sequence trace.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
              AES-256 ENCRYPTED · SESSION ISOLATED
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ─────────────────────────────── */}
      <div className="auth-right-panel relative">

        {/* Back to Hub button */}
        <button
          onClick={returnToLanding}
          className="absolute top-6 left-8 flex items-center gap-1.5 text-slate-600 hover:text-slate-300 text-xs font-semibold transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Hub
        </button>

        {/* Auth Card */}
        <div
          className="auth-card w-full max-w-md border border-slate-800/60 bg-slate-900"
          style={{ animation: 'fadeSlideIn 0.38s ease-out both' }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2 bg-slate-950 border border-slate-800/60 rounded-lg">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-100 tracking-tight font-sans">
                  System Operator Login
                </h1>
                <p className="text-[10px] text-slate-600 font-mono tracking-wider">
                  SECURE_GATE v3.0 · AUTHENTICATION LAYER
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-sans leading-normal">
              Authenticate your identity and select a destination profile to enter the operations workspace.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="data-label text-slate-500">Email Address</label>
              <input
                type="email"
                id="auth-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="operator@logistics.com"
                autoComplete="email"
                required
                className="auth-input"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="data-label text-slate-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  required
                  className="auth-input pr-10"
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

            {/* Role Segmented Toggle — horizontal pill row */}
            <div className="flex flex-col gap-2">
              <label className="data-label text-slate-500">Destination Profile</label>
              <div className="role-toggle-group">
                {ROLES.map((role) => {
                  const isActive = selectedRole === role.value;
                  const isAdminRole = role.value === 'ADMIN';
                  return (
                    <button
                      key={role.value}
                      type="button"
                      id={`role-toggle-${role.value.toLowerCase()}`}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`role-toggle-btn ${
                        isActive
                          ? `role-toggle-active${isAdminRole ? ' role-admin-active' : ''}`
                          : 'role-toggle-inactive'
                      }`}
                    >
                      {role.restricted && (
                        <Shield className="h-2.5 w-2.5 shrink-0 opacity-70" />
                      )}
                      <span className="font-mono text-[9px] font-bold tracking-widest">
                        {role.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Admin hint badge */}
              {isAdminSelected && (
                <p
                  className="text-[9px] text-amber-500 font-mono mt-0.5 flex items-center gap-1.5"
                  style={{ animation: 'fadeSlideIn 0.22s ease-out both' }}
                >
                  <span className="h-1 w-1 rounded-full bg-amber-500 animate-chip-blink" />
                  ADMIN profile requires verified administrative credentials.
                </p>
              )}
            </div>

            {/* Error Banner — Crimson Enforcement */}
            {error && (
              <div
                className="auth-error-banner"
                style={{ animation: 'fadeSlideIn 0.22s ease-out both' }}
              >
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="auth-error-header">ACCESS DENIED</p>
                  <p className="text-[11px] font-medium leading-snug text-red-400 font-sans">{error}</p>
                </div>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-1 animate-chip-blink" />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isSubmitting}
              className={`auth-submit-btn mt-1 ${isFormFilled && !isSubmitting ? 'btn-ready' : ''}`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-600 border-t-emerald-400 animate-spin-slow" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Authenticate &amp; Enter Workspace
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="px-8 pb-6 border-t border-slate-800/30">
            <p className="text-[9px] text-slate-700 font-mono text-center uppercase tracking-widest mt-4">
              SESSION ENCRYPTED · AUDIT LOGGED · {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
