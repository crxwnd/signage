/**
 * useAnalytics Hooks
 * React Query hooks for analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAnalyticsOverview,
    getDisplayAnalytics,
    getBandwidthAnalytics,
    getContentAnalytics,
    type AnalyticsOverview,
    type DisplayMetrics,
    type BandwidthData,
    type ContentMetrics,
} from '@/lib/api/analytics';

export function useAnalyticsOverview(from?: string, to?: string) {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<AnalyticsOverview>({
        queryKey: ['analytics', 'overview', from, to],
        queryFn: () => getAnalyticsOverview(from, to),
        staleTime: 60000,
        enabled: !!user && !authLoading,
        retry: 1,
    });
}

export function useDisplayAnalytics() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<{ displays: DisplayMetrics[]; pagination: { page: number; total: number } }>({
        queryKey: ['analytics', 'displays'],
        queryFn: getDisplayAnalytics,
        staleTime: 60000,
        enabled: !!user && !authLoading,
        retry: 1,
    });
}

export function useBandwidthAnalytics() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<BandwidthData>({
        queryKey: ['analytics', 'bandwidth'],
        queryFn: getBandwidthAnalytics,
        staleTime: 60000,
        enabled: !!user && !authLoading,
        retry: 1,
    });
}

export function useContentAnalytics() {
    const { user, isLoading: authLoading } = useAuth();

    return useQuery<{ content: ContentMetrics[] }>({
        queryKey: ['analytics', 'content'],
        queryFn: getContentAnalytics,
        staleTime: 60000,
        enabled: !!user && !authLoading,
        retry: 1,
    });
}
