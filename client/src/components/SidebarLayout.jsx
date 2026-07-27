import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../context/ApiContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Search, Map, Settings, Shield, User } from 'lucide-react';
import Header from './Header.jsx';
import AlertToastContainer from './AlertToastContainer.jsx';

export const SidebarLayout = () => {
  const { user } = useAuth();
  const { networkStats } = useApi();
  const { socket } = useSocket();
  const [dbHealthy, setDbHealthy] = useState(true);

  useEffect(() => {
    if (!socket) return;
    const handleTelemetry = (data) => {
      setDbHealthy(data.mongoStatus === 'healthy');
    };
    socket.on('system:telemetry', handleTelemetry);
    return () => {
      socket.off('system:telemetry', handleTelemetry);
    };
  }, [socket]);

  // Master navigation registry containing path, label, icon, and role authorization claims
  const navItems = [
    {
      path: '/tracking',
      label: 'Shipment Tracker',
      icon: Search,
      roles: ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'],
    },
    {
      path: '/command',
      label: 'Command Center',
      icon: Map,
      roles: ['ADMIN', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/admin',
      label: 'Admin Operations',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  // Filter paths matching user claims
  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  // Dynamic role badges matching industrial palette
  const roleBadgeStyles = {
    ADMIN: 'bg-red-950/20 text-red-500 border-red-900/40',
    OPERATIONS_MANAGER: 'bg-amber-950/20 text-amber-500 border-amber-900/40',
    WAREHOUSE_MANAGER: 'bg-blue-950/20 text-blue-500 border-blue-900/40',
    VIEWER: 'bg-slate-950/20 text-slate-400 border-slate-800/60',
  };

  return (
    <div className="flex h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Slim Sophisticated Left Sidebar Menu */}
      <aside className="w-60 bg-[#0f172a] border-r border-slate-800/60 flex flex-col justify-between p-4 shrink-0">
        <div className="flex flex-col gap-6">
          {/* Platform Header Logo */}
          <div className="flex items-center gap-2 px-2 py-1">
            <Shield className="h-5 w-5 text-slate-400" />
            <span className="font-bold text-xs tracking-widest text-slate-200 uppercase">
              CASCADING DELAY
            </span>
          </div>

          {/* Dynamic Navigation Tabs List */}
          <nav className="flex flex-col gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-r-md text-xs font-medium transition-all border-l-2 ${
                      isActive
                        ? 'bg-slate-800/40 text-slate-100 border-sky-500'
                        : 'text-slate-400 hover:bg-slate-800/20 hover:text-slate-200 border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Active Auth Profile Status Card */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 rounded-md border border-slate-800/60">
              <User className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-300 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{user.id}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              Authorized Claims
            </span>
            <div
              className={`text-center py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${
                roleBadgeStyles[user.role]
              }`}
            >
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Page Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#090d16] relative">
        <AlertToastContainer />
        <Header />

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
