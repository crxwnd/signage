/**
 * Socket Provider
 * React Context for Socket.io client
 * Protected against React StrictMode double-mount
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { initializeSocket, releaseSocket, TypedSocket } from '@/lib/socket';

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isConnecting: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const mountedRef = useRef(false);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    // Track if this effect instance is still valid
    let isCurrentMount = true;

    // Prevent duplicate initialization logging, but always setup
    if (mountedRef.current) {
      console.log('[SocketProvider] Re-mount detected (StrictMode)');
    }
    mountedRef.current = true;

    // Initialize socket
    const socketInstance = initializeSocket();
    socketRef.current = socketInstance;

    if (isCurrentMount) {
      setSocket(socketInstance);
    }

    // Event handlers with mount check
    const handleConnect = () => {
      console.log('[SocketProvider] Connected');
      if (isCurrentMount) {
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    const handleDisconnect = () => {
      console.log('[SocketProvider] Disconnected');
      if (isCurrentMount) {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    const handleConnectError = (error: Error) => {
      console.error('[SocketProvider] Connection error:', error.message);
      if (isCurrentMount) {
        setIsConnecting(false);
      }
    };

    // Attach listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Check if already connected
    if (socketInstance.connected) {
      setIsConnected(true);
      setIsConnecting(false);
    }

    // Cleanup
    return () => {
      isCurrentMount = false;

      // Remove only our listeners, don't kill the socket
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);

      // Release our reference (socket stays alive)
      releaseSocket();
    };
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    isConnecting,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access socket instance and connection status
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
}
