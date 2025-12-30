/**
 * Cache Service
 * Handles caching logic for offline content storage
 */

import { cacheDb, type CachedContent } from '../db/cacheDb';

const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB default
const CACHE_THRESHOLD = 0.8; // Clean when reaching 80%

export const cacheService = {
    /**
     * Get storage estimate from browser
     */
    async getStorageEstimate(): Promise<{ used: number; quota: number }> {
        if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || MAX_CACHE_SIZE
            };
        }
        return { used: 0, quota: MAX_CACHE_SIZE };
    },

    /**
     * Get current cache size in bytes
     */
    async getCacheSize(): Promise<number> {
        try {
            const contents = await cacheDb.contents.toArray();
            const segments = await cacheDb.segments.toArray();

            const contentSize = contents.reduce((sum, c) => sum + c.size, 0);
            const segmentSize = segments.reduce((sum, s) => sum + s.size, 0);

            return contentSize + segmentSize;
        } catch {
            return 0;
        }
    },

    /**
     * Cache an image
     */
    async cacheImage(contentId: string, name: string, url: string): Promise<void> {
        try {
            // Check if already cached
            const existing = await cacheDb.contents.get(contentId);
            if (existing?.blob) {
                await this.updateLastAccessed(contentId);
                return;
            }

            // Download image
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

            const blob = await response.blob();

            // Ensure space available
            await this.ensureSpace(blob.size);

            // Save to cache
            await cacheDb.contents.put({
                id: contentId,
                type: 'IMAGE',
                name,
                url,
                blob,
                cachedAt: new Date(),
                lastAccessed: new Date(),
                size: blob.size,
                priority: 1
            });

            console.log(`[Cache] Image cached: ${name} (${(blob.size / 1024).toFixed(1)}KB)`);
        } catch (error) {
            console.error(`[Cache] Failed to cache image:`, error);
        }
    },

    /**
     * Get cached image as Object URL
     */
    async getCachedImage(contentId: string): Promise<string | null> {
        try {
            const cached = await cacheDb.contents.get(contentId);
            if (cached?.blob) {
                await this.updateLastAccessed(contentId);
                return URL.createObjectURL(cached.blob);
            }
        } catch (error) {
            console.error(`[Cache] Failed to get cached image:`, error);
        }
        return null;
    },

    /**
     * Cache an HLS segment
     */
    async cacheSegment(
        contentId: string,
        quality: string,
        segmentNum: number,
        url: string
    ): Promise<void> {
        const id = `${contentId}_${quality}_${segmentNum}`;

        try {
            // Check if already exists
            const existing = await cacheDb.segments.get(id);
            if (existing) return;

            // Download segment
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch segment: ${response.status}`);

            const blob = await response.blob();

            // Ensure space
            await this.ensureSpace(blob.size);

            // Save
            await cacheDb.segments.put({
                id,
                contentId,
                quality,
                segmentNum,
                blob,
                cachedAt: new Date(),
                size: blob.size
            });

            console.log(`[Cache] Segment cached: ${quality}/segment_${segmentNum}`);
        } catch (error) {
            console.error(`[Cache] Failed to cache segment:`, error);
        }
    },

    /**
     * Get cached segment as Object URL
     */
    async getCachedSegment(
        contentId: string,
        quality: string,
        segmentNum: number
    ): Promise<string | null> {
        const id = `${contentId}_${quality}_${segmentNum}`;
        try {
            const cached = await cacheDb.segments.get(id);
            if (cached?.blob) {
                return URL.createObjectURL(cached.blob);
            }
        } catch (error) {
            console.error(`[Cache] Failed to get cached segment:`, error);
        }
        return null;
    },

    /**
     * Check if content is cached
     */
    async isContentCached(contentId: string): Promise<boolean> {
        try {
            const content = await cacheDb.contents.get(contentId);
            return !!content?.blob;
        } catch {
            return false;
        }
    },

    /**
     * Update last accessed time (for LRU)
     */
    async updateLastAccessed(contentId: string): Promise<void> {
        try {
            await cacheDb.contents.update(contentId, {
                lastAccessed: new Date()
            });
        } catch {
            // Ignore errors
        }
    },

    /**
     * Ensure space is available (LRU eviction)
     */
    async ensureSpace(requiredBytes: number): Promise<void> {
        try {
            const { quota } = await this.getStorageEstimate();
            const currentSize = await this.getCacheSize();
            const threshold = quota * CACHE_THRESHOLD;

            if (currentSize + requiredBytes > threshold) {
                console.log('[Cache] Running LRU eviction...');
                await this.evictLRU(requiredBytes);
            }
        } catch (error) {
            console.error('[Cache] Failed to ensure space:', error);
        }
    },

    /**
     * Evict least recently used content
     */
    async evictLRU(requiredBytes: number): Promise<void> {
        try {
            // Get content ordered by last accessed
            const contents = await cacheDb.contents
                .orderBy('lastAccessed')
                .toArray();

            let freedBytes = 0;

            for (const content of contents) {
                if (freedBytes >= requiredBytes) break;

                // Delete content
                await cacheDb.contents.delete(content.id);

                // Delete associated segments
                const segments = await cacheDb.segments
                    .where('contentId')
                    .equals(content.id)
                    .toArray();

                for (const segment of segments) {
                    await cacheDb.segments.delete(segment.id);
                    freedBytes += segment.size;
                }

                freedBytes += content.size;
                console.log(`[Cache] Evicted: ${content.name}`);
            }
        } catch (error) {
            console.error('[Cache] Failed to evict:', error);
        }
    },

    /**
     * Clear all cache
     */
    async clearAll(): Promise<void> {
        try {
            await cacheDb.contents.clear();
            await cacheDb.segments.clear();
            await cacheDb.metadata.clear();
            console.log('[Cache] All cache cleared');
        } catch (error) {
            console.error('[Cache] Failed to clear cache:', error);
        }
    },

    /**
     * Get all cached content info
     */
    async getCachedContents(): Promise<CachedContent[]> {
        try {
            return await cacheDb.contents.toArray();
        } catch {
            return [];
        }
    },

    /**
     * Pre-cache a playlist
     */
    async precachePlaylist(items: Array<{
        id: string;
        type: 'VIDEO' | 'IMAGE' | 'HTML';
        name: string;
        url: string;
    }>): Promise<void> {
        console.log(`[Cache] Pre-caching ${items.length} items...`);

        for (const item of items) {
            if (item.type === 'IMAGE') {
                await this.cacheImage(item.id, item.name, item.url);
            }
            // Videos are cached by segment during playback
        }
    }
};
