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
 * Display orientation type
 */
export type DisplayOrientation = 'horizontal' | 'vertical';

/**
 * Display interface
 * Represents a SmartTV display device in the signage system
 */
export interface Display {
  id: string;
  name: string;
  location: string;
  status: DisplayStatus;
  orientation: DisplayOrientation;
  resolution: string;
  hotelId: string;
  areaId: string | null;
  lastSeen: Date | null;
  deviceInfo: Record<string, unknown> | null;
  pairingCode: string | null;
  pairedAt: Date | null;
  // Error tracking
  lastError: string | null;
  lastErrorCode: string | null;
  lastErrorAt: Date | null;
  errorCount: number;
  // Fallback content
  fallbackContentId: string | null;
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
  orientation?: DisplayOrientation;
  resolution?: string;
}

/**
 * Display update payload
 */
export interface UpdateDisplayPayload {
  name?: string;
  location?: string;
  areaId?: string | null;
  status?: DisplayStatus;
  orientation?: DisplayOrientation;
  resolution?: string;
  fallbackContentId?: string | null;
}

/**
 * Display with related data
 */
export interface DisplayWithRelations extends Display {
  hotel?: {
    id: string;
    name: string;
  };
  area?: {
    id: string;
    name: string;
  };
  contentCount?: number;
}

