/**
 * Socket Provider
 * React Context for Socket.io client
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, TypedSocket } from '@/lib/socket';

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
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    setIsConnecting(true);
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    // Connection event handlers
    const handleConnect = () => {
      console.log('[SocketProvider] Connected');
      setIsConnected(true);
      setIsConnecting(false);
    };

    const handleDisconnect = () => {
      console.log('[SocketProvider] Disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleReconnectAttempt = () => {
      console.log('[SocketProvider] Attempting to reconnect...');
      setIsConnecting(true);
      setIsConnected(false);
    };

    // Attach event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    (socketInstance as any).on('reconnect_attempt', handleReconnectAttempt);

    // Check initial connection state
    if (socketInstance.connected) {
      setIsConnected(true);
      setIsConnecting(false);
    }

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      (socketInstance as any).off('reconnect_attempt', handleReconnectAttempt);
      disconnectSocket();
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
