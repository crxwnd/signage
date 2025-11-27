/**
 * Display Socket.io Events
 * Emitters for display-related real-time events
 */

import { log } from '../middleware/logger';
import { emitToRoom } from './socketManager';
import type {
  DisplayCreatedEvent,
  DisplayUpdatedEvent,
  DisplayDeletedEvent,
  DisplayStatusChangedEvent,
} from '@shared-types';

/**
 * Room name for display events
 * All clients monitoring displays should join this room
 */
export const DISPLAYS_ROOM = 'displays';

/**
 * Emit display:created event
 * Broadcasts to all clients in the 'displays' room
 */
export function emitDisplayCreated(data: DisplayCreatedEvent): void {
  try {
    emitToRoom(DISPLAYS_ROOM, 'display:created', data);
    log.info('Display created event emitted', {
      displayId: data.display.id,
      displayName: data.display.name,
      room: DISPLAYS_ROOM,
    });
  } catch (error) {
    log.error('Failed to emit display:created event', error);
  }
}

/**
 * Emit display:updated event
 * Broadcasts to all clients in the 'displays' room
 */
export function emitDisplayUpdated(data: DisplayUpdatedEvent): void {
  try {
    emitToRoom(DISPLAYS_ROOM, 'display:updated', data);
    log.info('Display updated event emitted', {
      displayId: data.display.id,
      displayName: data.display.name,
      room: DISPLAYS_ROOM,
    });
  } catch (error) {
    log.error('Failed to emit display:updated event', error);
  }
}

/**
 * Emit display:deleted event
 * Broadcasts to all clients in the 'displays' room
 */
export function emitDisplayDeleted(data: DisplayDeletedEvent): void {
  try {
    emitToRoom(DISPLAYS_ROOM, 'display:deleted', data);
    log.info('Display deleted event emitted', {
      displayId: data.displayId,
      room: DISPLAYS_ROOM,
    });
  } catch (error) {
    log.error('Failed to emit display:deleted event', error);
  }
}

/**
 * Emit display:status-changed event
 * Broadcasts to all clients in the 'displays' room
 */
export function emitDisplayStatusChanged(
  data: DisplayStatusChangedEvent
): void {
  try {
    emitToRoom(DISPLAYS_ROOM, 'display:status-changed', data);
    log.info('Display status changed event emitted', {
      displayId: data.displayId,
      status: data.status,
      room: DISPLAYS_ROOM,
    });
  } catch (error) {
    log.error('Failed to emit display:status-changed event', error);
  }
}
