import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const [networkStats, setNetworkStats] = useState({
    latencyMs: null,
    source: null, // 'cache' | 'database'
  });

  // Pre-configured Axios Instance pointing to Express API Gateway
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor: attach start time to measure latency
  apiClient.interceptors.request.use((config) => {
    config.metadata = { startTime: performance.now() };
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // Response Interceptor: compute latency and extract cache source headers
  apiClient.interceptors.response.use((response) => {
    const startTime = response.config.metadata?.startTime;
    const latency = startTime ? Math.round(performance.now() - startTime) : null;
    
    // Extract source header
    const source = response.headers['source'] || response.headers['x-source'] || 'database';

    setNetworkStats({
      latencyMs: latency,
      source,
    });

    return response;
  }, (error) => {
    const startTime = error.config?.metadata?.startTime;
    const latency = startTime ? Math.round(performance.now() - startTime) : null;
    
    setNetworkStats({
      latencyMs: latency,
      source: 'error',
    });

    return Promise.reject(error);
  });

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
