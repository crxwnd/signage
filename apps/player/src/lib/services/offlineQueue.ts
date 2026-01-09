/**
 * Offline Queue Service
 * Queues events to sync when connection is restored
 */

import { playerLog } from '../logger';

interface QueuedEvent {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: Date;
    retries: number;
}

const QUEUE_KEY = 'signage_offline_queue';

export const offlineQueue = {
    /**
     * Add event to queue
     */
    enqueue(type: string, payload: Record<string, unknown>): void {
        const event: QueuedEvent = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: new Date(),
            retries: 0
        };

        const queue = this.getQueue();
        queue.push(event);

        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            playerLog.log(`[OfflineQueue] Event queued: ${type}`);
        } catch (error) {
            console.error('[OfflineQueue] Failed to queue event:', error);
        }
    },

    /**
     * Get current queue
     */
    getQueue(): QueuedEvent[] {
        try {
            if (typeof localStorage === 'undefined') return [];
            const stored = localStorage.getItem(QUEUE_KEY);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            // Convert timestamp strings back to Date objects
            return parsed.map((event: QueuedEvent) => ({
                ...event,
                timestamp: new Date(event.timestamp)
            }));
        } catch {
            return [];
        }
    },

    /**
     * Process queue when connection restored
     */
    async processQueue(
        sendEvent: (type: string, payload: Record<string, unknown>) => Promise<boolean>
    ): Promise<{ processed: number; failed: number }> {
        const queue = this.getQueue();

        if (queue.length === 0) {
            return { processed: 0, failed: 0 };
        }

        playerLog.log(`[OfflineQueue] Processing ${queue.length} queued events...`);

        let processed = 0;
        let failed = 0;
        const remaining: QueuedEvent[] = [];

        for (const event of queue) {
            try {
                const success = await sendEvent(event.type, event.payload);
                if (success) {
                    processed++;
                    playerLog.log(`[OfflineQueue] Event processed: ${event.type}`);
                } else {
                    throw new Error('Send failed');
                }
            } catch (error) {
                event.retries++;
                if (event.retries < 3) {
                    remaining.push(event);
                } else {
                    failed++;
                    console.error(`[OfflineQueue] Event failed after 3 retries: ${event.type}`);
                }
            }
        }

        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        } catch {
            // Ignore storage errors
        }

        playerLog.log(`[OfflineQueue] Complete: ${processed} processed, ${failed} failed, ${remaining.length} remaining`);
        return { processed, failed };
    },

    /**
     * Clear queue
     */
    clear(): void {
        try {
            localStorage.removeItem(QUEUE_KEY);
            playerLog.log('[OfflineQueue] Queue cleared');
        } catch {
            // Ignore
        }
    },

    /**
     * Get pending count
     */
    getPendingCount(): number {
        return this.getQueue().length;
    }
};
