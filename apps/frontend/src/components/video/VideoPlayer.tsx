/**
 * VideoPlayer Component
 * HLS-enabled video player with fallback support
 *
 * Features:
 * - HLS.js for adaptive bitrate streaming
 * - Native HLS support for Safari
 * - Fallback to native video for non-HLS sources
 * - Responsive design
 * - Custom controls
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Card } from '@/components/ui';
import { AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoPlayerProps {
  /**
   * Video source URL
   * - For HLS: URL to master.m3u8 playlist
   * - For native: URL to video file (mp4, webm, etc.)
   */
  src: string;

  /**
   * Poster/thumbnail image URL
   */
  poster?: string;

  /**
   * Video title (for accessibility)
   */
  title?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable autoplay (muted)
   */
  autoPlay?: boolean;

  /**
   * Enable looping
   */
  loop?: boolean;

  /**
   * Show native browser controls
   * @default true
   */
  controls?: boolean;

  /**
   * Callback when video starts playing
   */
  onPlay?: () => void;

  /**
   * Callback when video pauses
   */
  onPause?: () => void;

  /**
   * Callback when video ends
   */
  onEnded?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VideoPlayer({
  src,
  poster,
  title = 'Video player',
  className = '',
  autoPlay = false,
  loop = false,
  controls = true,
  onPlay,
  onPause,
  onEnded,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsSupported, setHlsSupported] = useState(false);

  // ============================================================================
  // HLS INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check if HLS is supported
    const isHlsSupported = Hls.isSupported();
    setHlsSupported(isHlsSupported);

    // Check if source is HLS (ends with .m3u8)
    const isHlsSource = src.endsWith('.m3u8');

    if (isHlsSource) {
      if (isHlsSupported) {
        // Use HLS.js for browsers without native HLS support (Chrome, Firefox, etc.)
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        // HLS events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest loaded');
          setLoading(false);
          setError(null);

          // Auto-play if enabled
          if (autoPlay) {
            video.muted = true; // Required for autoplay
            video.play().catch((err) => {
              console.warn('Autoplay failed:', err);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('❌ HLS error:', data);

          if (data.fatal) {
            setLoading(false);
            const errorMessage = `HLS error: ${data.type} - ${data.details}`;
            setError(errorMessage);

            if (onError) {
              onError(new Error(errorMessage));
            }

            // Try to recover from errors
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, attempting to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, attempting to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('💥 Fatal error, cannot recover');
                hls.destroy();
                break;
            }
          }
        });

        // Cleanup
        return () => {
          if (hls) {
            hls.destroy();
            hlsRef.current = null;
          }
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari, iOS)
        console.log('✅ Using native HLS support');
        video.src = src;
        setLoading(false);
      } else {
        // No HLS support
        const errorMessage = 'HLS is not supported in this browser';
        setError(errorMessage);
        setLoading(false);
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    } else {
      // Non-HLS source (regular video file)
      console.log('📹 Using native video playback');
      video.src = src;
      setLoading(false);
    }
  }, [src, autoPlay, onError]);

  // ============================================================================
  // VIDEO EVENT HANDLERS
  // ============================================================================

  const handlePlay = () => {
    console.log('▶️  Video playing');
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    console.log('⏸️  Video paused');
    if (onPause) onPause();
  };

  const handleEnded = () => {
    console.log('⏹️  Video ended');
    if (onEnded) onEnded();
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoElement = e.currentTarget;
    const errorCode = videoElement.error?.code;
    const errorMessage = videoElement.error?.message || 'Unknown video error';

    console.error('❌ Video error:', errorCode, errorMessage);
    setError(`Video error: ${errorMessage}`);
    setLoading(false);

    if (onError) {
      onError(new Error(errorMessage));
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (error) {
    return (
      <Card className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="text-center text-sm text-red-600">{error}</p>
        <p className="mt-2 text-center text-xs text-gray-500">
          {!hlsSupported && src.endsWith('.m3u8') && (
            <>HLS.js is not supported. Try Safari or update your browser.</>
          )}
        </p>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-sm text-white">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full rounded-lg bg-black"
        poster={poster}
        controls={controls}
        loop={loop}
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        aria-label={title}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 rounded bg-gray-100 p-2 text-xs text-gray-600">
          <div>HLS.js supported: {hlsSupported ? '✅' : '❌'}</div>
          <div>Source: {src.endsWith('.m3u8') ? 'HLS' : 'Native'}</div>
          <div className="truncate">URL: {src}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default VideoPlayer;
