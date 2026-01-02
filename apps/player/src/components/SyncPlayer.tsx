/**
 * SyncPlayer Component
 * Dedicated sync-aware media player for synchronized playback
 * Uses existing sync hooks for drift adjustment
 */

'use client';

import { useState, useEffect, useRef } from 'react';

type SyncState = 'STOPPED' | 'PLAYING' | 'PAUSED';

interface ContentInfo {
    id: string;
    name: string;
    type: string;
    hlsUrl?: string | null;
    originalUrl?: string;
}

interface SyncGroupInfo {
    id: string;
    name: string;
    state: SyncState;
    position: number;
    currentItem: number;
    playlistItems: Array<{
        contentId: string;
        content: ContentInfo;
        order: number;
        duration?: number | null;
    }>;
}

interface SyncPlayerProps {
    syncGroup: SyncGroupInfo;
}

export function SyncPlayer({ syncGroup }: SyncPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(syncGroup.currentItem);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    const currentContent = syncGroup.playlistItems[currentItemIndex]?.content;
    const isPaused = syncGroup.state === 'PAUSED';
    const isStopped = syncGroup.state === 'STOPPED';

    // Sync position with server state
    useEffect(() => {
        if (videoRef.current && syncGroup.state === 'PLAYING') {
            const serverTime = syncGroup.position;
            const currentTime = videoRef.current.currentTime;
            const drift = Math.abs(currentTime - serverTime);

            // Only adjust if drift > 200ms
            if (drift > 0.2) {
                videoRef.current.currentTime = serverTime;
            }
        }
    }, [syncGroup.position, syncGroup.state]);

    // Handle item changes
    useEffect(() => {
        if (syncGroup.currentItem !== currentItemIndex) {
            setCurrentItemIndex(syncGroup.currentItem);
            setIsVideoLoaded(false);
        }
    }, [syncGroup.currentItem, currentItemIndex]);

    // Play/Pause control
    useEffect(() => {
        if (!videoRef.current) return;

        if (syncGroup.state === 'PLAYING' && isVideoLoaded) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    }, [syncGroup.state, isVideoLoaded]);

    if (!currentContent) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <p className="text-white text-2xl">Sin contenido en playlist</p>
            </div>
        );
    }

    const isVideo = currentContent.type === 'VIDEO';
    const contentUrl = currentContent.hlsUrl || currentContent.originalUrl;

    return (
        <div className="relative w-full h-full bg-black">
            {isVideo ? (
                <video
                    ref={videoRef}
                    src={contentUrl}
                    className="w-full h-full object-contain"
                    onLoadedData={() => setIsVideoLoaded(true)}
                    onEnded={() => {
                        // Advance to next item (handled by sync system)
                    }}
                    playsInline
                    muted={false}
                />
            ) : (
                <img
                    src={contentUrl}
                    alt={currentContent.name}
                    className="w-full h-full object-contain"
                />
            )}

            {/* Pause Overlay */}
            {isPaused && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 text-white mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <p className="text-white text-2xl">Sincronización en Pausa</p>
                </div>
            )}

            {/* Stop Overlay */}
            {isStopped && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 text-slate-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z" />
                    </svg>
                    <p className="text-slate-400 text-2xl">Sincronización Detenida</p>
                </div>
            )}

            {/* Sync Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${syncGroup.state === 'PLAYING' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-white text-sm">
                    {syncGroup.state === 'PLAYING' ? 'SYNC' : syncGroup.state}
                </span>
            </div>

            {/* Playlist Position */}
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-lg">
                <span className="text-white text-sm">
                    {currentItemIndex + 1} / {syncGroup.playlistItems.length}
                </span>
            </div>
        </div>
    );
}
