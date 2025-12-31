'use client';

/**
 * Clock Sync Hook
 * Calculates and maintains offset between client and server time
 * Uses sync:tick events to compute time difference
 */

import { useState, useCallback, useRef } from 'react';

// Configuration
const OFFSET_SAMPLES = 10;  // Number of samples to average

interface ClockSyncState {
    offset: number;           // ms difference (client + offset = server)
    rtt: number;             // Round trip time in ms
    samples: number;         // Number of samples collected
    isCalibrated: boolean;   // True when we have enough samples
}

/**
 * Hook for synchronizing client clock with server
 */
export function useClockSync() {
    const [state, setState] = useState<ClockSyncState>({
        offset: 0,
        rtt: 0,
        samples: 0,
        isCalibrated: false,
    });

    // Store offset samples for averaging
    const offsetSamplesRef = useRef<number[]>([]);
    const rttSamplesRef = useRef<number[]>([]);

    /**
     * Process a sync tick to update offset calculation
     * @param serverTime - Server timestamp when tick was emitted
     * @param receiveTime - Client timestamp when tick was received (default: now)
     * @param estimatedRtt - Estimated round trip time (optional)
     */
    const processTick = useCallback((
        serverTime: number,
        receiveTime: number = Date.now(),
        estimatedRtt: number = 50  // Default 50ms RTT estimate
    ) => {
        // Calculate offset: serverTime = clientTime + offset
        // Since tick only goes server->client, we use RTT/2 as one-way latency
        const oneWayLatency = estimatedRtt / 2;
        const correctedServerTime = serverTime + oneWayLatency;
        const offset = correctedServerTime - receiveTime;

        // Add to samples
        offsetSamplesRef.current.push(offset);
        rttSamplesRef.current.push(estimatedRtt);

        // Keep only last N samples
        if (offsetSamplesRef.current.length > OFFSET_SAMPLES) {
            offsetSamplesRef.current.shift();
        }
        if (rttSamplesRef.current.length > OFFSET_SAMPLES) {
            rttSamplesRef.current.shift();
        }

        // Calculate moving average
        const avgOffset = offsetSamplesRef.current.reduce((a, b) => a + b, 0)
            / offsetSamplesRef.current.length;
        const avgRtt = rttSamplesRef.current.reduce((a, b) => a + b, 0)
            / rttSamplesRef.current.length;

        setState({
            offset: Math.round(avgOffset),
            rtt: Math.round(avgRtt),
            samples: offsetSamplesRef.current.length,
            isCalibrated: offsetSamplesRef.current.length >= 3,
        });
    }, []);

    /**
     * Get current server time (estimated)
     */
    const serverNow = useCallback((): number => {
        return Date.now() + state.offset;
    }, [state.offset]);

    /**
     * Convert a server timestamp to client time
     */
    const toClientTime = useCallback((serverTime: number): number => {
        return serverTime - state.offset;
    }, [state.offset]);

    /**
     * Convert a client timestamp to server time
     */
    const toServerTime = useCallback((clientTime: number): number => {
        return clientTime + state.offset;
    }, [state.offset]);

    /**
     * Reset calibration
     */
    const reset = useCallback(() => {
        offsetSamplesRef.current = [];
        rttSamplesRef.current = [];
        setState({
            offset: 0,
            rtt: 0,
            samples: 0,
            isCalibrated: false,
        });
    }, []);

    return {
        offset: state.offset,
        rtt: state.rtt,
        samples: state.samples,
        isCalibrated: state.isCalibrated,
        processTick,
        serverNow,
        toClientTime,
        toServerTime,
        reset,
    };
}
