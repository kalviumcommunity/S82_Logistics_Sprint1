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

    // Response Interceptor: compute latency and extract cache source headers
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
      (error) => {
        const startTime = error.config?.metadata?.startTime;
        const latency = startTime ? Math.round(performance.now() - startTime) : null;

        setNetworkStats({
          latencyMs: latency,
          source: 'error',
        });

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
