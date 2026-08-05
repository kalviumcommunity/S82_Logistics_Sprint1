import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute — Dynamic route & role access guard.
 * Unauthenticated users -> Redirected to /auth (AUTH_GATE)
 * Unauthorized users -> Redirected to /track (tracking view)
 */
export const ProtectedRoute = ({ allowedRoles = [], children, fallbackTab = 'tracking', onUnauthorized }) => {
  const { user, appState, openAuthGate } = useAuth();

  const isAuthenticated = appState === 'WORKSPACE' && Boolean(user);
  const isAuthorized = !allowedRoles.length || (user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!isAuthenticated) {
      if (onUnauthorized) {
        onUnauthorized('auth');
      } else {
        openAuthGate();
      }
    } else if (!isAuthorized) {
      if (onUnauthorized) {
        onUnauthorized(fallbackTab);
      }
    }
  }, [isAuthenticated, isAuthorized, onUnauthorized, openAuthGate, fallbackTab]);

  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
