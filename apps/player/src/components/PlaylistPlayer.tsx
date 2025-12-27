'use client';

/**
 * PlaylistPlayer Component
 * Plays a sequence of videos and images in a loop
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';

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
}

export function PlaylistPlayer({ items, isPaused: _isPaused = false, onItemChange }: PlaylistPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentItem = items[currentIndex];

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
            <VideoPlayer
                src={currentItem.url}
                autoPlay
                muted
                onEnded={handleEnded}
            />
        );
    }

    // Image content
    if (currentItem.type === 'IMAGE') {
        return (
            <ImageDisplay
                src={currentItem.url}
                duration={currentItem.duration || 10}
                onComplete={handleEnded}
            />
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
 * ImageDisplay Component
 * Shows an image for a specified duration then calls onComplete
 */
function ImageDisplay({
    src,
    duration,
    onComplete
}: {
    src: string;
    duration: number;
    onComplete: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const onCompleteRef = useRef(onComplete);

    // Keep ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

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
                src={src}
                alt=""
                className="w-full h-full object-contain"
            />
            {/* Debug: show remaining time */}
            <div className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
                {timeLeft}s
            </div>
        </div>
    );
}

