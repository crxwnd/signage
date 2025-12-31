'use client';

/**
 * Sync Groups Hooks
 * React Query hooks for sync group management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSyncGroups,
    getSyncGroup,
    createSyncGroup,
    updateSyncGroup,
    deleteSyncGroup,
    startSyncPlayback,
    pauseSyncPlayback,
    resumeSyncPlayback,
    seekSyncPlayback,
    stopSyncPlayback,
    assignConductor,
    type CreateSyncGroupRequest,
    type UpdateSyncGroupRequest,
} from '@/lib/api/sync';
import { useToast } from '@/hooks/use-toast';

// Query keys
const SYNC_GROUPS_KEY = ['sync-groups'];
const syncGroupKey = (id: string) => ['sync-group', id];

/**
 * Get all sync groups
 */
export function useSyncGroups() {
    return useQuery({
        queryKey: SYNC_GROUPS_KEY,
        queryFn: getSyncGroups,
        refetchInterval: 5000, // Refresh every 5s to get updated status
    });
}

/**
 * Get a specific sync group
 */
export function useSyncGroup(id: string) {
    return useQuery({
        queryKey: syncGroupKey(id),
        queryFn: () => getSyncGroup(id),
        enabled: !!id,
        refetchInterval: 2000, // More frequent for active group
    });
}

/**
 * Create a new sync group
 */
export function useCreateSyncGroup() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (data: CreateSyncGroupRequest) => createSyncGroup(data),
        onSuccess: (newGroup) => {
            queryClient.invalidateQueries({ queryKey: SYNC_GROUPS_KEY });
            toast({
                title: 'Sync group created',
                description: `Group "${newGroup.name}" has been created.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to create group',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Update a sync group
 */
export function useUpdateSyncGroup() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateSyncGroupRequest }) =>
            updateSyncGroup(id, data),
        onSuccess: (updatedGroup) => {
            queryClient.invalidateQueries({ queryKey: SYNC_GROUPS_KEY });
            queryClient.invalidateQueries({ queryKey: syncGroupKey(updatedGroup.id) });
            toast({
                title: 'Sync group updated',
                description: `Group "${updatedGroup.name}" has been updated.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to update group',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Delete a sync group
 */
export function useDeleteSyncGroup() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (id: string) => deleteSyncGroup(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SYNC_GROUPS_KEY });
            toast({
                title: 'Sync group deleted',
                description: 'The sync group has been deleted.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to delete group',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Playback control mutations for a specific group
 */
export function useSyncGroupControls(groupId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const invalidateGroup = () => {
        queryClient.invalidateQueries({ queryKey: SYNC_GROUPS_KEY });
        queryClient.invalidateQueries({ queryKey: syncGroupKey(groupId) });
    };

    const startMutation = useMutation({
        mutationFn: ({ contentId, startPosition }: { contentId: string; startPosition?: number }) =>
            startSyncPlayback(groupId, contentId, startPosition),
        onSuccess: () => {
            invalidateGroup();
            toast({ title: 'Playback started' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to start', description: error.message, variant: 'destructive' });
        },
    });

    const pauseMutation = useMutation({
        mutationFn: () => pauseSyncPlayback(groupId),
        onSuccess: () => {
            invalidateGroup();
            toast({ title: 'Playback paused' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to pause', description: error.message, variant: 'destructive' });
        },
    });

    const resumeMutation = useMutation({
        mutationFn: () => resumeSyncPlayback(groupId),
        onSuccess: () => {
            invalidateGroup();
            toast({ title: 'Playback resumed' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to resume', description: error.message, variant: 'destructive' });
        },
    });

    const seekMutation = useMutation({
        mutationFn: (position: number) => seekSyncPlayback(groupId, position),
        onSuccess: () => {
            invalidateGroup();
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to seek', description: error.message, variant: 'destructive' });
        },
    });

    const stopMutation = useMutation({
        mutationFn: () => stopSyncPlayback(groupId),
        onSuccess: () => {
            invalidateGroup();
            toast({ title: 'Playback stopped' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to stop', description: error.message, variant: 'destructive' });
        },
    });

    const assignConductorMutation = useMutation({
        mutationFn: (displayId: string) => assignConductor(groupId, displayId),
        onSuccess: () => {
            invalidateGroup();
            toast({ title: 'Conductor assigned' });
        },
        onError: (error: Error) => {
            toast({ title: 'Failed to assign conductor', description: error.message, variant: 'destructive' });
        },
    });

    return {
        start: startMutation,
        pause: pauseMutation,
        resume: resumeMutation,
        seek: seekMutation,
        stop: stopMutation,
        assignConductor: assignConductorMutation,
        isLoading: startMutation.isPending || pauseMutation.isPending ||
            resumeMutation.isPending || stopMutation.isPending,
    };
}
