import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute — thin workspace access guard.
 * In the new state-machine model, full routing is handled by App.jsx.
 * This component is preserved as a utility for role-level checks if needed.
 */
export const ProtectedRoute = ({ allowedRoles, children, fallback = null }) => {
  const { user, appState } = useAuth();

  if (appState !== 'WORKSPACE' || !user) {
    return fallback;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children ?? null;
};

export default ProtectedRoute;
