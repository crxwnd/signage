'use client';

/**
 * Player Page
 * Main entry point for SmartTV display player
 * Loads playlist from backend and plays content in a loop
 */

import { useEffect, useState, useCallback } from 'react';
import { PlaylistPlayer } from '@/components/PlaylistPlayer';

// Backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ContentItem {
  id: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'HTML';
  hlsUrl: string | null;
  originalUrl: string;
  duration: number | null;
}

interface DisplayContentItem {
  id: string;
  content: ContentItem;
  order: number;
}

interface PlaylistItem {
  id: string;
  type: 'VIDEO' | 'IMAGE' | 'HTML';
  url: string;
  duration?: number;
  name: string;
}

export default function PlayerPage() {
  const [displayId, setDisplayId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<string>('');

  // Get displayId from query params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('displayId') || localStorage.getItem('displayId');

    if (id) {
      setDisplayId(id);
      localStorage.setItem('displayId', id);
    } else {
      setError('No display ID provided. Add ?displayId=xxx to URL');
      setIsLoading(false);
    }
  }, []);

  // Load playlist when we have displayId
  useEffect(() => {
    if (!displayId) return;

    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/displays/${displayId}/playlist`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Display not found');
          }
          throw new Error(`Failed to load playlist: ${response.status}`);
        }

        const data = await response.json();
        const rawItems = data.data?.items || data.items || [];

        // Transform to PlaylistPlayer format
        const items: PlaylistItem[] = rawItems
          .sort((a: DisplayContentItem, b: DisplayContentItem) => a.order - b.order)
          .map((item: DisplayContentItem) => ({
            id: item.content.id,
            type: item.content.type,
            url: item.content.hlsUrl || item.content.originalUrl,
            duration: item.content.duration || 10,
            name: item.content.name,
          }));

        setPlaylist(items);
        setError(null);

        if (items.length > 0 && items[0]) {
          setNowPlaying(items[0].name);
        }
      } catch (err) {
        console.error('Failed to load playlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, [displayId]);

  // Automatic fullscreen
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen not available:', err);
      }
    };

    // Try fullscreen after user interaction
    const handleClick = () => {
      enterFullscreen();
      document.removeEventListener('click', handleClick);
    };
    document.addEventListener('click', handleClick);

    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Hide cursor after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const hideCursor = () => {
      document.body.classList.add('cursor-hidden');
    };

    const showCursor = () => {
      document.body.classList.remove('cursor-hidden');
      clearTimeout(timeout);
      timeout = setTimeout(hideCursor, 3000);
    };

    document.addEventListener('mousemove', showCursor);
    timeout = setTimeout(hideCursor, 3000);

    return () => {
      document.removeEventListener('mousemove', showCursor);
      clearTimeout(timeout);
    };
  }, []);

  // Handle item change
  const handleItemChange = useCallback((index: number, item: PlaylistItem) => {
    console.log(`Now playing: ${item.name} (${index + 1}/${playlist.length})`);
    setNowPlaying(item.name);
  }, [playlist.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading content...</p>
          {displayId && (
            <p className="text-gray-500 text-sm mt-2">Display: {displayId}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-white text-xl mb-2">Error</p>
          <p className="text-gray-400">{error}</p>
          {displayId && (
            <p className="text-gray-500 text-sm mt-4">Display: {displayId}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Player
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <PlaylistPlayer
        items={playlist}
        onItemChange={handleItemChange}
      />

      {/* Debug overlay - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-white text-sm">
          <p>Display: {displayId}</p>
          <p>Playing: {nowPlaying}</p>
          <p>Items: {playlist.length}</p>
        </div>
      )}
    </div>
  );
}
