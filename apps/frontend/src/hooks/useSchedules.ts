/**
 * useSchedules Hooks
 * React Query hooks for schedule management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api/schedules';
import type { Schedule, CreateScheduleDTO, UpdateScheduleDTO, ScheduleFilters } from '@/lib/api/schedules';

export function useSchedules(filters?: ScheduleFilters) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<Schedule[]>({
        queryKey: ['schedules', filters],
        queryFn: () => api.getSchedules(filters),
        enabled: !!user && !authLoading,
    });
}

export function useSchedule(id: string) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<Schedule>({
        queryKey: ['schedule', id],
        queryFn: () => api.getSchedule(id),
        enabled: !!user && !authLoading && !!id,
    });
}

export function useCreateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateScheduleDTO) => api.createSchedule(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });
}

export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateScheduleDTO }) =>
            api.updateSchedule(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            queryClient.invalidateQueries({ queryKey: ['schedule', variables.id] });
        },
    });
}

export function useDeleteSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteSchedule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });
}

export function useActiveContent(displayId: string) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['schedule-active', displayId],
        queryFn: () => api.getActiveContent(displayId),
        enabled: !!user && !authLoading && !!displayId,
        refetchInterval: 60000, // Check every minute
    });
}

export function useSchedulePreview(id: string, count: number = 10) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['schedule-preview', id, count],
        queryFn: () => api.getSchedulePreview(id, count),
        enabled: !!user && !authLoading && !!id,
    });
}
