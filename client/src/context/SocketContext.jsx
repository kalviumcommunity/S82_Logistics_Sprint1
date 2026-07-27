import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

// Low-frequency tactical warning chime (Web Audio API synth)
const playWarningChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
  }
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const queryClient = useQueryClient();

  const clearAlert = useCallback((id) => {
    setActiveAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  useEffect(() => {
    // Establish connection to backend server with polling handshake and WebSocket upgrade
    const socketInstance = io('http://localhost:3000', {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Auto-join operations and telemetry rooms
      socketInstance.emit('join', 'room:operations');
      socketInstance.emit('join', 'admin');
      socketInstance.emit('join', 'alerts');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      // Graceful connect retry
    });

    // Real-time cascade alert interceptor
    socketInstance.on('cascade:alert', (payload) => {
      const formattedAlert = {
        id: payload.id || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        shipmentId: payload.shipmentId || 'UNKNOWN-SHIPMENT',
        status: payload.status || 'DELAYED',
        riskScore: payload.riskScore ?? 80,
        locationId: payload.locationId || 'HUB-CENTRAL',
        delayReason: payload.delayReason || 'Cascading Route Delay',
        timestamp: payload.timestamp || new Date().toISOString(),
      };

      // Keep maximum last 10 alerts in global state
      setActiveAlerts((prev) => [formattedAlert, ...prev].slice(0, 10));

      // Audio notification chime
      playWarningChime();

      // TanStack Query Cache Invalidation for affected shipment
      if (payload.shipmentId) {
        queryClient.invalidateQueries({ queryKey: ['shipment', payload.shipmentId] });
        queryClient.invalidateQueries({ queryKey: ['shipments'] });
        queryClient.invalidateQueries({ queryKey: ['fleet-shipment-journey'] });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeAlerts,
        clearAlert,
        clearAllAlerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
