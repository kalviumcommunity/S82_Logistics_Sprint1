import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api/v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [appState, setAppState] = useState('LANDING'); // 'LANDING' | 'AUTH_GATE' | 'WORKSPACE'
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigate to auth gate view
  const openAuthGate = () => {
    setAppState('AUTH_GATE');
  };

  // Return to landing hub
  const returnToLanding = () => {
    setAppState('LANDING');
  };

  // Helper to set auth state and setup token header
  const handleAuthSuccess = (userData, token) => {
    const formattedUser = {
      id: userData.id || userData._id,
      name: userData.fullName || userData.name || userData.email.split('@')[0],
      fullName: userData.fullName || userData.name,
      email: userData.email,
      role: userData.role,
      assignedFacility: userData.assignedFacility || 'HQ-MAIN',
      status: userData.status || 'ACTIVE',
    };
    setUser(formattedUser);
    setAccessToken(token);
    setAppState('WORKSPACE');
  };

  // Attempt login with backend API
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email: email.trim(), password: password.trim() },
        { withCredentials: true }
      );

      const { user: userData, accessToken: token } = response.data;
      handleAuthSuccess(userData, token);
      return { success: true, user: userData };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Authentication failed. Please verify credentials.';
      return { success: false, error: errorMsg };
    }
  };

  // Register new user account
  const register = async (email, password, fullName) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
        },
        { withCredentials: true }
      );

      return {
        success: true,
        message: response.data.message,
        user: response.data.user,
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  // Logout user and revoke session in Redis
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setAccessToken(null);
      setAppState('LANDING');
    }
  };

  // Silent token refresh routine
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { user: userData, accessToken: token } = response.data;
      handleAuthSuccess(userData, token);
    } catch (error) {
      // Silent refresh failed (no valid cookie or session expired)
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Try silent refresh on initial app load
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Check role access helper
  const hasAccess = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        appState,
        setAppState,
        user,
        setUser,
        accessToken,
        setAccessToken,
        isLoading,
        openAuthGate,
        returnToLanding,
        login,
        register,
        logout,
        hasAccess,
        refreshSession,
      }}
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
