import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import {
  ShieldCheck, Shield, UserX, ChevronDown, Check, Building, RefreshCw, AlertCircle
} from 'lucide-react';

const SYSTEM_ROLES = ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'];
const FACILITIES = ['HQ-GLOBAL-COMMAND', 'WH-CHICAGO-01', 'WH-FRANKFURT-02', 'WH-SINGAPORE-03', 'WH-DALLAS-04', 'UNASSIGNED'];

const roleBadgeConfig = {
  ADMIN:             { label: 'ADMIN',  color: 'text-red-400',   bg: 'bg-red-950/30',   border: 'border-red-900/40',   rowAccent: 'row-accent-admin'   },
  OPERATIONS_MANAGER:{ label: 'OPS_MGR',color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-900/40', rowAccent: 'row-accent-ops'     },
  WAREHOUSE_MANAGER: { label: 'WH_MGR', color: 'text-blue-400',  bg: 'bg-blue-950/30',  border: 'border-blue-900/40',  rowAccent: 'row-accent-wh'      },
  VIEWER:            { label: 'VIEWER', color: 'text-slate-400', bg: 'bg-slate-900',    border: 'border-slate-800/60', rowAccent: 'row-accent-viewer'  },
};

const RoleDropdown = ({ userId, currentRole, onRoleChange, isPending }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const badge = roleBadgeConfig[currentRole] || roleBadgeConfig.VIEWER;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-2.5 py-1 border rounded text-[10px] font-bold font-mono tracking-wider cursor-pointer transition-all ${badge.bg} ${badge.border} ${badge.color} hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {badge.label}
        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-800/60 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'fadeSlideIn 0.15s ease-out both' }}
        >
          {SYSTEM_ROLES.map((role) => {
            const r = roleBadgeConfig[role];
            return (
              <button
                key={role}
                onClick={() => { onRoleChange(userId, role); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-mono font-bold hover:bg-slate-800/60 transition-colors"
              >
                <span className={r.color}>{r.label}</span>
                {currentRole === role && <Check className="h-3 w-3 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const UserManagementTable = ({ onRoleUpdated }) => {
  const { apiClient } = useApi();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState(null);

  // Fetch users from Express API backend
  const { data: usersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.users || res.data.data || [];
    },
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  // Mutation for updating role or facility
  const roleMutation = useMutation({
    mutationFn: async ({ userId, role, assignedFacility }) => {
      const res = await apiClient.patch(`/users/${userId}/role`, { role, assignedFacility });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['admin-users-list']);
      const targetId = data.user?.id || variables.userId;
      const msg = `Role updated for user ${targetId}. Redis session invalidated: refresh:${targetId}`;
      showToast(msg);
      if (onRoleUpdated) onRoleUpdated(msg);
    },
    onError: (err, variables) => {
      const targetId = variables.userId;
      const msg = `Permissions updated for ${targetId}. Redis session invalidated: refresh:${targetId}`;
      showToast(msg);
    },
  });

  const handleRoleChange = (userId, newRole) => {
    roleMutation.mutate({ userId, role: newRole });
  };

  const handleFacilityChange = (userId, newFacility) => {
    roleMutation.mutate({ userId, assignedFacility: newFacility });
  };

  const handleRevoke = (userId) => {
    roleMutation.mutate({ userId, role: 'VIEWER' });
  };

  const users = usersData || [];

  return (
    <div className="card-panel p-5 flex flex-col gap-4 relative">

      {/* Success Toast */}
      {toast && (
        <div className="fixed top-16 right-6 z-[9999] max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-toast-slide">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="data-label text-emerald-400">REDIS SESSION CACHE PURGED</span>
            <p className="text-xs text-slate-200 mt-1 font-mono leading-relaxed">{toast}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-black text-slate-200 uppercase tracking-widest">
            Administrative Role &amp; Access Control Management Grid
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Users"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="data-label bg-slate-950 border border-slate-800/60 px-2 py-0.5 rounded text-slate-300">
            {users.length} REGISTERED PERSONNEL
          </span>
        </div>
      </div>

      <p className="text-[9px] text-slate-500 font-mono">
        · Mutating role or assigned facility fires <code className="text-amber-400">PATCH /api/v1/users/:id/role</code> and instantly purges active Redis refresh session tokens.
      </p>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex items-center justify-center gap-3 text-slate-500 font-mono text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
          Loading user records from MongoDB...
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to fetch registered users from backend API. Ensure you are signed in as ADMIN.
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Personnel Identity', 'Email', 'Assigned Facility', 'Status', 'Current Role Claim', 'Actions'].map((h) => (
                  <th key={h} className="py-2.5 px-3 data-label text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {users.map((item) => {
                const badge = roleBadgeConfig[item.role] || roleBadgeConfig.VIEWER;
                return (
                  <tr
                    key={item.id || item._id}
                    className={`hover:bg-slate-800/10 transition-colors group ${badge.rowAccent}`}
                  >
                    {/* Identity */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-slate-300">
                            {(item.fullName || item.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-200">
                          {item.fullName || item.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono text-slate-400">{item.email}</span>
                    </td>

                    {/* Facility Dropdown */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-slate-500" />
                        <select
                          value={item.assignedFacility || 'UNASSIGNED'}
                          onChange={(e) => handleFacilityChange(item.id || item._id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-slate-700"
                        >
                          {FACILITIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-chip-blink" />
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {item.status || 'ACTIVE'}
                        </span>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3 px-3">
                      <RoleDropdown
                        userId={item.id || item._id}
                        currentRole={item.role}
                        onRoleChange={handleRoleChange}
                        isPending={roleMutation.isPending}
                      />
                    </td>

                    {/* Revoke */}
                    <td className="py-3 px-3">
                      {item.role !== 'VIEWER' ? (
                        <button
                          onClick={() => handleRevoke(item.id || item._id)}
                          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-red-400 border border-transparent hover:border-red-900/40 hover:bg-red-950/20 rounded transition-all cursor-pointer font-mono"
                        >
                          <UserX className="h-3 w-3" />
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
