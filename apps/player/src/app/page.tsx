'use client';

/**
 * Player Page
 * Main entry point for SmartTV display player
 * Loads playlist from backend and plays content in a loop
 * Supports Socket.io for real-time updates and pairing
 */

import { useEffect, useState, useCallback } from 'react';
import { PlaylistPlayer, PairingScreen } from '@/components';
import { usePlayerSocket } from '@/hooks/usePlayerSocket';

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
  const [isPaused, setIsPaused] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string>('');

  // Load playlist function
  const loadPlaylist = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/displays/${id}/playlist`);

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
  }, []);

  // Handler for when pairing is confirmed
  const handlePaired = useCallback((newDisplayId: string) => {
    console.log('[Player] Paired with displayId:', newDisplayId);
    localStorage.setItem('displayId', newDisplayId);
    setDisplayId(newDisplayId);
    loadPlaylist(newDisplayId);
  }, [loadPlaylist]);

  // Handler for remote commands
  const handleCommand = useCallback((command: string) => {
    console.log('[Player] Command:', command);
    switch (command) {
      case 'play':
        setIsPaused(false);
        break;
      case 'pause':
        setIsPaused(true);
        break;
      case 'restart':
        window.location.reload();
        break;
      case 'refresh-playlist':
        if (displayId) {
          loadPlaylist(displayId);
        }
        break;
      default:
        console.log('[Player] Unknown command:', command);
    }
  }, [displayId, loadPlaylist]);

  // Socket connection
  const {
    isConnected,
    pairingCode,
    error: socketError,
    requestPairing,
  } = usePlayerSocket({
    displayId,
    onPlaylistUpdate: () => {
      if (displayId) {
        loadPlaylist(displayId);
      }
    },
    onCommand: handleCommand,
    onPaired: handlePaired,
  });

  // Get initial displayId from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('displayId') || localStorage.getItem('displayId');

    if (id) {
      setDisplayId(id);
      localStorage.setItem('displayId', id);
      loadPlaylist(id);
    } else {
      setIsLoading(false);
    }
  }, [loadPlaylist]);

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

  // If no displayId, show pairing screen
  if (!displayId) {
    return (
      <PairingScreen
        code={pairingCode}
        isConnected={isConnected}
        error={socketError}
        onRequestCode={requestPairing}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading content...</p>
          <p className="text-gray-500 text-sm mt-2">Display: {displayId}</p>
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
          <p className="text-gray-500 text-sm mt-4">Display: {displayId}</p>
          <button
            onClick={() => loadPlaylist(displayId)}
            className="mt-6 px-4 py-2 bg-white/10 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Player
  return (
    <div className="player-container w-screen h-screen bg-black overflow-hidden relative">
      <PlaylistPlayer
        items={playlist}
        isPaused={isPaused}
        onItemChange={handleItemChange}
      />

      {/* Status overlay - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-white text-sm" style={{ zIndex: 1000 }}>
          <p style={{ color: isConnected ? '#4CAF50' : '#ff6b6b' }}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </p>
          <p>Display: {displayId}</p>
          <p>Playing: {nowPlaying}</p>
          <p>Items: {playlist.length}</p>
          {isPaused && <p style={{ color: '#ff9800', fontWeight: 'bold' }}>PAUSED</p>}
        </div>
      )}
    </div>
  );
}
