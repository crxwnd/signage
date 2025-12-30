/**
 * useNetworkStatus Hook
 * Detects online/offline network state
 */

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    wasOffline: boolean;      // true if was offline in this session
    offlineSince: Date | null;
    lastOnline: Date | null;
}

export function useNetworkStatus() {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        wasOffline: false,
        offlineSince: null,
        lastOnline: new Date()
    });

    const handleOnline = useCallback(() => {
        console.log('[Network] Connection restored');
        setStatus(prev => ({
            ...prev,
            isOnline: true,
            lastOnline: new Date(),
            offlineSince: null
        }));
    }, []);

    const handleOffline = useCallback(() => {
        console.log('[Network] Connection lost');
        setStatus(prev => ({
            ...prev,
            isOnline: false,
            wasOffline: true,
            offlineSince: prev.offlineSince || new Date()
        }));
    }, []);

    useEffect(() => {
        // Check initial state
        if (typeof window === 'undefined') return;

        // Set initial state
        const initialOnline = navigator.onLine;
        if (!initialOnline) {
            handleOffline();
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic verification (backup for cases where events don't fire)
        const interval = setInterval(() => {
            const online = navigator.onLine;
            if (online !== status.isOnline) {
                if (online) {
                    handleOnline();
                } else {
                    handleOffline();
                }
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [handleOnline, handleOffline, status.isOnline]);

    return status;
}
