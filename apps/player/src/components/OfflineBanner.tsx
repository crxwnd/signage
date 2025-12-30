'use client';

/**
 * Offline Banner Component
 * Visual indicator when player is offline
 */

import { useEffect, useState } from 'react';

interface OfflineBannerProps {
    isOffline: boolean;
    offlineSince: Date | null;
}

export function OfflineBanner({ isOffline, offlineSince }: OfflineBannerProps) {
    const [duration, setDuration] = useState<string>('');

    useEffect(() => {
        if (!isOffline || !offlineSince) {
            setDuration('');
            return;
        }

        const updateDuration = () => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - offlineSince.getTime()) / 1000);

            if (diff < 60) {
                setDuration(`${diff}s`);
            } else if (diff < 3600) {
                setDuration(`${Math.floor(diff / 60)}m`);
            } else {
                setDuration(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
            }
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);

        return () => clearInterval(interval);
    }, [isOffline, offlineSince]);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
                {/* Offline icon */}
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12v.01"
                    />
                </svg>
                <span className="font-medium">Sin conexión</span>
            </div>
            {duration && (
                <span className="text-red-200 text-sm">
                    Desconectado hace {duration}
                </span>
            )}
            <span className="text-red-200 text-sm">
                — Reproduciendo contenido local
            </span>
        </div>
    );
}
