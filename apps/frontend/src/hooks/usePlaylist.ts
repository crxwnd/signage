/**
 * usePlaylist Hook
 * React Query hook for managing display playlists
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  reorderPlaylist,
} from '@/lib/api/playlists';
import type { PlaylistItem, AddToPlaylistPayload } from '@/lib/api/playlists';
import { toast } from '@/hooks/use-toast';

interface UsePlaylistReturn {
  playlist: PlaylistItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  addContent: (payload: AddToPlaylistPayload) => Promise<void>;
  removeContent: (itemId: string) => Promise<void>;
  moveUp: (itemId: string) => Promise<void>;
  moveDown: (itemId: string) => Promise<void>;
  isAdding: boolean;
  isRemoving: boolean;
  isReordering: boolean;
}

/**
 * Hook for managing a display's playlist
 *
 * @param displayId - The display ID to manage playlist for
 * @returns Playlist data, loading states, and mutation functions
 *
 * @example
 * ```tsx
 * const { playlist, addContent, removeContent, moveUp, moveDown, isLoading } = usePlaylist(displayId);
 * ```
 */
export function usePlaylist(displayId: string): UsePlaylistReturn {
  const queryClient = useQueryClient();
  const queryKey = ['playlist', displayId];

  // Query for playlist data
  const {
    data: playlist = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getPlaylist(displayId),
    enabled: !!displayId,
    staleTime: 5 * 1000, // 5 seconds
  });

  // Mutation: Add content to playlist
  const addMutation = useMutation({
    mutationFn: (payload: AddToPlaylistPayload) =>
      addToPlaylist(displayId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Content added',
        description: 'The content has been added to the playlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Remove content from playlist
  const removeMutation = useMutation({
    mutationFn: removeFromPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Content removed',
        description: 'The content has been removed from the playlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Reorder playlist
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      reorderPlaylist(displayId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reorder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Add content
  const addContent = async (payload: AddToPlaylistPayload) => {
    await addMutation.mutateAsync(payload);
  };

  // Helper: Remove content
  const removeContent = async (itemId: string) => {
    await removeMutation.mutateAsync(itemId);
  };

  // Helper: Move item up in order
  const moveUp = async (itemId: string) => {
    const index = playlist.findIndex((item) => item.id === itemId);
    if (index <= 0) return; // Already at top

    const newPlaylist = [...playlist];
    // Swap with previous item using destructuring
    [newPlaylist[index - 1], newPlaylist[index]] = [
      newPlaylist[index]!,
      newPlaylist[index - 1]!,
    ];

    // Create new order mapping
    const items = newPlaylist.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    await reorderMutation.mutateAsync(items);
  };

  // Helper: Move item down in order
  const moveDown = async (itemId: string) => {
    const index = playlist.findIndex((item) => item.id === itemId);
    if (index === -1 || index >= playlist.length - 1) return; // Already at bottom

    const newPlaylist = [...playlist];
    // Swap with next item using destructuring
    [newPlaylist[index], newPlaylist[index + 1]] = [
      newPlaylist[index + 1]!,
      newPlaylist[index]!,
    ];

    // Create new order mapping
    const items = newPlaylist.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    await reorderMutation.mutateAsync(items);
  };

  return {
    playlist,
    isLoading,
    error: error as Error | null,
    refetch,
    addContent,
    removeContent,
    moveUp,
    moveDown,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
