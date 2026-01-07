/**
 * useHotels Hooks
 * React Query hooks for hotel management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as hotelsApi from '@/lib/api/hotels';
import { toast } from 'sonner';

export function useHotels(includeStats = false) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['hotels', { includeStats }],
        queryFn: () => hotelsApi.getHotels(includeStats),
        enabled: !!user && !authLoading,
        staleTime: 30000,
    });
}

export function useHotel(id: string) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['hotels', id],
        queryFn: () => hotelsApi.getHotelById(id),
        enabled: !!user && !authLoading && !!id,
        staleTime: 30000,
    });
}

export function useHotelGlobalStats() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['hotels', 'stats'],
        queryFn: () => hotelsApi.getHotelGlobalStats(),
        enabled: !!user && !authLoading && user.role === 'SUPER_ADMIN',
        staleTime: 60000,
    });
}

export function useCreateHotel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: hotelsApi.createHotel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            toast.success('Hotel created successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create hotel');
        },
    });
}

export function useUpdateHotel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: hotelsApi.UpdateHotelInput }) =>
            hotelsApi.updateHotel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            toast.success('Hotel updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update hotel');
        },
    });
}

export function useDeleteHotel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: hotelsApi.deleteHotel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            toast.success('Hotel deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete hotel');
        },
    });
}
