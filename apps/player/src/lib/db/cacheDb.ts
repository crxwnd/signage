/**
 * Cache Database Schema (Dexie.js)
 * IndexedDB storage for offline content caching
 */

import Dexie, { type Table } from 'dexie';

/**
 * Cached content metadata
 */
export interface CachedContent {
    id: string;              // contentId
    type: 'VIDEO' | 'IMAGE' | 'HTML';
    name: string;
    url: string;             // URL original
    blob?: Blob;             // Binary content (for images)
    cachedAt: Date;
    lastAccessed: Date;
    size: number;            // Size in bytes
    priority: number;        // For LRU eviction
}

/**
 * Cached HLS video segment
 */
export interface CachedSegment {
    id: string;              // `${contentId}_${quality}_${segmentNum}`
    contentId: string;
    quality: string;         // "360p", "720p", "1080p"
    segmentNum: number;
    blob: Blob;
    cachedAt: Date;
    size: number;
}

/**
 * Cache metadata storage
 */
export interface CacheMetadata {
    key: string;
    value: string | number | boolean;
    updatedAt: Date;
}

/**
 * Cache Database using Dexie
 */
class CacheDatabase extends Dexie {
    contents!: Table<CachedContent, string>;
    segments!: Table<CachedSegment, string>;
    metadata!: Table<CacheMetadata, string>;

    constructor() {
        super('SignageCache');

        this.version(1).stores({
            contents: 'id, type, cachedAt, lastAccessed, priority',
            segments: 'id, contentId, quality, segmentNum, cachedAt',
            metadata: 'key'
        });
    }
}

export const cacheDb = new CacheDatabase();
