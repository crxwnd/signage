/**
 * Socket.io Event Types
 * Strongly-typed events for real-time communication
 *
 * Event naming convention (kebab-case with prefixes):
 * - display-*    : Display device events
 * - content-*    : Content management events
 * - admin-*      : Administrative events
 * - sync-*       : Synchronization events
 */

import type { DisplayStatus } from './models/display';
import type { ContentType } from './models/content';

// ==============================================
// DISPLAY EVENTS
// ==============================================

/**
 * Display registers with the server
 */
export interface DisplayRegisterEvent {
  deviceId: string;
  deviceInfo: {
    userAgent: string;
    screenResolution: {
      width: number;
      height: number;
    };
    platform: string;
    version: string;
  };
  pairingCode?: string;
}

/**
 * Display status changed
 */
export interface DisplayStatusChangedEvent {
  displayId: string;
  status: DisplayStatus;
  lastSeen: string; // ISO timestamp
  message?: string;
}

/**
 * Display heartbeat (sent every 30s)
 */
export interface DisplayHeartbeatEvent {
  displayId: string;
  timestamp: number;
  currentContentId?: string;
  playbackPosition?: number; // Current position in seconds
}

/**
 * Display paired successfully
 */
export interface DisplayPairedEvent {
  displayId: string;
  hotelId: string;
  name: string;
  location: string;
}

/**
 * Display error occurred
 */
export interface DisplayErrorEvent {
  displayId: string;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  timestamp: number;
}

/**
 * Display created (admin action)
 */
export interface DisplayCreatedEvent {
  display: {
    id: string;
    name: string;
    location: string;
    status: DisplayStatus;
    hotelId: string;
    areaId: string | null;
  };
  timestamp: number;
}

/**
 * Display updated (admin action)
 */
export interface DisplayUpdatedEvent {
  display: {
    id: string;
    name: string;
    location: string;
    status: DisplayStatus;
    hotelId: string;
    areaId: string | null;
  };
  timestamp: number;
}

/**
 * Display deleted (admin action)
 */
export interface DisplayDeletedEvent {
  displayId: string;
  timestamp: number;
}

/**
 * Display role assigned (conductor/worker)
 */
export interface DisplayRoleAssignedEvent {
  displayId: string;
  role: 'conductor' | 'worker';
  areaId?: string;
  timestamp: number;
}

// ==============================================
// CONTENT EVENTS
// ==============================================

/**
 * Content uploaded
 */
export interface ContentUploadedEvent {
  contentId: string;
  hotelId: string;
  title: string;
  type: ContentType;
  url: string;
  fileSize: number;
}

/**
 * Content assigned to display
 */
