import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Bell, ShieldAlert, ChevronDown, LogOut, Trash2, ArrowRight } from 'lucide-react';

const roleBadgeStyles = {
  ADMIN: 'bg-red-950/30 text-red-400 border-red-900/40',
  OPERATIONS_MANAGER: 'bg-amber-950/30 text-amber-400 border-amber-900/40',
  WAREHOUSE_MANAGER: 'bg-blue-950/30 text-blue-400 border-blue-900/40',
  VIEWER: 'bg-slate-900 text-slate-400 border-slate-800/60',
};

const roleShortLabels = {
  ADMIN: 'ADMIN',
  OPERATIONS_MANAGER: 'OPS_MGR',
  WAREHOUSE_MANAGER: 'WH_MGR',
  VIEWER: 'VIEWER',
};

const avatarRingClass = {
  ADMIN: 'border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  OPERATIONS_MANAGER: 'border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  WAREHOUSE_MANAGER: 'border border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
  VIEWER: 'border border-slate-700/50',
};

export const Header = ({ setActiveTab }) => {
  const { user, logout } = useAuth();
  const { networkStats } = useApi();
  const { isConnected, activeAlerts, clearAlert, clearAllAlerts } = useSocket();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  const handleInspectAlert = (shipmentId) => {
    setAlertsOpen(false);
    setActiveTab('tracking');
  };

  return (
    <header className="h-12 bg-[#0a0f1a] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-50 relative select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="shrink-0">
          <path d="M5 9L14 3.5L23 9" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 18.5L14 24L23 18.5" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 3.5V24" stroke="#334155" strokeWidth="1" strokeDasharray="2.5 3.5" />
          <circle cx="14" cy="13.5" r="1.5" fill="none" stroke="#475569" strokeWidth="1" />
        </svg>
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
            CASCADING DELAY
          </span>
          <span className="text-[8px] font-mono text-slate-400 tracking-widest mt-0.5">OPERATIONS OS</span>
        </div>
        <div className="h-4 w-px bg-slate-800/80 ml-1 hidden sm:block" />
      </div>

      {/* Center: Live Telemetry & WS Connection Health */}
      <div className="flex items-center gap-2.5">
        {/* WS Connection Health Tag */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 border border-slate-800/60 rounded">
          {isConnected ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider">
                WS: ACTIVE
              </span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="font-mono text-[10px] text-amber-400 font-bold tracking-wider">
                WS: RECONNECTING
              </span>
            </>
          )}
        </div>

        {/* STREAM INGEST */}
        <div className="hidden md:flex items-center bg-slate-950 px-2.5 py-1 border border-slate-800/60 rounded">
          <span className="font-mono text-[10px] text-slate-400 tracking-wide">STREAM INGEST: 12k/s</span>
        </div>

        {/* LATENCY */}
        <div className="hidden sm:flex items-center bg-slate-950 px-2.5 py-1 border border-slate-800/60 rounded">
          <span className="font-mono text-[10px] text-amber-400 tracking-wide">
            LATENCY: {networkStats.latencyMs !== null ? `${networkStats.latencyMs}ms` : '42ms'}
          </span>
        </div>
      </div>

      {/* Right: Notification Bell & Identity Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell with Real-time Badge Count */}
        <div className="relative">
          <button
            onClick={() => {
              setAlertsOpen(!alertsOpen);
              setProfileOpen(false);
            }}
            className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
              activeAlerts.length > 0
                ? 'bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-900/30'
                : 'bg-slate-900 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
            title="Cascading Delay Alerts"
          >
            <Bell className="h-4 w-4 shrink-0" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 font-mono text-[9px] font-bold text-white shadow-md animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Overlay */}
          {alertsOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl z-[999] overflow-hidden flex flex-col max-h-[420px]"
              style={{ animation: 'fadeSlideIn 0.18s ease-out both' }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Cascading Delay Alerts
                  </span>
                </div>
                {activeAlerts.length > 0 && (
                  <button
                    onClick={clearAllAlerts}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Alert List */}
              <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1">
                {activeAlerts.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    No active cascading route delay alerts.
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-slate-950/80 border border-red-900/40 hover:border-red-500/40 rounded-lg p-3 flex flex-col gap-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {alert.shipmentId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/50 border border-red-900/50 px-1.5 py-0.2 rounded">
                            SCORE: {alert.riskScore}%
                          </span>
                          <button
                            onClick={() => clearAlert(alert.id)}
                            className="text-slate-500 hover:text-slate-300 text-xs px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        {alert.delayReason}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-slate-500 border-t border-slate-900">
                        <span>{alert.locationId || 'HUB-CENTRAL'}</span>
                        <button
                          onClick={() => handleInspectAlert(alert.shipmentId)}
                          className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Identity Profile Drawer Button */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setAlertsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-lg hover:border-slate-700/80 hover:bg-slate-800/40 transition-all cursor-pointer"
          >
            <div
              className={`h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${
                avatarRingClass[user?.role] || ''
              }`}
            >
              <span className="text-[9px] font-bold text-slate-300">{initials}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[10px] font-semibold text-slate-300">{user?.name}</span>
              <span className={`text-[8px] font-mono font-bold mt-0.5 ${
                roleBadgeStyles[user?.role]?.split(' ').find(c => c.startsWith('text-'))
              }`}>
                {roleShortLabels[user?.role]}
              </span>
            </div>
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800/60 rounded-xl shadow-2xl z-[999] overflow-hidden"
              style={{ animation: 'fadeSlideIn 0.18s ease-out both' }}
            >
              <div className="px-4 py-4 border-b border-slate-800/60 flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${avatarRingClass[user?.role] || ''}`}
                >
                  <span className="text-[11px] font-bold text-slate-200">{initials}</span>
                </div>
                <div className="flex flex-col leading-none">
                  <p className="text-xs font-bold text-slate-200">{user?.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[140px]">{user?.email}</p>
                  <div className={`mt-1.5 inline-block px-2 py-0.5 border rounded text-[8px] font-bold tracking-widest uppercase font-mono ${roleBadgeStyles[user?.role]}`}>
                    {user?.role?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <div className="px-4 py-1.5 border-b border-slate-800/40">
                <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                  SESSION · {user?.id || 'USR-???'}
                </p>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out &amp; Return to Hub
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global backdrop to close dropdown overlays */}
      {(profileOpen || alertsOpen) && (
        <div
          className="fixed inset-0 z-[998] bg-transparent"
          onClick={() => {
            setProfileOpen(false);
            setAlertsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
