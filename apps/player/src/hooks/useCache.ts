/**
 * useCache Hook
 * React hook for accessing cache service
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '@/lib/services/cacheService';

interface CacheStats {
    used: number;
    quota: number;
    percentage: number;
    itemCount: number;
}

export function useCache() {
    const [stats, setStats] = useState<CacheStats>({
        used: 0,
        quota: 0,
        percentage: 0,
        itemCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const refreshStats = useCallback(async () => {
        try {
            const estimate = await cacheService.getStorageEstimate();
            const cacheSize = await cacheService.getCacheSize();
            const contents = await cacheService.getCachedContents();

            setStats({
                used: cacheSize,
                quota: estimate.quota,
                percentage: estimate.quota > 0 ? (cacheSize / estimate.quota) * 100 : 0,
                itemCount: contents.length
            });
        } catch (error) {
            console.error('[useCache] Failed to get stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshStats();

        // Refresh stats every 30 seconds
        const interval = setInterval(refreshStats, 30000);
        return () => clearInterval(interval);
    }, [refreshStats]);

    const cacheImage = useCallback(async (
        contentId: string,
        name: string,
        url: string
    ) => {
        await cacheService.cacheImage(contentId, name, url);
        await refreshStats();
    }, [refreshStats]);

    const getCachedImage = useCallback(async (contentId: string) => {
        return cacheService.getCachedImage(contentId);
    }, []);

    const isContentCached = useCallback(async (contentId: string) => {
        return cacheService.isContentCached(contentId);
    }, []);

    const clearCache = useCallback(async () => {
        await cacheService.clearAll();
        await refreshStats();
    }, [refreshStats]);

    const precachePlaylist = useCallback(async (items: Array<{
        id: string;
        type: 'VIDEO' | 'IMAGE' | 'HTML';
        name: string;
        url: string;
    }>) => {
        await cacheService.precachePlaylist(items);
        await refreshStats();
    }, [refreshStats]);

    return {
        stats,
        isLoading,
        cacheImage,
        getCachedImage,
        isContentCached,
        clearCache,
        precachePlaylist,
        refreshStats
    };
}
