/**
 * Connection Status Component
 * Shows Socket.io connection status badge
 */

'use client';

import { WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useSocket } from '@/providers/SocketProvider';

export function ConnectionStatus() {
  const { isConnected, isConnecting } = useSocket();

  if (isConnecting) {
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Connecting...</span>
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge
        variant="default"
        className="flex items-center gap-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20"
      >
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </div>
        <span className="text-xs">Connected</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="destructive"
      className="flex items-center gap-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20"
    >
      <WifiOff className="h-3 w-3" />
      <span className="text-xs">Disconnected</span>
    </Badge>
  );
}
