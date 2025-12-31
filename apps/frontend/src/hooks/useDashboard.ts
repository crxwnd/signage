/**
 * useDashboard Hook
 * React Query hook for dashboard statistics
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardStats } from '@/lib/api/dashboard';

export function useDashboardStats() {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 10000, // Consider stale after 10 seconds
    });
}
