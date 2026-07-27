import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Map, Settings, Warehouse } from 'lucide-react';

// Master tab registry with role access lists
const NAVIGATION_TABS = [
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
    id: 'warehouse',
    label: 'Facility Deck',
    icon: Warehouse,
    roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
  },
  {
    id: 'admin',
    label: 'Admin Operations',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

export const NavigationDock = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'VIEWER';

  // Filter visible tabs dynamically based on user role claim
  const visibleTabs = NAVIGATION_TABS.filter((tab) => tab.roles.includes(currentRole));

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]">
      <div className="bottom-pill-nav flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-dock-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`pill-nav-btn relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 select-none ${
                isActive
                  ? 'bg-slate-800/90 text-emerald-400 font-bold border border-slate-700/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:scale-[1.02]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-chip-blink shadow-[0_0_6px_#10b981]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationDock;
