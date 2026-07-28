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
              className={`pill-nav-btn relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold cursor-pointer transition-all duration-200 select-none ${
                isActive
                  ? 'bg-slate-800/90 text-emerald-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'text-emerald-400' : ''}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationDock;
