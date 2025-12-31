'use client';

/**
 * Sync Playback Hook
 * Manages synchronized video playback using server sync:tick events
 * Implements soft sync (playbackRate) and hard sync (seek)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useClockSync } from './useClockSync';

// Sync configuration
const SYNC_CONFIG = {
    SOFT_SYNC_THRESHOLD: 0.5,     // seconds, use playbackRate adjustment
    HARD_SYNC_THRESHOLD: 2.0,     // seconds, do seek
    TOLERANCE: 0.05,              // seconds, considered "in sync"
    PLAYBACK_RATE_SLOW: 0.95,     // for when ahead
    PLAYBACK_RATE_FAST: 1.05,     // for when behind
    RATE_RESET_TOLERANCE: 0.03,   // Reset to 1.0 when within this
};

export type SyncStatus = 'waiting' | 'syncing' | 'soft-syncing' | 'hard-syncing' | 'synced';

interface SyncState {
    status: SyncStatus;
    drift: number;              // seconds, positive = ahead, negative = behind
    isSynced: boolean;
    lastTickTime: number;
    serverPlaybackState: 'playing' | 'paused' | 'stopped';
    serverContentId: string | null;
    serverCurrentTime: number;
}

interface SyncTick {
    groupId: string;
    contentId: string;
    currentTime: number;
    serverTime: number;
    playbackState: 'playing' | 'paused';
}

interface UseSyncPlaybackOptions {
    videoRef: React.RefObject<HTMLVideoElement>;
    groupId: string | null;
    enabled?: boolean;
}

/**
 * Hook for synchronized video playback
 */
