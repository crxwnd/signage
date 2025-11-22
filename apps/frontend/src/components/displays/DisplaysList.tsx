/**
 * DisplaysList Client Component
 * Client component that listens to Socket.io events for real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { DisplayCard } from './DisplayCard';
import { toast } from 'sonner';
import type { Display } from '@shared-types';

interface DisplaysListProps {
  initialDisplays: Display[];
  initialTotal: number;
}

export function DisplaysList({ initialDisplays, initialTotal }: DisplaysListProps) {
  const { socket, isConnected } = useSocket();
  const [displays, setDisplays] = useState<Display[]>(initialDisplays);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for display created event
    socket.on('display:created', (data) => {
      console.log('[Socket.io] Display created:', data);

      setDisplays((prev) => [
        {
          id: data.display.id,
          name: data.display.name,
          location: data.display.location,
          status: data.display.status,
          hotelId: data.display.hotelId,
          areaId: data.display.areaId,
          lastSeen: null,
          deviceInfo: null,
          pairingCode: null,
          pairedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...prev,
      ]);
      setTotal((prev) => prev + 1);

      toast.success('Display created', {
        description: `${data.display.name} has been added`,
      });
    });

    // Listen for display updated event
    socket.on('display:updated', (data) => {
      console.log('[Socket.io] Display updated:', data);

      setDisplays((prev) =>
        prev.map((display) => {
          if (display.id === data.display.id) {
            return {
              ...display,
              name: data.display.name,
              location: data.display.location,
              status: data.display.status,
              areaId: data.display.areaId,
              updatedAt: new Date(),
            };
          }
          return display;
        })
      );

      toast.info('Display updated', {
        description: `${data.display.name} has been modified`,
      });
    });

    // Listen for display deleted event
    socket.on('display:deleted', (data) => {
      console.log('[Socket.io] Display deleted:', data);

      // Find the display name before removing
      const deletedDisplay = displays.find((d) => d.id === data.displayId);

      setDisplays((prev) => prev.filter((display) => display.id !== data.displayId));
      setTotal((prev) => prev - 1);

      toast.error('Display deleted', {
        description: deletedDisplay
          ? `${deletedDisplay.name} has been removed`
          : 'A display has been removed',
      });
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('display:created');
      socket.off('display:updated');
      socket.off('display:deleted');
    };
  }, [socket, isConnected, displays]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          All Displays ({total})
        </h3>
        {isConnected && (
          <span className="text-xs text-muted-foreground">
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Real-time updates active
          </span>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displays.map((display) => (
          <DisplayCard key={display.id} display={display} />
        ))}
      </div>
    </div>
  );
}
