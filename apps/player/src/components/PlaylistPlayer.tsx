'use client';

/**
 * PlaylistPlayer Component
 * Plays a sequence of videos and images in a loop
 * Supports offline caching via IndexedDB
 */

import { playerLog } from '@/lib/logger';
import { useState, useCallback, useEffect, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useCache } from '@/hooks/useCache';

interface PlaylistItem {
    id: string;
    type: 'VIDEO' | 'IMAGE' | 'HTML';
    url: string;
    duration?: number; // seconds, for images
    name: string;
}

interface PlaylistPlayerProps {
    items: PlaylistItem[];
    isPaused?: boolean;
    onItemChange?: (index: number, item: PlaylistItem) => void;
    isOffline?: boolean;
}

export function PlaylistPlayer({ items, isPaused: _isPaused = false, onItemChange, isOffline: _isOffline = false }: PlaylistPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { precachePlaylist, getCachedImage, stats } = useCache();
    const hasPrecached = useRef(false);

    const currentItem = items[currentIndex];

    // Pre-cache playlist images on load
    useEffect(() => {
        if (items.length > 0 && !hasPrecached.current) {
            hasPrecached.current = true;
            const itemsToCache = items.map(item => ({
                id: item.id,
                type: item.type,
                name: item.name,
                url: item.url
            }));
            precachePlaylist(itemsToCache);
        }
    }, [items, precachePlaylist]);

    const handleEnded = useCallback(() => {
        const nextIndex = (currentIndex + 1) % items.length;
        const nextItem = items[nextIndex];
        setCurrentIndex(nextIndex);
        if (nextItem) {
            onItemChange?.(nextIndex, nextItem);
        }
    }, [currentIndex, items, onItemChange]);

    if (!items.length) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <p className="text-white text-2xl">No content to display</p>
            </div>
        );
    }

    if (!currentItem) {
        return null;
    }

    // Video content
    if (currentItem.type === 'VIDEO') {
        return (
            <div className="relative w-full h-full">
                <VideoPlayer
                    src={currentItem.url}
                    autoPlay
                    muted
                    onEnded={handleEnded}
                />
                {/* Cache indicator */}
                <CacheIndicator stats={stats} />
            </div>
        );
    }

    // Image content
    if (currentItem.type === 'IMAGE') {
        return (
            <div className="relative w-full h-full">
                <ImageDisplay
                    contentId={currentItem.id}
                    src={currentItem.url}
                    duration={currentItem.duration || 10}
                    onComplete={handleEnded}
                    getCachedImage={getCachedImage}
                />
                {/* Cache indicator */}
                <CacheIndicator stats={stats} />
            </div>
        );
    }

    // HTML content (placeholder)
    return (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <p className="text-white">HTML content not yet supported</p>
        </div>
    );
}

/**
 * Cache Indicator Component
 * Shows cache status in corner
 */
function CacheIndicator({ stats }: { stats: { used: number; percentage: number; itemCount: number } }) {
    if (stats.used === 0) return null;

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return (
        <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{formatSize(stats.used)} ({stats.itemCount} items)</span>
        </div>
    );
}

/**
 * ImageDisplay Component
 * Shows an image for a specified duration then calls onComplete
 * Uses cache when available
 */
function ImageDisplay({
    contentId,
    src,
    duration,
    onComplete,
    getCachedImage
}: {
    contentId: string;
    src: string;
    duration: number;
    onComplete: () => void;
    getCachedImage: (id: string) => Promise<string | null>;
}) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [imageUrl, setImageUrl] = useState(src);
    const [fromCache, setFromCache] = useState(false);
    const onCompleteRef = useRef(onComplete);

    // Keep ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Try to get from cache, fallback to original URL
    useEffect(() => {
        let objectUrl: string | null = null;

        const loadImage = async () => {
            const cached = await getCachedImage(contentId);
            if (cached) {
                playerLog.log(`[Player] Using cached image: ${contentId}`);
                objectUrl = cached;
                setImageUrl(cached);
                setFromCache(true);
            } else {
                setImageUrl(src);
                setFromCache(false);
            }
        };

        loadImage();

        // Cleanup object URL on unmount
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [contentId, src, getCachedImage]);

    // Reset timer when src changes
    useEffect(() => {
        setTimeLeft(duration);
    }, [src, duration]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft]);

    // Call onComplete when time reaches 0 (separate effect to avoid setState during render)
    useEffect(() => {
        if (timeLeft === 0) {
            onCompleteRef.current();
        }
    }, [timeLeft]);

    return (
        <div className="relative w-full h-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-contain"
            />
            {/* Debug: show remaining time and cache status */}
            <div className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
                {fromCache && <span className="text-green-400">📦</span>}
                {timeLeft}s
            </div>
        </div>
    );
}
