import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';

// Note: socket.io-client needs to be installed: npm install socket.io-client
// For now, we'll define a minimal type to avoid errors
type Socket = any;
let io: any;

// Try to import socket.io-client if available
if (typeof window !== 'undefined') {
  try {
    const socketIO = require('socket.io-client');
    io = socketIO.io || socketIO.default;
  } catch (e) {
    console.warn('[WebSocket] socket.io-client not installed. Run: npm install socket.io-client');
  }
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002';

type WebSocketEvent = 
  | 'publicationCreated'
  | 'publicationUpdated'
  | 'publicationDeleted'
  | 'userCreated'
  | 'userUpdated'
  | 'userDeleted'
  | 'examCreated'
  | 'examUpdated'
  | 'examDeleted'
  | 'classUpdated'
  | 'newEnrollment'
  | 'statsUpdated'
  | 'systemNotification';

interface WebSocketEventData {
  [key: string]: any;
  timestamp: string;
}

type EventHandler = (data: WebSocketEventData) => void;

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<WebSocketEvent, Set<EventHandler>>>(new Map());
  const { user } = useAuthStore();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    // Check if socket.io-client is available
    if (!io) {
      console.warn('[WebSocket] socket.io-client not available');
      return;
    }

    // Only connect if user is authenticated and has admin/teacher role
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'INTERNAL_TEACHER' && user.role !== 'EXTERNAL_TEACHER')) {
      return;
    }

    // Get token from cookie or storage (socket.io will use cookies automatically)
    const socket = io(`${WS_URL}/admin`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to admin gateway');
      reconnectAttemptsRef.current = 0;
    });

    socket.on('connected', (data: any) => {
      console.log('[WebSocket] Connection confirmed:', data.message);
    });

    socket.on('disconnect', (reason: any) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: any) => {
      console.error('[WebSocket] Connection error:', error.message);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        socket.disconnect();
      }
    });

    // Set up event listeners for all registered handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      socket.on(event, (data: WebSocketEventData) => {
        handlers.forEach(handler => handler(data));
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Subscribe to events
  const subscribe = useCallback((event: WebSocketEvent, handler: EventHandler) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    
    eventHandlersRef.current.get(event)!.add(handler);

    // If socket is already connected, register the listener
    if (socketRef.current?.connected) {
      socketRef.current.on(event, handler);
    }

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(event);
        }
      }
      
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  // Check if connected
  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    subscribe,
    isConnected,
    reconnect,
    disconnect,
  };
};
