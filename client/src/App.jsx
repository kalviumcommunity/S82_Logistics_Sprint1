import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingHub from './components/LandingHub.jsx';
import AuthGate from './components/AuthGate.jsx';
import CommandDeckLayout from './components/CommandDeckLayout.jsx';
import JourneyTracker from './features/tracking/JourneyTracker.jsx';
import CommandCenter from './features/command-center/CommandCenter.jsx';
import WarehouseDeck from './features/warehouse/WarehouseDeck.jsx';
import AdminPanel from './features/admin/AdminPanel.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { RefreshCw } from 'lucide-react';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#090d16] flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
        <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
        <span>Initializing Security Perimeter &amp; Predictive Models...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/command" replace /> : <LandingHub />} />
      <Route path="/auth" element={user ? <Navigate to="/command" replace /> : <AuthGate />} />
      
      <Route element={user ? <CommandDeckLayout /> : <Navigate to="/auth" replace />}>
        <Route path="/track" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER']} fallbackTab="command">
            <JourneyTracker />
          </ProtectedRoute>
        } />
        <Route path="/command" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS_MANAGER']} fallbackTab="track">
            <CommandCenter />
          </ProtectedRoute>
        } />
        <Route path="/warehouse" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']} fallbackTab="command">
            <WarehouseDeck />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']} fallbackTab="command">
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
