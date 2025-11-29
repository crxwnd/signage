/**
 * Video Player Demo Page
 * Demonstration of HLS video playback with VideoPlayer component
 */

'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { VideoPlayer } from '@/components/video';
import { Video, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VideoDemoPage() {
  const [lastEvent, setLastEvent] = useState<string>('');

  // Example HLS sources
  const exampleVideos = [
    {
      id: 'sample-1',
      title: 'Big Buck Bunny (HLS)',
      description: 'Open source test video with HLS streaming',
      src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      poster: 'https://test-streams.mux.dev/x36xhzz/thumbnails/thumbnail.jpg',
    },
    {
      id: 'sample-2',
      title: 'Sintel (HLS)',
      description: 'Another test video with adaptive bitrate',
      src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      poster: 'https://bitdash-a.akamaihd.net/content/sintel/poster.png',
    },
  ];

  // Local HLS example (will only work if backend is serving files)
  const localExample = {
    id: 'local-1',
    title: 'Local HLS Video',
    description: 'Example from local backend storage',
    src: 'http://localhost:3001/hls/example-content-id/master.m3u8',
    poster: 'http://localhost:3001/thumbnails/example-content-id.jpg',
  };

  // Event handlers
  const handlePlay = (title: string) => {
    setLastEvent(`▶️  Playing: ${title}`);
    console.log(`Playing: ${title}`);
  };

  const handlePause = (title: string) => {
    setLastEvent(`⏸️  Paused: ${title}`);
    console.log(`Paused: ${title}`);
  };

  const handleEnded = (title: string) => {
    setLastEvent(`⏹️  Ended: ${title}`);
    console.log(`Ended: ${title}`);
  };

  const handleError = (title: string, error: Error) => {
    setLastEvent(`❌ Error in ${title}: ${error.message}`);
    console.error(`Error in ${title}:`, error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Player Demo</h1>
          <p className="mt-2 text-gray-600">
            Test HLS video streaming with adaptive bitrate
          </p>
        </div>
        <Video className="h-8 w-8 text-gray-400" />
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            About HLS Streaming
          </CardTitle>
          <CardDescription>
            HTTP Live Streaming (HLS) enables adaptive bitrate video playback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Adaptive Quality</p>
                <p className="text-xs text-gray-600">
                  Automatically adjusts to network conditions (360p, 720p, 1080p)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Low Latency</p>
                <p className="text-xs text-gray-600">
                  10-second segments for smooth playback
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Browser Support</p>
                <p className="text-xs text-gray-600">
                  HLS.js for Chrome/Firefox, native for Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Bandwidth Efficient</p>
                <p className="text-xs text-gray-600">
                  Only downloads necessary quality level
                </p>
              </div>
            </div>
          </div>

          {/* Last Event */}
          {lastEvent && (
            <div className="rounded-md bg-gray-100 p-3">
              <p className="text-sm font-mono text-gray-700">
                Last Event: {lastEvent}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Videos Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {exampleVideos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <CardTitle className="text-lg">{video.title}</CardTitle>
              <CardDescription>{video.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoPlayer
                src={video.src}
                poster={video.poster}
                title={video.title}
                controls={true}
                onPlay={() => handlePlay(video.title)}
                onPause={() => handlePause(video.title)}
                onEnded={() => handleEnded(video.title)}
                onError={(error) => handleError(video.title, error)}
              />
              <div className="mt-3 rounded-md bg-gray-50 p-2">
                <p className="truncate text-xs text-gray-600">
                  Source: {video.src}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Local Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{localExample.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {localExample.description}
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              Requires backend
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoPlayer
            src={localExample.src}
            poster={localExample.poster}
            title={localExample.title}
            controls={true}
            onPlay={() => handlePlay(localExample.title)}
            onPause={() => handlePause(localExample.title)}
            onEnded={() => handleEnded(localExample.title)}
            onError={(error) => handleError(localExample.title, error)}
          />
          <div className="mt-3 rounded-md bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-700">
              To test local HLS:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-xs text-gray-600">
              <li>Transcode a video using the backend videoQueue</li>
              <li>Ensure backend serves static files from /storage/hls/</li>
              <li>Update the src URL with your content ID</li>
            </ol>
            <p className="mt-2 truncate text-xs text-gray-500">
              Source: {localExample.src}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Implementation</CardTitle>
          <CardDescription>
            How the VideoPlayer component works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-gray-200 p-3">
            <h4 className="mb-2 text-sm font-semibold">HLS.js Integration</h4>
            <p className="text-xs text-gray-600">
              Uses HLS.js library for browsers without native HLS support
              (Chrome, Firefox). Automatically detects and falls back to native
              playback for Safari.
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <h4 className="mb-2 text-sm font-semibold">Adaptive Streaming</h4>
            <p className="text-xs text-gray-600">
              Player automatically switches between quality levels (360p, 720p,
              1080p) based on available bandwidth and screen size.
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <h4 className="mb-2 text-sm font-semibold">Error Recovery</h4>
            <p className="text-xs text-gray-600">
              Automatically recovers from network and media errors. Retries
              loading on network failures and attempts media recovery on
              playback issues.
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <h4 className="mb-2 text-sm font-semibold">Events & Callbacks</h4>
            <p className="text-xs text-gray-600">
              Supports onPlay, onPause, onEnded, and onError callbacks for
              integration with analytics and UI updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
