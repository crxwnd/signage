'use client';

/**
 * Sync Indicator Component
 * Shows sync status for synchronized playback
 */

import React from 'react';
import type { SyncStatus } from '../hooks/useSyncPlayback';

interface SyncIndicatorProps {
    status: SyncStatus;
    drift: number;  // in seconds
    isVisible?: boolean;
}

const statusConfig: Record<SyncStatus, { color: string; label: string; animate?: boolean }> = {
    waiting: { color: '#888', label: 'Waiting' },
    syncing: { color: '#f59e0b', label: 'Syncing', animate: true },
    'soft-syncing': { color: '#eab308', label: 'Adjusting', animate: true },
    'hard-syncing': { color: '#ef4444', label: 'Seeking', animate: true },
    synced: { color: '#22c55e', label: 'Synced' },
};

export function SyncIndicator({ status, drift, isVisible = true }: SyncIndicatorProps) {
    if (!isVisible) return null;

    const config = statusConfig[status];
    const driftMs = Math.round(drift * 1000);
    const driftSign = driftMs >= 0 ? '+' : '';

    return (
        <div
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 100,
            }}
        >
            {/* Status dot */}
            <div
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: config.color,
                    animation: config.animate ? 'pulse 1s ease-in-out infinite' : undefined,
                }}
            />

            {/* Status label */}
            <span style={{ color: config.color, fontWeight: 'bold' }}>
                {config.label}
            </span>

            {/* Drift indicator */}
            {status !== 'waiting' && (
                <span style={{ color: '#aaa' }}>
                    {driftSign}{driftMs}ms
                </span>
            )}

            {/* Inline keyframes */}
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
        </div>
    );
}
