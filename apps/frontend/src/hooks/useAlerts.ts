/**
 * useAlerts Hook
 * React Query hooks for alert management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api/alerts';
import type { AlertsFilter } from '@/lib/api/alerts';
import type { CreateAlertDTO } from '@shared-types';

/**
 * Hook to fetch alerts list
 */
export function useAlerts(filter?: AlertsFilter) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['alerts', filter],
        queryFn: () => api.getAlerts(filter),
        enabled: !!user && !authLoading,
    });
}

/**
 * Hook to fetch a single alert by ID
 */
export function useAlert(id: string | undefined) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['alert', id],
        queryFn: () => api.getAlertById(id!),
        enabled: !!user && !authLoading && !!id,
    });
}

/**
 * Hook to create a new alert
 */
export function useCreateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateAlertDTO) => api.createAlert(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}

/**
 * Hook to update an existing alert
 */
export function useUpdateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateAlertDTO> }) =>
            api.updateAlert(id, updates),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alert', id] });
        },
    });
}

/**
 * Hook to deactivate an alert
 */
export function useDeactivateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: api.deactivateAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}

/**
 * Hook to delete an alert
 */
export function useDeleteAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: api.deleteAlert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}
