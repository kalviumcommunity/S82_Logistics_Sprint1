import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
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

export const CommandDeckLayout = ({ activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();
  const { networkStats } = useApi();
  const { socket } = useSocket();

  const [dbHealthy, setDbHealthy] = useState(true);
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">

      {/* ── GLOBAL TELEMETRY BAR ──────────────────────────────── */}
      <header className="h-12 bg-[#0a0f1a] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-50">
        
        {/* Left: Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M4 8L12 3L20 8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16L12 21L20 16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V21" stroke="#334155" strokeWidth="1" strokeDasharray="2 3"/>
          </svg>
          <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase hidden sm:block font-sans">
            CASCADING DELAY
          </span>
          <div className="h-4 w-px bg-slate-800/80 ml-1 hidden sm:block" />
          <span className="text-[9px] font-mono text-slate-500 hidden sm:block">OPERATIONS OS</span>
        </div>

        {/* Center: Live Status Chips */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {/* SYS_OK */}
          <div className="telemetry-chip border-slate-800/60 bg-slate-950">
            <span className={`h-1.5 w-1.5 rounded-full ${dbHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
            <span className={`font-mono text-[10px] font-bold ${dbHealthy ? 'text-emerald-500' : 'text-red-500'}`}>
              {dbHealthy ? 'SYS_OK' : 'SYS_ERR'}
            </span>
          </div>

          {/* STREAM INGEST */}
          <div className="telemetry-chip border-slate-800/60 bg-slate-950">
            <span className="font-mono text-[10px] text-slate-400">STREAM INGEST: 12k/s</span>
          </div>

          {/* LATENCY */}
          <div className="telemetry-chip border-slate-800/60 bg-slate-950">
            <span className="font-mono text-[10px] text-amber-500">
              LATENCY: {networkStats.latencyMs !== null ? `${networkStats.latencyMs}ms` : '42ms'}
            </span>
          </div>
        </div>

        {/* Right: Identity Drawer */}
        <div className="relative">
          <button
            id="profile-drawer-toggle"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-lg hover:border-slate-700 transition-all group"
          >
            <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <User className="h-2.5 w-2.5 text-slate-400" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[10px] font-semibold text-slate-300 leading-none">{user?.name}</span>
              <span className={`text-[8px] font-mono font-bold mt-0.5 ${roleBadgeStyles[user?.role]?.split(' ').find(c => c.startsWith('text-'))}`}>
                {roleShortLabels[user?.role]}
              </span>
            </div>
            <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800/60 rounded-lg shadow-xl z-[999] overflow-hidden"
              style={{ animation: 'fadeSlideIn 0.15s ease-out both' }}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-800/60">
                <p className="text-xs font-bold text-slate-200">{user?.name}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{user?.email}</p>
                <div className={`mt-2 inline-block px-2 py-0.5 border rounded text-[8px] font-bold tracking-wider uppercase font-mono ${roleBadgeStyles[user?.role]}`}>
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              {/* Logout */}
              <button
                id="logout-btn"
                onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out & Return to Hub
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      {/* ── BOTTOM TACTICAL FLIGHT DECK ──────────────────────── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]">
        <div className="bottom-pill-nav flex items-center gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`pill-nav-btn ${isActive ? 'pill-nav-active' : 'pill-nav-inactive'}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-semibold">{tab.label}</span>
                {isActive && <span className="pill-active-dot" />}
              </button>
            );
          })}
        </div>
      </nav>

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
