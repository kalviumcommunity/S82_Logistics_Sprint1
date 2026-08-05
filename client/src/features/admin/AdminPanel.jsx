import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import UserManagementTable from './UserManagementTable.jsx';
import {
  Cpu, Database, ShieldAlert, Users, Terminal, ShieldCheck,
  Shield, UserX, ChevronDown, Check, Activity
} from 'lucide-react';

const SYSTEM_ROLES = ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'];

const roleBadgeConfig = {
  ADMIN:             { label: 'ADMIN',  color: 'text-red-400',   bg: 'bg-red-950/30',   border: 'border-red-900/40',   rowAccent: 'row-accent-admin'   },
  OPERATIONS_MANAGER:{ label: 'OPS_MGR',color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-900/40', rowAccent: 'row-accent-ops'     },
  WAREHOUSE_MANAGER: { label: 'WH_MGR', color: 'text-blue-400',  bg: 'bg-blue-950/30',  border: 'border-blue-900/40',  rowAccent: 'row-accent-wh'      },
  VIEWER:            { label: 'VIEWER', color: 'text-slate-400', bg: 'bg-slate-900',    border: 'border-slate-800/60', rowAccent: 'row-accent-viewer'  },
};

// Removed unused RoleDropdown

export const AdminPanel = () => {
  const { apiClient } = useApi();
  const { socket } = useSocket();
  const terminalEndRef = useRef(null);

  const [users, setUsers] = useState([
    { id: 'USR-001', name: 'Alexander Mercer', email: 'alex@logistics.com',  role: 'ADMIN',              status: 'ACTIVE' },
    { id: 'USR-002', name: 'Sarah Jenkins',    email: 'sarah@logistics.com', role: 'OPERATIONS_MANAGER', status: 'ACTIVE' },
    { id: 'USR-003', name: 'David Miller',     email: 'david@logistics.com', role: 'WAREHOUSE_MANAGER',  status: 'ACTIVE' },
    { id: 'USR-004', name: 'Emily Watson',     email: 'emily@logistics.com', role: 'VIEWER',             status: 'ACTIVE' },
    { id: 'USR-005', name: 'James Okafor',     email: 'james@logistics.com', role: 'OPERATIONS_MANAGER', status: 'ACTIVE' },
    { id: 'USR-006', name: 'Priya Nair',       email: 'priya@logistics.com', role: 'WAREHOUSE_MANAGER',  status: 'ACTIVE' },
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: new Date().toLocaleTimeString(), action: 'SYSTEM_BOOT',       status: 'SUCCESS', operator: 'KERNEL'    },
    { timestamp: new Date().toLocaleTimeString(), action: 'CONNECT_MONGO',     status: 'SUCCESS', operator: 'DB_POOL'   },
    { timestamp: new Date().toLocaleTimeString(), action: 'CONNECT_REDIS',     status: 'SUCCESS', operator: 'REDIS_POOL'},
    { timestamp: new Date().toLocaleTimeString(), action: 'AUTH_GATE_OPENED',  status: 'INFO',    operator: 'AUTH_SVC'  },
    { timestamp: new Date().toLocaleTimeString(), action: 'ADMIN_SESSION_INIT',status: 'INFO',    operator: 'ADMIN_SVC' },
  ]);

  const [successToast, setSuccessToast] = useState(null);

  const { data: healthData } = useQuery({
    queryKey: ['system-health-telemetry'],
    queryFn: async () => {
      const res = await apiClient.get('/health');
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Role mutation removed from here as it is handled in UserManagementTable

  useEffect(() => {
    if (!socket) return;
    const handleAuditLog = (log) => {
      setAuditLogs((prev) => [...prev, log].slice(-50));
    };
    socket.on('audit:log', handleAuditLog);
    return () => socket.off('audit:log', handleAuditLog);
  }, [socket]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [auditLogs]);

  const TELEMETRY_CARDS = [
    {
      label: 'Database Status',
      icon: Database,
      value: healthData?.database || '—',
      sub: 'Mongoose Connection Pools',
      accent: healthData?.database === 'healthy' ? 'text-emerald-400' : 'text-red-500',
      borderAccent: healthData?.database === 'healthy' ? 'stat-accent-safe' : 'stat-accent-delayed',
    },
    {
      label: 'Redis Stream Buffers',
      icon: Terminal,
      value: healthData?.redisStreamLength ?? '—',
      sub: 'Active buffer stream size (COUNT)',
      accent: 'text-slate-200',
      borderAccent: 'stat-accent-neutral',
    },
    {
      label: 'Host CPU Load',
      icon: Cpu,
      value: healthData?.cpuUsage || '—',
      sub: 'Express process execution slice',
      accent: 'text-slate-200',
      borderAccent: 'stat-accent-neutral',
    },
    {
      label: 'API Quota Usage',
      icon: ShieldAlert,
      value: healthData?.apiQuota || '9,845',
      sub: '/ 10,000 monthly limit',
      accent: 'text-amber-400',
      borderAccent: 'stat-accent-risk',
    },
  ];

  return (
    <div className="p-6 w-full flex flex-col gap-6 max-w-7xl mx-auto font-sans">

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {successToast && (
        <div
          className="fixed top-16 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-slate-800/60 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-toast-slide"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="data-label text-slate-500">ACCESS CONTROL UPDATED</span>
            <p className="text-xs text-slate-200 mt-1.5 font-mono">{successToast}</p>
          </div>
        </div>
      )}

      {/* ── Panel Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-slate-500" />
            System Core Operations &amp; Audit Trace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure role claims, monitor node telemetry, and track real-time audit streams.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-node-flicker" />
          <span className="font-mono text-[9px] text-emerald-500 font-bold tracking-widest">ADMIN CONSOLE ACTIVE</span>
        </div>
      </div>

      {/* ── Row 1: Telemetry Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TELEMETRY_CARDS.map(({ label, icon: Icon, value, sub, accent, borderAccent }) => (
          <div key={label} className={`card-panel p-4 flex flex-col gap-3 ${borderAccent}`}>
            <div className="flex justify-between items-start">
              <span className="data-label">{label}</span>
              <Icon className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className={`text-xl font-extrabold font-mono uppercase tracking-tight ${accent}`}>
                {value}
              </p>
              <p className="text-[9px] text-slate-600 font-medium mt-1">{sub}</p>
            </div>
            {/* Mini sparkline bar */}
            <div className="flex items-end gap-0.5 h-5 mt-auto">
              {[40, 65, 50, 80, 55, 70, 60, 85, 75, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm opacity-30"
                  style={{
                    height: `${h}%`,
                    background: accent.includes('emerald') ? '#10b981' :
                                accent.includes('amber')   ? '#f59e0b' :
                                accent.includes('red')     ? '#ef4444' : '#475569',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Role Assignment Management Grid */}
      <UserManagementTable />

      {/* ── Row 2: User Access Matrix + Audit Terminal ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Dynamic User Access Matrix */}
        <div className="card-panel p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/40 pb-2.5">
            <Users className="h-4 w-4 text-slate-500" />
            Dynamic User Access Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                  <th className="py-2 px-2">Identity</th>
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2 text-right">Role Claim</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const badge = roleBadgeConfig[item.role] || roleBadgeConfig.VIEWER;
                  return (
                    <tr key={item.id} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                      <td className="py-2.5 px-2">
                        <p className="font-semibold text-slate-200 text-[11px]">{item.name}</p>
                        <p className="text-[9px] text-slate-600 font-mono mt-0.5">{item.id}</p>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 font-mono text-[10px]">{item.email}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={`inline-flex px-2 py-0.5 border rounded text-[9px] font-bold font-mono tracking-wider ${badge.bg} ${badge.border} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Audit Log Terminal */}
        <div className="card-panel p-4 flex flex-col gap-3 h-[380px]">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/40 pb-2.5 shrink-0">
            <Terminal className="h-4 w-4 text-slate-500" />
            System Security Audit Tail
            <span className="ml-auto data-label text-slate-600 normal-case font-mono">LIVE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-chip-blink" />
          </h2>

          <div className="flex-1 bg-[#090d16] rounded-xl p-3 font-mono text-[10px] leading-relaxed overflow-y-auto border border-slate-800/60 flex flex-col gap-0.5">
            {auditLogs.map((log, index) => {
              const statusColor =
                log.status === 'SUCCESS' ? 'text-emerald-500' :
                log.status === 'WARN'    ? 'text-amber-500'   :
                log.status === 'INFO'    ? 'text-sky-500'     :
                'text-red-500';
              const operatorColor =
                log.operator === 'KERNEL'     ? 'text-purple-400' :
                log.operator === 'DB_POOL'    ? 'text-blue-400'   :
                log.operator === 'REDIS_POOL' ? 'text-cyan-400'   :
                log.operator === 'AUTH_SVC'   ? 'text-amber-400'  :
                log.operator === 'ADMIN_SVC'  ? 'text-red-400'    :
                'text-emerald-400';
              return (
                <div key={index} className="flex gap-2 items-start hover:bg-emerald-950/5 py-0.5 px-1 rounded transition-all">
                  <span className="text-slate-700 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-semibold shrink-0 ${operatorColor}`}>{log.operator}:</span>
                  <span className="text-slate-400 break-all">{log.action}</span>
                  <span className={`ml-auto ${statusColor} px-1 rounded font-bold uppercase text-[8px] border border-current/20 shrink-0`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
            {/* Blinking cursor */}
            <div className="flex items-center gap-1 py-0.5 px-1 mt-0.5">
              <span className="text-slate-700">&gt;</span>
              <span className="terminal-cursor text-emerald-500" />
            </div>
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
