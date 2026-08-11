import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute — Dynamic route & role access guard.
 * Unauthenticated users -> Redirected to /auth
 * Unauthorized users -> Redirected to fallbackTab
 */
export const ProtectedRoute = ({ allowedRoles = [], children, fallbackTab = 'track' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAuthorized = !allowedRoles.length || allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return <Navigate to={`/${fallbackTab}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
