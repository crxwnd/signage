/**
 * Displays Service
 * Business logic for display CRUD operations
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import type {
  Display,
  DisplayFilter,
  CreateDisplayPayload,
  UpdateDisplayPayload,
  PaginatedResponse,
  PaginationQuery,
} from '@shared-types';
import { DisplayStatus } from '@shared-types';

/**
 * Get all displays with optional filtering and pagination
 */
export async function getDisplays(
  filter: DisplayFilter = {},
  pagination: PaginationQuery = {}
): Promise<PaginatedResponse<Display>> {
  const { hotelId, status, areaId, search } = filter;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = pagination;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (hotelId) {
    where.hotelId = hotelId;
  }

  if (status) {
    where.status = status;
  }

  if (areaId) {
    where.areaId = areaId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Execute query with count
  const [displays, total] = await Promise.all([
    prisma.display.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.display.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items: displays as Display[],
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get display by ID
 */
export async function getDisplayById(id: string): Promise<Display | null> {
  const display = await prisma.display.findUnique({
    where: { id },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return display as Display | null;
}

/**
 * Create new display
 */
export async function createDisplay(
  payload: CreateDisplayPayload
): Promise<Display> {
  const { name, location, hotelId, areaId, orientation, resolution } = payload;

  // Verify hotel exists, create default hotel if not
  let hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    log.info(`Hotel with id ${hotelId} not found, creating default hotel...`);

    // Create default hotel automatically
    hotel = await prisma.hotel.create({
      data: {
        id: hotelId,
        name: 'Demo Hotel',
        address: '123 Demo Street, Demo City',
      },
    });

    log.info('Default hotel created successfully', { hotelId: hotel.id });
  }

  // Create display
  const display = await prisma.display.create({
    data: {
      name,
      location,
      hotelId,
      areaId: areaId || null,
      status: DisplayStatus.OFFLINE,
      orientation: orientation || 'horizontal',
      resolution: resolution || '1920x1080',
    },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  log.info('Display created', { displayId: display.id, name: display.name });

  return display as Display;
}

/**
 * Update display
 */
export async function updateDisplay(
  id: string,
  payload: UpdateDisplayPayload
): Promise<Display> {
  // Verify display exists
  const existingDisplay = await prisma.display.findUnique({
    where: { id },
  });

  if (!existingDisplay) {
    throw new Error(`Display with id ${id} not found`);
  }

  // Update display
  const display = await prisma.display.update({
    where: { id },
    data: payload,
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  log.info('Display updated', { displayId: id });

  return display as Display;
}

/**
 * Delete display
 */
export async function deleteDisplay(id: string): Promise<void> {
  // Verify display exists
  const existingDisplay = await prisma.display.findUnique({
    where: { id },
  });

  if (!existingDisplay) {
    throw new Error(`Display with id ${id} not found`);
  }

  // Delete display (cascade will delete DisplayContent relations)
  await prisma.display.delete({
    where: { id },
  });

  log.info('Display deleted', { displayId: id });
}

/**
 * Update display last seen timestamp
 */
export async function updateDisplayLastSeen(id: string): Promise<void> {
  await prisma.display.update({
    where: { id },
    data: {
      lastSeen: new Date(),
      status: DisplayStatus.ONLINE,
    },
  });
}

/**
 * Get display statistics
 */
export async function getDisplayStats() {
  const [total, online, offline, error] = await Promise.all([
    prisma.display.count(),
    prisma.display.count({ where: { status: DisplayStatus.ONLINE } }),
    prisma.display.count({ where: { status: DisplayStatus.OFFLINE } }),
    prisma.display.count({ where: { status: DisplayStatus.ERROR } }),
  ]);

  return {
    total,
    online,
    offline,
    error,
  };
}
