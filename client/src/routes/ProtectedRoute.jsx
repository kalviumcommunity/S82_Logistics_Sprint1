import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute — Dynamic route & role access guard.
 * Unauthenticated users -> Redirected to /auth (AUTH_GATE)
 * Unauthorized users -> Redirected to /track (tracking view)
 */
export const ProtectedRoute = ({ allowedRoles = [], children, fallbackTab = 'tracking', onUnauthorized }) => {
  const { user, appState, openAuthGate } = useAuth();

  // If not authenticated or workspace state is inactive
  if (appState !== 'WORKSPACE' || !user) {
    if (onUnauthorized) {
      onUnauthorized('auth');
    } else {
      openAuthGate();
    }
    return null;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (onUnauthorized) {
      onUnauthorized(fallbackTab);
    }
    return null;
  }

  return children;
};

export default ProtectedRoute;
