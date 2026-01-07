/**
 * useUserAnalytics Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as userAnalyticsApi from '@/lib/api/userAnalytics';

export function useUserAnalyticsOverview(from?: string, to?: string) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['userAnalytics', 'overview', from, to],
        queryFn: () => userAnalyticsApi.getUserAnalyticsOverview(from, to),
        enabled: !!user && !authLoading && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        staleTime: 60000,
    });
}

export function useUserActivityStats() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['userAnalytics', 'stats'],
        queryFn: userAnalyticsApi.getUserActivityStats,
        enabled: !!user && !authLoading && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        staleTime: 60000,
    });
}

export function useRecentUserActivity(limit = 50) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['userAnalytics', 'activity', limit],
        queryFn: () => userAnalyticsApi.getRecentUserActivity(limit),
        enabled: !!user && !authLoading && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        staleTime: 30000,
    });
}

export function useLoginHistory(limit = 100) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['userAnalytics', 'logins', limit],
        queryFn: () => userAnalyticsApi.getLoginHistory(limit),
        enabled: !!user && !authLoading && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        staleTime: 30000,
    });
}

export function useSecurityOverview() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['userAnalytics', 'security'],
        queryFn: userAnalyticsApi.getSecurityOverview,
        enabled: !!user && !authLoading && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        staleTime: 60000,
    });
}
