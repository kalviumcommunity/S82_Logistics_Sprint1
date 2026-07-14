import React, { createContext, useContext, useState } from 'react';

// === Auth State Machine ===
// appState: 'LANDING' | 'AUTH_GATE' | 'WORKSPACE'
// user: null | { id, name, email, role }

const ADMIN_EMAIL = 'adminlogistics@gmail.com';
const ADMIN_PASSWORD = 'zxcvbnm0987654321';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [appState, setAppState] = useState('LANDING');
  const [user, setUser] = useState(null);

  // Navigate to the auth gate
  const openAuthGate = () => {
    setAppState('AUTH_GATE');
  };

  // Navigate back to the landing hub (also logs out)
  const returnToLanding = () => {
    setAppState('LANDING');
    setUser(null);
  };

  // Role display name map
  const roleDisplayNames = {
    ADMIN: 'Alexander Mercer',
    OPERATIONS_MANAGER: 'Sarah Jenkins',
    WAREHOUSE_MANAGER: 'David Miller',
    VIEWER: 'Emily Watson',
  };

  const roleIdMap = {
    ADMIN: 'USR-001',
    OPERATIONS_MANAGER: 'USR-002',
    WAREHOUSE_MANAGER: 'USR-003',
    VIEWER: 'USR-004',
  };

  /**
   * Attempt login. Returns { success: boolean, error?: string }
   * ADMIN role enforces hardcoded credential check.
   * All other roles are accepted with any non-empty input.
   */
  const login = (email, password, role) => {
    if (role === 'ADMIN') {
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Access Denied: Invalid Administrative Credentials' };
      }
    }

    if (!email.trim() || !password.trim()) {
      return { success: false, error: 'Email and Password are required.' };
    }

    const sessionUser = {
      id: roleIdMap[role],
      name: roleDisplayNames[role],
      email: email.trim(),
      role,
    };

    setUser(sessionUser);
    setAppState('WORKSPACE');
    return { success: true };
  };

  const logout = () => {
    returnToLanding();
  };

  // Role-based access check
  const hasAccess = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{ appState, user, openAuthGate, returnToLanding, login, logout, hasAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
