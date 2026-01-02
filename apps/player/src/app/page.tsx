'use client';

/**
 * Player Page
 * Main entry point for SmartTV display player
 * Uses Content Priority System:
 * 1. Alerts (highest priority)
 * 2. Sync Groups
 * 3. Schedules
 * 4. Playlist (default)
 * 5. Fallback
 */

import { useEffect, useState, useCallback } from 'react';
import { PlaylistPlayer, PairingScreen, OfflineBanner } from '@/components';
import { AlertOverlay } from '@/components/AlertOverlay';
import { SyncPlayer } from '@/components/SyncPlayer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { LoadingScreen } from '@/components/LoadingScreen';
import { NoContentScreen } from '@/components/NoContentScreen';
import { usePlayerSocket } from '@/hooks/usePlayerSocket';
import { useContentSource } from '@/hooks/useContentSource';
import { useOfflineMode } from '@/hooks/useOfflineMode';

// Backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Prepend backend URL to content paths
 */
function getFullUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
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
  const [isPaused, setIsPaused] = useState(false);

  // Content source from priority system
  const {
    source,
    isLoading: sourceLoading,
    error: sourceError,
    refetch,
    isAlert,
    isSync,
    isSchedule,
    isPlaylist,
    isFallback,
  } = useContentSource({ displayId, pollInterval: 60000 });

  // Handler for when pairing is confirmed
  const handlePaired = useCallback((newDisplayId: string) => {
    console.log('[Player] Paired with displayId:', newDisplayId);
    localStorage.setItem('displayId', newDisplayId);
    setDisplayId(newDisplayId);
  }, []);

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
      case 'refresh':
        refetch();
        break;
    }
  }, [refetch]);

  // Socket connection
  const {
    isConnected,
    pairingCode,
    error: socketError,
    requestPairing,
  } = usePlayerSocket({
    displayId,
    onPlaylistUpdate: refetch,
    onCommand: handleCommand,
    onPaired: handlePaired,
    onAlertActivated: () => {
      console.log('[Player] Alert received via socket');
      refetch();
    },
    onAlertDeactivated: () => {
      console.log('[Player] Alert deactivated via socket');
      refetch();
    },
    onScheduleActivated: () => {
      console.log('[Player] Schedule activated via socket');
      refetch();
    },
    onScheduleEnded: () => {
      console.log('[Player] Schedule ended via socket');
      refetch();
    },
    onContentRefresh: refetch,
  });

  // Offline mode
  const { isOffline, offlineSince } = useOfflineMode({
    onReconnect: () => {
      console.log('[Player] Reconnected - refreshing content');
      refetch();
    },
    onDisconnect: () => {
      console.log('[Player] Disconnected - using cached content');
    }
  });

  // Get initial displayId from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('displayId') || localStorage.getItem('displayId');

    if (id) {
      setDisplayId(id);
      localStorage.setItem('displayId', id);
    }
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
  if (sourceLoading && !source) {
    return <LoadingScreen />;
  }

  // Error state
  if (sourceError && !source) {
    return (
      <NoContentScreen reason={`Error de conexión: ${sourceError.message}`} />
    );
  }

  // No content available
  if (!source || source.type === 'none') {
    return (
      <NoContentScreen reason="Configure una playlist o schedule para este display" />
    );
  }

  // Convert source content to playlist items for PlaylistPlayer
  const getPlaylistItems = (): PlaylistItem[] => {
    if (source.syncGroup?.playlistItems) {
      return source.syncGroup.playlistItems.map(item => ({
        id: item.content.id,
        type: item.content.type,
        url: getFullUrl(item.content.hlsUrl || item.content.originalUrl),
        duration: item.duration || item.content.duration || 10,
        name: item.content.name,
      }));
    }
    if (source.content) {
      return [{
        id: source.content.id,
        type: source.content.type,
        url: getFullUrl(source.content.hlsUrl || source.content.originalUrl),
        duration: source.content.duration || 10,
        name: source.content.name,
      }];
    }
    return [];
  };

  // RENDER BASED ON CONTENT TYPE
  return (
    <div className="player-container w-screen h-screen bg-black overflow-hidden relative">
      {/* Offline Banner */}
      <OfflineBanner isOffline={isOffline} offlineSince={offlineSince} />

      {/* PRIORITY 1: Alert */}
      {isAlert && source.alert && (
        <AlertOverlay source={source}>
          {source.content && (
            <VideoPlayer
              src={getFullUrl(source.content.hlsUrl || source.content.originalUrl)}
              autoPlay
              muted
            />
          )}
        </AlertOverlay>
      )}

      {/* PRIORITY 2: Sync Group */}
      {isSync && source.syncGroup && (
        <SyncPlayer
          syncGroup={source.syncGroup}
        />
      )}

      {/* PRIORITY 3: Schedule or Playlist */}
      {(isSchedule || isPlaylist || isFallback) && (
        <PlaylistPlayer
          items={getPlaylistItems()}
          isPaused={isPaused}
          onItemChange={(index, item) => {
            console.log(`[Player] Now playing: ${item.name} (${index + 1}/${getPlaylistItems().length})`);
          }}
          isOffline={isOffline}
        />
      )}

      {/* Status overlay - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-white text-sm"
          style={{ zIndex: 1000, marginTop: isOffline ? '40px' : '0' }}
        >
          <p style={{ color: isConnected ? '#4CAF50' : '#ff6b6b' }}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </p>
          <p>Display: {displayId}</p>
          <p>Source: <strong>{source.type.toUpperCase()}</strong></p>
          <p>Priority: {source.priority}</p>
          {source.reason && <p className="text-xs text-gray-400">{source.reason}</p>}
          {isPaused && <p style={{ color: '#ff9800', fontWeight: 'bold' }}>PAUSED</p>}
          {isOffline && <p style={{ color: '#ff6b6b' }}>OFFLINE MODE</p>}
        </div>
      )}
    </div>
  );
}
