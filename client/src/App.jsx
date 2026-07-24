import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LandingHub from './components/LandingHub.jsx';
import AuthGate from './components/AuthGate.jsx';
import CommandDeckLayout from './components/CommandDeckLayout.jsx';
import JourneyTracker from './features/tracking/JourneyTracker.jsx';
import CommandCenter from './features/command-center/CommandCenter.jsx';
import AdminPanel from './features/admin/AdminPanel.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { RefreshCw } from 'lucide-react';

// Workspace view components
const WORKSPACE_VIEWS = {
  tracking: JourneyTracker,
  command: CommandCenter,
  warehouse: JourneyTracker, // Facility / Warehouse Deck view
  admin: AdminPanel,
};

// Default tab per role
const ROLE_DEFAULT_TAB = {
  ADMIN: 'admin',
  OPERATIONS_MANAGER: 'command',
  WAREHOUSE_MANAGER: 'tracking',
  VIEWER: 'tracking',
};

// Role access matrix per route/tab specification
const TAB_ROLES = {
  tracking: ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'], // /track
  command: ['ADMIN', 'OPERATIONS_MANAGER'],                                // /command
  warehouse: ['ADMIN', 'WAREHOUSE_MANAGER'],                               // /warehouse
  admin: ['ADMIN'],                                                       // /admin
};

function WorkspaceContainer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => ROLE_DEFAULT_TAB[user?.role] || 'tracking');

  // Reset tab to authorized default if user's role claim changes
  useEffect(() => {
    const allowed = TAB_ROLES[activeTab] || [];
    if (!allowed.includes(user?.role)) {
      setActiveTab(ROLE_DEFAULT_TAB[user?.role] || 'tracking');
    }
  }, [user?.role, activeTab]);

  const CurrentView = WORKSPACE_VIEWS[activeTab] || JourneyTracker;
  const allowedRolesForCurrentTab = TAB_ROLES[activeTab] || [];

  return (
    <CommandDeckLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ProtectedRoute
        allowedRoles={allowedRolesForCurrentTab}
        fallbackTab="tracking"
        onUnauthorized={(target) => {
          if (target === 'auth') {
            // Handled by AuthContext openAuthGate
          } else {
            setActiveTab('tracking'); // Bounce unauthorized attempt to /track
          }
        }}
      >
        <CurrentView />
      </ProtectedRoute>
    </CommandDeckLayout>
  );
}

function App() {
  const { appState, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#090d16] flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
        <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
        <span>Verifying Security Perimeter &amp; Redis Tokens...</span>
      </div>
    );
  }

  if (appState === 'LANDING') return <LandingHub />;
  if (appState === 'AUTH_GATE') return <AuthGate />;
  if (appState === 'WORKSPACE') return <WorkspaceContainer />;

  return <LandingHub />;
}

export default App;
