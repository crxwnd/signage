/**
 * Display Model Types
 * Synced with Prisma schema: apps/backend/prisma/schema.prisma
 */

/**
 * Display status enum
 * Represents the current operational state of a display device
 */
export enum DisplayStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

/**
 * Display interface
 * Represents a SmartTV display device in the signage system
 */
export interface Display {
  id: string;
  name: string;
  location: string;
  status: DisplayStatus;
  hotelId: string;
  areaId: string | null;
  lastSeen: Date | null;
  deviceInfo: Record<string, unknown> | null;
  pairingCode: string | null;
  pairedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Display filter for querying displays
 */
export interface DisplayFilter {
  hotelId?: string;
  status?: DisplayStatus;
  areaId?: string;
  search?: string;
}

/**
 * Display creation payload
 */
export interface CreateDisplayPayload {
  name: string;
  location: string;
  hotelId: string;
  areaId?: string | null;
  deviceInfo?: Record<string, unknown>;
}

/**
 * Display update payload
 */
export interface UpdateDisplayPayload {
  name?: string;
  location?: string;
  areaId?: string | null;
  status?: DisplayStatus;
}

/**
 * Display with related data
 */
export interface DisplayWithRelations extends Display {
  hotel?: {
    id: string;
    name: string;
  };
  contentCount?: number;
}
