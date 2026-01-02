/**
 * useContentSource Hook
 * Fetches current content source from API and listens for Socket.io updates
 */

import { useState, useEffect, useCallback } from 'react';

type ContentSourceType = 'alert' | 'sync' | 'schedule' | 'playlist' | 'fallback' | 'none';

interface ContentSource {
    type: ContentSourceType;
    priority: number;
    reason: string;
    contentId?: string;
    content?: any;
    syncGroupId?: string;
    syncGroup?: any;
    alertId?: string;
    alert?: any;
    scheduleId?: string;
    schedule?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseContentSourceOptions {
    displayId: string | null;
    pollInterval?: number;
}

interface UseContentSourceReturn {
    source: ContentSource | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useContentSource({
    displayId,
    pollInterval = 30000,
}: UseContentSourceOptions): UseContentSourceReturn {
    const [source, setSource] = useState<ContentSource | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSource = useCallback(async () => {
        if (!displayId) return;

        try {
            const response = await fetch(`${API_URL}/api/displays/${displayId}/current-source`);
            if (!response.ok) {
                throw new Error('Failed to fetch content source');
            }
            const data = await response.json();
            setSource(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [displayId]);

    // Initial fetch
    useEffect(() => {
        if (displayId) {
            setIsLoading(true);
            fetchSource();
        } else {
            setSource(null);
            setIsLoading(false);
        }
    }, [displayId, fetchSource]);

    // Polling
    useEffect(() => {
        if (!displayId || !pollInterval) return;

        const interval = setInterval(fetchSource, pollInterval);
        return () => clearInterval(interval);
    }, [displayId, pollInterval, fetchSource]);

    return {
        source,
        isLoading,
        error,
        refetch: fetchSource,
    };
}
