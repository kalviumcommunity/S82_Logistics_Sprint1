import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LandingHub from './components/LandingHub.jsx';
import AuthGate from './components/AuthGate.jsx';
import CommandDeckLayout from './components/CommandDeckLayout.jsx';
import JourneyTracker from './features/tracking/JourneyTracker.jsx';
import CommandCenter from './features/command-center/CommandCenter.jsx';
import AdminPanel from './features/admin/AdminPanel.jsx';

// Map tab IDs to their workspace components
const WORKSPACE_VIEWS = {
  tracking: JourneyTracker,
  command: CommandCenter,
  admin: AdminPanel,
};

// Default tab per role
const ROLE_DEFAULT_TAB = {
  ADMIN: 'admin',
  OPERATIONS_MANAGER: 'command',
  WAREHOUSE_MANAGER: 'tracking',
  VIEWER: 'tracking',
};

// Role access matrix for tabs
const TAB_ROLES = {
  tracking: ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'],
  command: ['ADMIN', 'OPERATIONS_MANAGER'],
  admin: ['ADMIN'],
};

function WorkspaceContainer() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(() => ROLE_DEFAULT_TAB[user?.role] || 'tracking');

  // If role changes (shouldn't happen, but guard it), reset to default
  useEffect(() => {
    const defaultTab = ROLE_DEFAULT_TAB[user?.role] || 'tracking';
    if (!TAB_ROLES[activeTab]?.includes(user?.role)) {
      setActiveTab(defaultTab);
    }
  }, [user?.role, activeTab]);

  const WorkspaceView = WORKSPACE_VIEWS[activeTab] || JourneyTracker;

  return (
    <CommandDeckLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <WorkspaceView />
    </CommandDeckLayout>
  );
}

function App() {
  const { appState } = useAuth();

  if (appState === 'LANDING') return <LandingHub />;
  if (appState === 'AUTH_GATE') return <AuthGate />;
  if (appState === 'WORKSPACE') return <WorkspaceContainer />;

  // Fallback (shouldn't reach here)
  return <LandingHub />;
}

export default App;