export function useSyncPlayback({
    videoRef,
    groupId,
    enabled: _enabled = true,
}: UseSyncPlaybackOptions) {
    const clockSync = useClockSync();

    const [state, setState] = useState<SyncState>({
        status: 'waiting',
        drift: 0,
        isSynced: false,
        lastTickTime: 0,
        serverPlaybackState: 'stopped',
        serverContentId: null,
        serverCurrentTime: 0,
    });

    // Refs for avoiding stale closures
    const stateRef = useRef(state);
    stateRef.current = state;

    /**
     * Process a sync tick from the server
     */
    const processSyncTick = useCallback((tick: SyncTick) => {
        if (!groupId || tick.groupId !== groupId) return;

        const receiveTime = Date.now();

        // Update clock sync
        clockSync.processTick(tick.serverTime, receiveTime);

        // Calculate expected playback time
        // Account for time elapsed since server sent the tick
        const timeSinceTick = (receiveTime - tick.serverTime + clockSync.offset) / 1000;
        const expectedTime = tick.playbackState === 'playing'
            ? tick.currentTime + timeSinceTick
            : tick.currentTime;

        // Get current video time
        const video = videoRef.current;
        if (!video) {
            setState(prev => ({
                ...prev,
                serverPlaybackState: tick.playbackState,
                serverContentId: tick.contentId,
                serverCurrentTime: expectedTime,
                lastTickTime: receiveTime,
            }));
            return;
        }

        const currentTime = video.currentTime;
        const drift = currentTime - expectedTime; // positive = ahead, negative = behind

        // Determine sync status and apply correction
        let newStatus: SyncStatus = 'waiting';
        const absDrift = Math.abs(drift);

        if (tick.playbackState === 'paused') {
            // Server is paused, pause locally too
            if (!video.paused) {
                video.pause();
            }
            // Seek to exact position if needed
            if (absDrift > SYNC_CONFIG.TOLERANCE) {
                video.currentTime = expectedTime;
            }
            newStatus = 'synced';
        } else if (tick.playbackState === 'playing') {
            // Ensure video is playing
            if (video.paused) {
                video.play().catch(console.error);
            }

            if (absDrift > SYNC_CONFIG.HARD_SYNC_THRESHOLD) {
                // Hard sync: seek directly
                console.log(`[SyncPlayback] Hard sync: drift=${drift.toFixed(3)}s, seeking to ${expectedTime.toFixed(2)}s`);
                video.currentTime = expectedTime;
                video.playbackRate = 1.0;
                newStatus = 'hard-syncing';
            } else if (absDrift > SYNC_CONFIG.SOFT_SYNC_THRESHOLD) {
                // Soft sync: adjust playback rate significantly
                const rate = drift > 0 ? SYNC_CONFIG.PLAYBACK_RATE_SLOW : SYNC_CONFIG.PLAYBACK_RATE_FAST;
                console.log(`[SyncPlayback] Soft sync: drift=${drift.toFixed(3)}s, rate=${rate}`);
                video.playbackRate = rate;
                newStatus = 'soft-syncing';
            } else if (absDrift > SYNC_CONFIG.TOLERANCE) {
                // Minor drift: gentle correction
                const rate = drift > 0
                    ? 1 - (drift * 0.1)  // Slow down proportionally
                    : 1 - (drift * 0.1); // Speed up proportionally
                const clampedRate = Math.max(0.9, Math.min(1.1, rate));
                video.playbackRate = clampedRate;
                newStatus = 'syncing';
            } else {
                // In sync
                if (video.playbackRate !== 1.0 && absDrift < SYNC_CONFIG.RATE_RESET_TOLERANCE) {
                    video.playbackRate = 1.0;
                }
                newStatus = 'synced';
            }
        }

        setState({
            status: newStatus,
            drift,
            isSynced: absDrift < SYNC_CONFIG.TOLERANCE,
            lastTickTime: receiveTime,
            serverPlaybackState: tick.playbackState,
            serverContentId: tick.contentId,
            serverCurrentTime: expectedTime,
        });
    }, [groupId, clockSync, videoRef]);

    /**
     * Handle late join - seek to correct position
     */
    const handleLateJoin = useCallback((
        contentId: string,
        currentTime: number,
        playbackState: 'playing' | 'paused'
    ) => {
        console.log('[SyncPlayback] Late join:', { contentId, currentTime, playbackState });

        setState(prev => ({
            ...prev,
            serverContentId: contentId,
            serverCurrentTime: currentTime,
            serverPlaybackState: playbackState,
            status: 'syncing',
        }));

        const video = videoRef.current;
        if (video && video.readyState >= 2) {
            video.currentTime = currentTime;
            if (playbackState === 'playing') {
                video.play().catch(console.error);
            }
        }
    }, [videoRef]);

    /**
     * Handle sync command (play/pause/seek)
     */
    const handleSyncCommand = useCallback((command: {
        type: 'play' | 'pause' | 'seek' | 'stop';
        contentId?: string;
        seekTo?: number;
    }) => {
        const video = videoRef.current;
        if (!video) return;

        console.log('[SyncPlayback] Command:', command);

        switch (command.type) {
            case 'play':
                video.play().catch(console.error);
                break;
            case 'pause':
                video.pause();
                break;
            case 'seek':
                if (typeof command.seekTo === 'number') {
                    video.currentTime = command.seekTo;
                }
                break;
            case 'stop':
                video.pause();
                video.currentTime = 0;
                setState(prev => ({ ...prev, serverPlaybackState: 'stopped' }));
                break;
        }
    }, [videoRef]);

    /**
     * Reset sync state
     */
    const reset = useCallback(() => {
        clockSync.reset();
        setState({
            status: 'waiting',
            drift: 0,
            isSynced: false,
            lastTickTime: 0,
            serverPlaybackState: 'stopped',
            serverContentId: null,
            serverCurrentTime: 0,
        });
    }, [clockSync]);

    // Reset when group changes
    useEffect(() => {
        reset();
    }, [groupId, reset]);

    return {
        // State
        status: state.status,
        drift: state.drift,
        isSynced: state.isSynced,
        serverPlaybackState: state.serverPlaybackState,
        serverContentId: state.serverContentId,
        serverCurrentTime: state.serverCurrentTime,

        // Clock sync info
        clockOffset: clockSync.offset,
        isClockCalibrated: clockSync.isCalibrated,

        // Methods
        processSyncTick,
        handleLateJoin,
        handleSyncCommand,
        reset,
    };
}
