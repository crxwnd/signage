/**
 * useDashboard Hook
 * React Query hook for dashboard statistics
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardStats } from '@/lib/api/dashboard';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 10000, // Consider stale after 10 seconds
        enabled: !!user && !authLoading, // Only fetch when authenticated
        retry: 1, // Reduce retries to avoid 401 spam
    });
}
