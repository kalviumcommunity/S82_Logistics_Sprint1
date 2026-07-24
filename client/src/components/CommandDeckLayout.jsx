import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import NavigationDock from './NavigationDock.jsx';
import {
  Search, Map, Settings, User, LogOut, ChevronDown
} from 'lucide-react';

// Workspace tab registry
const ALL_TABS = [
  {
    id: 'tracking',
    label: 'Shipment Tracker',
    icon: Search,
    roles: ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'],
  },
  {
    id: 'command',
    label: 'Command Center',
    icon: Map,
    roles: ['ADMIN', 'OPERATIONS_MANAGER'],
  },
  {
    id: 'admin',
    label: 'Admin Operations',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

const roleBadgeStyles = {
  ADMIN:             'bg-red-950/30  text-red-400   border-red-900/40',
  OPERATIONS_MANAGER:'bg-amber-950/30 text-amber-400 border-amber-900/40',
  WAREHOUSE_MANAGER: 'bg-blue-950/30  text-blue-400  border-blue-900/40',
  VIEWER:            'bg-slate-900    text-slate-400  border-slate-800/60',
};

const roleShortLabels = {
  ADMIN:             'ADMIN',
  OPERATIONS_MANAGER:'OPS_MGR',
  WAREHOUSE_MANAGER: 'WH_MGR',
  VIEWER:            'VIEWER',
};

const avatarRingClass = {
  ADMIN:             'avatar-ring-admin',
  OPERATIONS_MANAGER:'avatar-ring-ops',
  WAREHOUSE_MANAGER: 'avatar-ring-wh',
  VIEWER:            'avatar-ring-viewer',
};

// Which tabs form which group (for separator)
const TAB_GROUP_BREAK_AFTER = 'command'; // separator after 'command' tab

export const CommandDeckLayout = ({ activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();
  const { networkStats } = useApi();
  const { socket } = useSocket();

  const [dbHealthy, setDbHealthy]   = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleTelemetry = (data) => {
      setDbHealthy(data.mongoStatus === 'healthy');
    };
    socket.on('system:telemetry', handleTelemetry);
    return () => socket.off('system:telemetry', handleTelemetry);
  }, [socket]);

  // Filter tabs by user role
  const visibleTabs = ALL_TABS.filter((tab) => tab.roles.includes(user?.role));

  // User initials for avatar
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">

      {/* ══════════════════════════════════════════════════════════
          GLOBAL TELEMETRY BAR
          ══════════════════════════════════════════════════════════ */}
      <header
        className="h-12 bg-[#0a0f1a] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-50 telemetry-bar-glow"
      >
        {/* ── Left: Logo + wordmark ── */}
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <path d="M5 9L14 3.5L23 9"   stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 18.5L14 24L23 18.5" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 3.5V24"          stroke="#334155" strokeWidth="1"   strokeDasharray="2.5 3.5"/>
            <circle cx="14" cy="13.5" r="1.5" fill="none" stroke="#475569" strokeWidth="1"/>
          </svg>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
              CASCADING DELAY
            </span>
            <span className="text-[8px] font-mono text-slate-600 tracking-widest mt-0.5">OPERATIONS OS</span>
          </div>
          <div className="h-4 w-px bg-slate-800/80 ml-1 hidden sm:block" />
        </div>

        {/* ── Center: Live Status Chips ── */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {/* SYS_OK / SYS_ERR */}
          <div className="telemetry-chip">
            {dbHealthy
              ? <span className="telemetry-status-dot" />
              : <span className="telemetry-status-dot-err" />
            }
            <span className={`font-mono text-[10px] font-bold tracking-wider ${dbHealthy ? 'text-emerald-500' : 'text-red-500'}`}>
              {dbHealthy ? 'SYS_OK' : 'SYS_ERR'}
            </span>
            {dbHealthy && (
              <span className="font-mono text-[10px] text-emerald-700 animate-cursor-blink">_</span>
            )}
          </div>

          {/* STREAM INGEST */}
          <div className="telemetry-chip hidden sm:flex">
            <span className="font-mono text-[10px] text-slate-400 tracking-wide">STREAM INGEST: 12k/s</span>
          </div>

          {/* LATENCY */}
          <div className="telemetry-chip hidden sm:flex">
            <span className="font-mono text-[10px] text-amber-500 tracking-wide">
              LATENCY: {networkStats.latencyMs !== null ? `${networkStats.latencyMs}ms` : '42ms'}
            </span>
          </div>
        </div>

        {/* ── Right: Identity Profile Drawer ── */}
        <div className="relative">
          <button
            id="profile-drawer-toggle"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-lg hover:border-slate-700/80 hover:bg-slate-800/40 transition-all group"
          >
            {/* Avatar with role-colored ring */}
            <div
              className={`h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${avatarRingClass[user?.role] || ''}`}
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
            <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800/60 rounded-xl shadow-2xl z-[999] overflow-hidden"
              style={{ animation: 'fadeSlideIn 0.18s ease-out both' }}
            >
              {/* User info */}
              <div className="px-4 py-4 border-b border-slate-800/60 flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${avatarRingClass[user?.role] || ''}`}
                >
                  <span className="text-[11px] font-bold text-slate-200">{initials}</span>
                </div>
                <div className="flex flex-col leading-none">
                  <p className="text-xs font-bold text-slate-200">{user?.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[140px]">{user?.email}</p>
                  <div className={`mt-1.5 inline-block px-2 py-0.5 border rounded text-[8px] font-bold tracking-widest uppercase font-mono ${roleBadgeStyles[user?.role]}`}>
                    {user?.role?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="px-4 py-1.5 border-b border-slate-800/40">
                <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">
                  SESSION · {user?.id || 'USR-???'}
                </p>
              </div>

              {/* Logout */}
              <button
                id="logout-btn"
                onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out &amp; Return to Hub
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM TACTICAL FLIGHT DECK
          ══════════════════════════════════════════════════════════ */}
      {/* Navigation Dock */}
      <NavigationDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Backdrop to close profile drawer */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[998]"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
};

export default CommandDeckLayout;
