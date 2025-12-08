/**
 * Area Service
 * Business logic for area management
 */

import { prisma } from '../utils/prisma';
import type { Area } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateAreaInput {
  name: string;
  description?: string;
  hotelId: string;
}

export interface UpdateAreaInput {
  name?: string;
  description?: string;
}

export interface AreaFilter {
  hotelId?: string;
  id?: string;
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Create a new area
 *
 * @param data - Area creation data
 * @returns Created area
 *
 * @example
 * const area = await createArea({
 *   name: 'Lobby Principal',
 *   description: 'Main lobby area',
 *   hotelId: 'hotel-id-123'
 * });
 */
export async function createArea(data: CreateAreaInput): Promise<Area> {
  const area = await prisma.area.create({
    data: {
      name: data.name,
      description: data.description,
      hotelId: data.hotelId,
    },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          displays: true,
          users: true,
        },
      },
    },
  });

  return area as unknown as Area;
}

/**
 * Get areas with optional filtering
 *
 * @param filter - Optional filter criteria
 * @returns Array of areas matching the filter
 *
 * @example
 * // Get all areas for a hotel
 * const areas = await getAreas({ hotelId: 'hotel-id-123' });
 *
 * // Get a specific area
 * const area = await getAreas({ id: 'area-id-456' });
 */
export async function getAreas(filter: AreaFilter = {}): Promise<Area[]> {
  const areas = await prisma.area.findMany({
    where: filter,
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          displays: true,
          users: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return areas as unknown as Area[];
}

/**
 * Get a single area by ID
 *
 * @param id - Area ID
 * @returns Area or null if not found
 *
 * @example
 * const area = await getAreaById('area-id-123');
 * if (area) {
 *   console.log('Area name:', area.name);
 * }
 */
export async function getAreaById(id: string): Promise<Area | null> {
  const area = await prisma.area.findUnique({
    where: { id },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          displays: true,
          users: true,
        },
      },
    },
  });

  return area as unknown as Area | null;
}

/**
 * Update an area
 *
 * @param id - Area ID
 * @param data - Updated area data
 * @returns Updated area
 *
 * @example
 * const updatedArea = await updateArea('area-id-123', {
 *   name: 'Updated Lobby',
 *   description: 'Renovated lobby area'
 * });
 */
export async function updateArea(
  id: string,
  data: UpdateAreaInput
): Promise<Area> {
  const area = await prisma.area.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          displays: true,
          users: true,
        },
      },
    },
  });

  return area as unknown as Area;
}

/**
 * Delete an area
 *
 * @param id - Area ID
 * @returns Deleted area
 *
 * @example
 * const deletedArea = await deleteArea('area-id-123');
 */
export async function deleteArea(id: string): Promise<Area> {
  const area = await prisma.area.delete({
    where: { id },
  });

  return area;
}

/**
 * Check if an area exists
 *
 * @param id - Area ID
 * @returns True if area exists, false otherwise
 *
 * @example
 * const exists = await areaExists('area-id-123');
 * if (!exists) {
 *   throw new Error('Area not found');
 * }
 */
export async function areaExists(id: string): Promise<boolean> {
  const count = await prisma.area.count({
    where: { id },
  });

  return count > 0;
}

/**
 * Check if user has access to a specific area
 *
 * @param areaId - Area ID
 * @param userHotelId - User's hotel ID
 * @param userAreaId - User's area ID (for AREA_MANAGER)
 * @param userRole - User's role
 * @returns True if user has access, false otherwise
 *
 * @example
 * const hasAccess = await userHasAccessToArea(
 *   'area-id-123',
 *   'hotel-id-456',
 *   'area-id-123',
 *   'AREA_MANAGER'
 * );
 */
export async function userHasAccessToArea(
  areaId: string,
  userHotelId: string | null,
  userAreaId: string | null,
  userRole: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER'
): Promise<boolean> {
  // Super admin has access to all areas
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Get the area
  const area = await prisma.area.findUnique({
    where: { id: areaId },
    select: {
      id: true,
      hotelId: true,
    },
  });

  if (!area) {
    return false;
  }

  // Hotel admin has access to all areas in their hotel
  if (userRole === 'HOTEL_ADMIN') {
    return area.hotelId === userHotelId;
  }

  // Area manager only has access to their specific area
  if (userRole === 'AREA_MANAGER') {
    return area.id === userAreaId;
  }

  return false;
}
