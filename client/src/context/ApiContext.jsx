import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const { accessToken } = useAuth();
  const [networkStats, setNetworkStats] = useState({
    latencyMs: null,
    source: null, // 'cache' | 'database'
  });

  // Pre-configured Axios Instance pointing to Express API Gateway
  const apiClient = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:3000/api/v1',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor: attach start time & Authorization header
    instance.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: performance.now() };
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: compute latency, extract cache source headers, handle 401 refresh
    instance.interceptors.response.use(
      (response) => {
        const startTime = response.config.metadata?.startTime;
        const latency = startTime ? Math.round(performance.now() - startTime) : null;
        const source = response.headers['source'] || response.headers['x-source'] || 'database';

        setNetworkStats({
          latencyMs: latency,
          source,
        });

        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const startTime = originalRequest?.metadata?.startTime;
        const latency = startTime ? Math.round(performance.now() - startTime) : null;

        setNetworkStats({
          latencyMs: latency,
          source: 'error',
        });

        // 401 Interception for protected endpoints: try silent refresh once if token expired
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/login') &&
          !originalRequest.url?.includes('/auth/refresh') &&
          !originalRequest.url?.includes('/auth/me')
        ) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post(
              'http://localhost:3000/api/v1/auth/refresh',
              {},
              { withCredentials: true }
            );
            const newAccessToken = refreshRes.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return instance(originalRequest);
            }
          } catch (refreshErr) {
            // Refresh failed: purge invalid local token
            localStorage.removeItem('accessToken');
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken]);

  return (
    <ApiContext.Provider value={{ apiClient, networkStats }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export default ApiContext;
