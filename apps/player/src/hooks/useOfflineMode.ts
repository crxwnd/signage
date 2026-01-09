/**
 * useOfflineMode Hook
 * Manages offline mode behavior including queue processing
 */

import { playerLog } from '@/lib/logger';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineQueue } from '@/lib/services/offlineQueue';

interface UseOfflineModeOptions {
    onReconnect?: () => void;
    onDisconnect?: () => void;
    socketSend?: (type: string, payload: Record<string, unknown>) => Promise<boolean>;
}

export function useOfflineMode(options: UseOfflineModeOptions = {}) {
    const { onReconnect, onDisconnect, socketSend } = options;
    const network = useNetworkStatus();
    const wasOfflineRef = useRef(false);
    const [pendingEvents, setPendingEvents] = useState(0);

    // Update pending count periodically
    useEffect(() => {
        setPendingEvents(offlineQueue.getPendingCount());

        const interval = setInterval(() => {
            setPendingEvents(offlineQueue.getPendingCount());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Detect reconnection
    useEffect(() => {
        if (network.isOnline && wasOfflineRef.current) {
            playerLog.log('[OfflineMode] Reconnected - processing queue...');

            // Process queue of events
            if (socketSend) {
                offlineQueue.processQueue(socketSend).then(({ processed, failed }) => {
                    playerLog.log(`[OfflineMode] Queue processed: ${processed} sent, ${failed} failed`);
                    setPendingEvents(offlineQueue.getPendingCount());
                });
            }

            onReconnect?.();
        }

        if (!network.isOnline) {
            wasOfflineRef.current = true;
            onDisconnect?.();
        }
    }, [network.isOnline, onReconnect, onDisconnect, socketSend]);

    // Queue event for sending when online
    const queueEvent = useCallback((type: string, payload: Record<string, unknown>) => {
        if (!network.isOnline) {
            offlineQueue.enqueue(type, payload);
            setPendingEvents(offlineQueue.getPendingCount());
            return false;
        }
        return true; // Indicates can send directly
    }, [network.isOnline]);

    return {
        isOffline: !network.isOnline,
        offlineSince: network.offlineSince,
        wasOffline: network.wasOffline,
        queueEvent,
        pendingEvents
    };
}
