/**
 * Areas Service
 * Business logic for area operations
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import type { Area } from '@shared-types';

/**
 * Get all areas, optionally filtered by hotelId
 */
export async function getAreas(hotelId?: string): Promise<Area[]> {
  // Build where clause
  const where = hotelId ? { hotelId } : {};

  // Fetch areas from database
  const areas = await prisma.area.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      hotelId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  log.info('Areas fetched successfully', {
    count: areas.length,
    hotelId,
  });

  return areas;
}
