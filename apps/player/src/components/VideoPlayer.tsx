'use client';

/**
 * VideoPlayer Component
 * HLS.js video player for streaming content
 */

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    onEnded?: () => void;
    onError?: (error: string) => void;
}

export function VideoPlayer({
    src,
    autoPlay = true,
    muted = true,
    onEnded,
    onError
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Cleanup previous instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        // Check if HLS is supported
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
            });

            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                setError(null);
                if (autoPlay) {
                    video.play().catch(console.error);
                }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                console.error('[HLS Error]', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Try to recover
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default: {
                            const errorMsg = `Fatal HLS error: ${data.type}`;
                            setError(errorMsg);
                            onError?.(errorMsg);
                            hls.destroy();
                            break;
                        }
                    }
                }
            });
        }
        // Native HLS support (Safari, iOS)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                if (autoPlay) {
                    video.play().catch(console.error);
                }
            });
        }
        else {
            const errorMsg = 'HLS is not supported in this browser';
            setError(errorMsg);
            onError?.(errorMsg);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src, autoPlay, onError]);

    return (
        <div className="relative w-full h-full bg-black">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                    <p className="text-white text-xl">{error}</p>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                muted={muted}
                playsInline
                onEnded={onEnded}
            />
        </div>
    );
}
