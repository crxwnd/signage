/**
 * Conductor Manager
 * Manages conductor/worker role assignment for display synchronization
 *
 * Pattern:
 * - One conductor per area/group
 * - First display in an area becomes conductor
 * - Other displays become workers
 * - If conductor disconnects, oldest worker becomes new conductor
 */

import { log } from '../middleware/logger';
import { getIO } from './socketManager';
import type { DisplayRegisterEvent, DisplayRoleAssignedEvent } from '@shared-types';

/**
 * Display info tracked by conductor manager
 */
interface DisplayInfo {
  socketId: string;
  displayId: string;
  areaId?: string;
  role: 'conductor' | 'worker';
  connectedAt: number;
}

/**
 * Map of displays by area
 * areaId -> DisplayInfo[]
 */
const displaysByArea = new Map<string, DisplayInfo[]>();

/**
 * Map of socket ID to display info for quick lookup
 * socketId -> DisplayInfo
 */
const displaysBySocket = new Map<string, DisplayInfo>();

/**
 * Default area ID for displays without an area
 */
const DEFAULT_AREA = 'default';

/**
 * Register a display and assign its role (conductor or worker)
 */
export function registerDisplay(
  socketId: string,
  data: DisplayRegisterEvent
): void {
  const areaId = DEFAULT_AREA; // For now, all displays go to default area
  // In future, extract areaId from display database or pairing code

  log.info('Registering display for conductor assignment', {
    socketId,
    deviceId: data.deviceId,
    areaId,
  });

  // Get or create displays array for this area
  let areaDisplays = displaysByArea.get(areaId);
  if (!areaDisplays) {
    areaDisplays = [];
    displaysByArea.set(areaId, areaDisplays);
  }

  // Determine role: first display in area becomes conductor
  const role = areaDisplays.length === 0 ? 'conductor' : 'worker';

  // Create display info
  const displayInfo: DisplayInfo = {
    socketId,
    displayId: data.deviceId,
    areaId,
    role,
    connectedAt: Date.now(),
  };

  // Add to tracking maps
  areaDisplays.push(displayInfo);
  displaysBySocket.set(socketId, displayInfo);

  log.info('Display role assigned', {
    socketId,
    displayId: data.deviceId,
    role,
    areaId,
    totalInArea: areaDisplays.length,
  });

  // Emit role assignment to the display
  emitRoleAssignment(socketId, displayInfo);

  // If this is a new conductor, notify all workers in the area
  if (role === 'conductor') {
    notifyConductorAssigned(areaId, displayInfo);
  }
}

/**
 * Unregister a display when it disconnects
 * Reassign conductor if necessary
 */
export function unregisterDisplay(socketId: string): void {
  const displayInfo = displaysBySocket.get(socketId);

  if (!displayInfo) {
    log.debug('Display not found in conductor manager', { socketId });
    return;
  }

  const { areaId, role, displayId } = displayInfo;

  log.info('Unregistering display from conductor manager', {
    socketId,
    displayId,
    role,
    areaId,
  });

  // Remove from socket map
  displaysBySocket.delete(socketId);

  // Remove from area displays
  const areaDisplays = displaysByArea.get(areaId || DEFAULT_AREA);
  if (areaDisplays) {
    const index = areaDisplays.findIndex((d) => d.socketId === socketId);
    if (index !== -1) {
      areaDisplays.splice(index, 1);
    }

    // If this was the conductor, reassign to oldest worker
    if (role === 'conductor' && areaDisplays.length > 0) {
      reassignConductor(areaId || DEFAULT_AREA, displayId);
    }

    // Clean up empty areas
    if (areaDisplays.length === 0) {
      displaysByArea.delete(areaId || DEFAULT_AREA);
      log.info('Area has no displays, removed from tracking', { areaId });
    }
  }
}

/**
 * Reassign conductor role to the oldest worker in an area
 */
function reassignConductor(areaId: string, oldConductorId: string): void {
  const areaDisplays = displaysByArea.get(areaId);

  if (!areaDisplays || areaDisplays.length === 0) {
    log.warn('No displays available to reassign conductor', { areaId });
    return;
  }

  // Sort by connection time (oldest first)
  areaDisplays.sort((a, b) => a.connectedAt - b.connectedAt);

  // First display becomes new conductor
  const newConductor = areaDisplays[0];

  if (!newConductor) {
    log.error('No display available after sorting for conductor reassignment', { areaId });
    return;
  }

  newConductor.role = 'conductor';

  log.info('Reassigning conductor role', {
    areaId,
    oldConductorId,
    newConductorId: newConductor.displayId,
    newConductorSocket: newConductor.socketId,
  });

  // Emit new role assignment
  emitRoleAssignment(newConductor.socketId, newConductor);

  // Notify all displays in the area about conductor change
  notifyConductorAssigned(areaId, newConductor);
}

/**
 * Emit role assignment to a specific display
 */
function emitRoleAssignment(socketId: string, displayInfo: DisplayInfo): void {
  const io = getIO();
  if (!io) {
    log.error('Socket.io not initialized, cannot emit role assignment');
    return;
  }

  const roleEvent: DisplayRoleAssignedEvent = {
    displayId: displayInfo.displayId,
    role: displayInfo.role,
    areaId: displayInfo.areaId,
    timestamp: Date.now(),
  };

  io.to(socketId).emit('display:role-assigned', roleEvent);

  log.debug('Emitted role assignment', {
    socketId,
    role: displayInfo.role,
    displayId: displayInfo.displayId,
  });
}

/**
 * Notify all displays in an area about conductor assignment
 */
function notifyConductorAssigned(areaId: string, conductor: DisplayInfo): void {
  const io = getIO();
  if (!io) {
    log.error('Socket.io not initialized, cannot notify conductor assigned');
    return;
  }

  const areaDisplays = displaysByArea.get(areaId);
  if (!areaDisplays) return;

  // Get all worker IDs in this area
  const followerIds = areaDisplays
    .filter((d) => d.role === 'worker')
    .map((d) => d.displayId);

  // Emit to displays room (all displays are listening)
  io.to('displays').emit('sync:conductor-assigned', {
    conductorId: conductor.displayId,
    areaId: areaId,
    followerIds,
    timestamp: Date.now(),
  });

  log.info('Notified conductor assignment to area', {
    areaId,
    conductorId: conductor.displayId,
    followersCount: followerIds.length,
  });
}

/**
 * Get statistics about conductor assignments
 */
export function getConductorStats(): {
  totalAreas: number;
  totalDisplays: number;
  conductors: number;
  workers: number;
} {
  let totalDisplays = 0;
  let conductors = 0;
  let workers = 0;

  for (const displays of displaysByArea.values()) {
    totalDisplays += displays.length;
    conductors += displays.filter((d) => d.role === 'conductor').length;
    workers += displays.filter((d) => d.role === 'worker').length;
  }

  return {
    totalAreas: displaysByArea.size,
    totalDisplays,
    conductors,
    workers,
  };
}

/**
 * Get all displays in a specific area
 */
export function getAreaDisplays(areaId: string): DisplayInfo[] {
  return displaysByArea.get(areaId) || [];
}

/**
 * Get display info by socket ID
 */
export function getDisplayBySocket(socketId: string): DisplayInfo | undefined {
  return displaysBySocket.get(socketId);
}
