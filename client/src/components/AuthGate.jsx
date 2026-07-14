import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeft, Shield, ChevronRight, Eye, EyeOff } from 'lucide-react';
import containerTerminal from '../assets/container_terminal.png';

const ROLES = [
  { value: 'OPERATIONS_MANAGER', label: 'OPS_MGR', fullLabel: 'Operations Manager' },
  { value: 'WAREHOUSE_MANAGER', label: 'WH_MGR', fullLabel: 'Warehouse Manager' },
  { value: 'VIEWER', label: 'VIEWER', fullLabel: 'Viewer' },
  { value: 'ADMIN', label: 'ADMIN', fullLabel: 'System Administrator', restricted: true },
];

export const AuthGate = () => {
  const { login, returnToLanding } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('OPERATIONS_MANAGER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminSelected = selectedRole === 'ADMIN';

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Simulate a short async check
    await new Promise((r) => setTimeout(r, 380));

    const result = login(email, password, selectedRole);
    if (!result.success) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-split-container font-sans text-slate-100 overflow-hidden">
      {/* Left Panel: twilight container terminal image */}
      <div className="auth-left-panel">
        <img src={containerTerminal} className="auth-left-img" alt="Container Terminal Twilight" />
        <div className="auth-left-overlay" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
              OPERATIONAL HUB GATEWAY
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight font-sans">
            Container Terminal OS
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-sans">
            Twilight warning operations active. Unauthorized attempts are automatically logged to the audit sequence trace.
          </p>
        </div>
      </div>

      {/* Right Panel: login form card */}
      <div className="auth-right-panel relative">
        {/* Back to Hub */}
        <button
          onClick={returnToLanding}
          className="absolute top-6 left-8 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Hub
        </button>

        {/* Auth Card */}
        <div
          className="auth-card w-full max-w-md border border-slate-800/60 bg-slate-900"
          style={{ animation: 'fadeSlideIn 0.35s ease-out both' }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 bg-slate-950 border border-slate-800/60 rounded-md">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight font-sans">
                System Operator Login
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 ml-10 font-sans">
              Authenticate your identity and select a destination profile.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
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
                className="auth-input font-mono bg-slate-950 border-slate-800/60 text-slate-100"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="auth-input pr-10 font-mono bg-slate-950 border-slate-800/60 text-slate-100"
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

            {/* Role Segmented Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                Destination Profile
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map((role) => {
                  const isActive = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      id={`role-toggle-${role.value.toLowerCase()}`}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`role-toggle-btn ${isActive ? 'role-toggle-active' : 'role-toggle-inactive'} ${role.restricted ? 'role-toggle-restricted' : ''}`}
                    >
                      <span className="font-mono text-[10px] font-bold tracking-wider">
                        {role.label}
                      </span>
                      {role.restricted && (
                        <Shield className="h-2.5 w-2.5 ml-1 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Admin hint */}
              {isAdminSelected && (
                <p
                  className="text-[9px] text-amber-500 font-mono mt-0.5"
                  style={{ animation: 'fadeSlideIn 0.2s ease-out both' }}
                >
                  ⚡ ADMIN profile requires verified administrative credentials.
                </p>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="auth-error-banner border-red-950 bg-red-950/20 text-red-500"
                style={{ animation: 'fadeSlideIn 0.2s ease-out both' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                <p className="text-[11px] font-medium leading-snug font-sans">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isSubmitting}
              className="auth-submit-btn mt-1 font-sans border-slate-800/60 bg-slate-950 text-slate-200"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-slate-600 border-t-slate-300 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Authenticate & Enter
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="px-8 pb-6 border-t border-slate-800/30">
            <p className="text-[9px] text-slate-700 font-mono text-center uppercase tracking-wider mt-4">
              SECURE_GATE v2.1 · SESSION ENCRYPTED · {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
