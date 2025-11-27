/**
 * useDisplaysRealtime Hook
 * Listens to Socket.io display events and updates React Query cache in real-time
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';
import { toast } from '@/components/ui';
import type {
  Display,
  DisplayCreatedEvent,
  DisplayUpdatedEvent,
  DisplayDeletedEvent,
  DisplayFilter,
} from '@shared-types';

interface UseDisplaysRealtimeOptions {
  filter?: DisplayFilter;
  enabled?: boolean;
}

/**
 * Hook to enable real-time updates for displays
 * Listens to Socket.io events and updates React Query cache
 *
 * @param options - Options including filter and enabled flag
 *
 * @example
 * ```tsx
 * // Use in a component that displays the displays list
 * useDisplaysRealtime({ filter: { status: 'ONLINE' } });
 * ```
 */
export function useDisplaysRealtime(
  options: UseDisplaysRealtimeOptions = {}
): void {
  const { filter, enabled = true } = options;
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return;
    }

    console.log('[useDisplaysRealtime] Setting up real-time listeners');

    // Handler for display:created event
    const handleDisplayCreated = (data: DisplayCreatedEvent) => {
      console.log('[useDisplaysRealtime] Display created:', data);

      // Update displays query cache
      queryClient.setQueryData<{
        items: Display[];
        total: number;
        page: number;
        limit: number;
      }>(['displays', filter], (oldData) => {
        if (!oldData) return oldData;

        // Add new display to the beginning of the list
        return {
          ...oldData,
          items: [data.display as Display, ...oldData.items],
          total: oldData.total + 1,
        };
      });

      // Invalidate stats to refetch updated counts
      void queryClient.invalidateQueries({ queryKey: ['displays-stats'] });

      // Show toast notification
      toast({
        title: 'Display Created',
        description: `${data.display.name} has been created`,
      });
    };

    // Handler for display:updated event
    const handleDisplayUpdated = (data: DisplayUpdatedEvent) => {
      console.log('[useDisplaysRealtime] Display updated:', data);

      // Update displays query cache
      queryClient.setQueryData<{
        items: Display[];
        total: number;
        page: number;
        limit: number;
      }>(['displays', filter], (oldData) => {
        if (!oldData) return oldData;

        // Update the display in the list
        return {
          ...oldData,
          items: oldData.items.map((display) =>
            display.id === data.display.id
              ? ({ ...display, ...data.display } as Display)
              : display
          ),
        };
      });

      // Invalidate stats in case status changed
      void queryClient.invalidateQueries({ queryKey: ['displays-stats'] });

      // Show toast notification
      toast({
        title: 'Display Updated',
        description: `${data.display.name} has been updated`,
      });
    };

    // Handler for display:deleted event
    const handleDisplayDeleted = (data: DisplayDeletedEvent) => {
      console.log('[useDisplaysRealtime] Display deleted:', data);

      // Update displays query cache
      queryClient.setQueryData<{
        items: Display[];
        total: number;
        page: number;
        limit: number;
      }>(['displays', filter], (oldData) => {
        if (!oldData) return oldData;

        // Remove display from the list
        return {
          ...oldData,
          items: oldData.items.filter((display) => display.id !== data.displayId),
          total: Math.max(0, oldData.total - 1),
        };
      });

      // Invalidate stats to refetch updated counts
      void queryClient.invalidateQueries({ queryKey: ['displays-stats'] });

      // Show toast notification
      toast({
        title: 'Display Deleted',
        description: `Display has been deleted`,
      });
    };

    // Register event listeners
    socket.on('display:created', handleDisplayCreated);
    socket.on('display:updated', handleDisplayUpdated);
    socket.on('display:deleted', handleDisplayDeleted);

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      console.log('[useDisplaysRealtime] Cleaning up real-time listeners');
      socket.off('display:created', handleDisplayCreated);
      socket.off('display:updated', handleDisplayUpdated);
      socket.off('display:deleted', handleDisplayDeleted);
    };
  }, [socket, isConnected, enabled, filter, queryClient]);
}