export interface ContentAssignedEvent {
  displayId: string;
  contentId: string;
  order: number;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Content removed from display
 */
export interface ContentRemovedEvent {
  displayId: string;
  contentId: string;
}

/**
 * Content updated
 */
export interface ContentUpdatedEvent {
  contentId: string;
  changes: {
    title?: string;
    url?: string;
    duration?: number;
  };
}

/**
 * Content deleted
 */
export interface ContentDeletedEvent {
  contentId: string;
  hotelId: string;
}

/**
 * Playlist updated for display
 */
export interface PlaylistUpdatedEvent {
  displayId: string;
  playlist: {
    contentId: string;
    order: number;
    startTime?: string | null;
    endTime?: string | null;
  }[];
  timestamp: number;
}

// ==============================================
// SYNC EVENTS (Conductor Pattern)
// ==============================================

/**
 * Sync command from conductor to followers
 */
export interface SyncCommandEvent {
  conductorId: string;
  action: 'PLAY' | 'PAUSE' | 'SEEK' | 'STOP' | 'NEXT' | 'PREVIOUS';
  contentId: string;
  timestamp: number;
  position?: number; // Playback position in seconds
  targetDisplays?: string[]; // Specific displays, or broadcast if omitted
}

/**
 * Sync status from follower to conductor
 */
export interface SyncStatusEvent {
  displayId: string;
  conductorId: string;
  status: 'SYNCED' | 'SYNCING' | 'OUT_OF_SYNC' | 'ERROR';
  offset: number; // Offset in milliseconds
  currentPosition: number;
  contentId: string;
  timestamp: number;
}

/**
 * Conductor role assigned
 */
export interface ConductorAssignedEvent {
  conductorId: string;
  areaId: string;
  followerIds: string[];
  timestamp: number;
}

/**
 * Conductor role revoked
 */
export interface ConductorRevokedEvent {
  conductorId: string;
  reason: 'MANUAL' | 'OFFLINE' | 'ERROR';
  newConductorId?: string;
  timestamp: number;
}

// ==============================================
// ADMIN EVENTS
// ==============================================

/**
 * Admin joined monitoring
 */
export interface AdminJoinedEvent {
  userId: string;
  hotelId?: string;
  timestamp: number;
}

/**
 * Admin action performed
 */
export interface AdminActionEvent {
  userId: string;
  action: string;
  target: {
    type: 'display' | 'content' | 'user' | 'hotel';
    id: string;
  };
  details?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Bulk display update
 */
export interface BulkDisplayUpdateEvent {
  displayIds: string[];
  action: 'RESTART' | 'UPDATE_CONTENT' | 'CLEAR_CACHE' | 'SHUTDOWN';
  timestamp: number;
}

// ==============================================
// CACHE EVENTS
// ==============================================

/**
 * Cache status report from display
 */
export interface CacheStatusEvent {
  displayId: string;
  totalSize: number; // Bytes used
  maxSize: number; // Max bytes (5GB)
  items: {
    contentId: string;
    size: number;
    lastAccessed: string;
    priority: number;
  }[];
  timestamp: number;
}

/**
 * Cache clear command
 */
export interface CacheClearEvent {
  displayId: string;
  contentIds?: string[]; // Specific contents, or all if omitted
  timestamp: number;
}

/**
 * Cache download started
 */
export interface CacheDownloadStartedEvent {
  displayId: string;
  contentId: string;
  totalChunks: number;
  timestamp: number;
}

/**
 * Cache download progress
 */
export interface CacheDownloadProgressEvent {
  displayId: string;
  contentId: string;
  chunksDownloaded: number;
  totalChunks: number;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  timestamp: number;
}

/**
 * Cache download completed
 */
export interface CacheDownloadCompletedEvent {
  displayId: string;
  contentId: string;
  totalBytes: number;
  duration: number; // Download duration in ms
  timestamp: number;
}

/**
 * Cache download failed
 */
export interface CacheDownloadFailedEvent {
  displayId: string;
  contentId: string;
  error: string;
  timestamp: number;
}

// ==============================================
// CLIENT-TO-SERVER EVENTS MAP
// ==============================================

/**
 * Events that clients can emit to the server
 */
export interface ClientToServerEvents {
  'display:register': (data: DisplayRegisterEvent) => void;
  'display:heartbeat': (data: DisplayHeartbeatEvent) => void;
  'display:error': (data: DisplayErrorEvent) => void;
  'sync:status': (data: SyncStatusEvent) => void;
  'cache:status': (data: CacheStatusEvent) => void;
  'cache:download-progress': (data: CacheDownloadProgressEvent) => void;
  'admin:join': (data: AdminJoinedEvent) => void;
  'admin:action': (data: AdminActionEvent) => void;
}

// ==============================================
// SERVER-TO-CLIENT EVENTS MAP
// ==============================================

/**
 * Events that server can emit to clients
 */
export interface ServerToClientEvents {
  'display:status-changed': (data: DisplayStatusChangedEvent) => void;
  'display:paired': (data: DisplayPairedEvent) => void;
  'display:created': (data: DisplayCreatedEvent) => void;
  'display:updated': (data: DisplayUpdatedEvent) => void;
  'display:deleted': (data: DisplayDeletedEvent) => void;
  'display:role-assigned': (data: DisplayRoleAssignedEvent) => void;
  'content:uploaded': (data: ContentUploadedEvent) => void;
  'content:assigned': (data: ContentAssignedEvent) => void;
  'content:removed': (data: ContentRemovedEvent) => void;
  'content:updated': (data: ContentUpdatedEvent) => void;
  'content:deleted': (data: ContentDeletedEvent) => void;
  'playlist:updated': (data: PlaylistUpdatedEvent) => void;
  'sync:command': (data: SyncCommandEvent) => void;
  'sync:conductor-assigned': (data: ConductorAssignedEvent) => void;
  'sync:conductor-revoked': (data: ConductorRevokedEvent) => void;
  'admin:bulk-update': (data: BulkDisplayUpdateEvent) => void;
  'cache:clear': (data: CacheClearEvent) => void;
  'cache:download-started': (data: CacheDownloadStartedEvent) => void;
  'cache:download-completed': (data: CacheDownloadCompletedEvent) => void;
  'cache:download-failed': (data: CacheDownloadFailedEvent) => void;
}

// ==============================================
// INTER-SERVER EVENTS (optional, for clustering)
// ==============================================

/**
 * Events between server instances
 */
export interface InterServerEvents {
  ping: () => void;
}

// ==============================================
// SOCKET DATA (attached to socket instance)
// ==============================================

/**
 * Data attached to each socket connection
 */
export interface SocketData {
  userId?: string;
  displayId?: string;
  hotelId?: string;
  role?: 'admin' | 'display';
  authenticated: boolean;
}
