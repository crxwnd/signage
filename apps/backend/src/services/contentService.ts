/**
 * Content Service
 * Business logic for content CRUD operations
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import type { ContentType, ContentStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Content {
  id: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  originalUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  resolution: string | null;
  fileSize: bigint | null;
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentFilter {
  hotelId?: string;
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateContentPayload {
  name: string;
  type: ContentType;
  originalUrl: string;
  hotelId: string;
  duration?: number;
  resolution?: string;
  fileSize?: bigint;
}

export interface UpdateContentPayload {
  name?: string;
  status?: ContentStatus;
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all content with optional filtering and pagination
 */
export async function getContents(
  filter: ContentFilter = {},
  pagination: PaginationQuery = {}
): Promise<PaginatedResponse<Content>> {
  const { hotelId, type, status, search } = filter;
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

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  // Execute query with count
  const [contents, total] = await Promise.all([
    prisma.content.findMany({
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
    prisma.content.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items: contents as Content[],
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
 * Get content by ID
 */
export async function getContentById(id: string): Promise<Content | null> {
  const content = await prisma.content.findUnique({
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

  return content as Content | null;
}

/**
 * Create new content
 */
export async function createContent(
  payload: CreateContentPayload
): Promise<Content> {
  const { name, type, originalUrl, hotelId, duration, resolution, fileSize } =
    payload;

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

  // Create content
  const content = await prisma.content.create({
    data: {
      name,
      type,
      originalUrl,
      hotelId,
      duration: duration || null,
      resolution: resolution || null,
      fileSize: fileSize || null,
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

  log.info('Content created', { contentId: content.id, name: content.name });

  return content as Content;
}

/**
 * Update content
 */
export async function updateContent(
  id: string,
  payload: UpdateContentPayload
): Promise<Content> {
  // Verify content exists
  const existingContent = await prisma.content.findUnique({
    where: { id },
  });

  if (!existingContent) {
    throw new Error(`Content with id ${id} not found`);
  }

  // Update content
  const content = await prisma.content.update({
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

  log.info('Content updated', { contentId: id });

  return content as Content;
}

/**
 * Delete content
 */
export async function deleteContent(id: string): Promise<void> {
  // Verify content exists
  const existingContent = await prisma.content.findUnique({
    where: { id },
  });

  if (!existingContent) {
    throw new Error(`Content with id ${id} not found`);
  }

  // Delete content (cascade will delete DisplayContent relations)
  await prisma.content.delete({
    where: { id },
  });

  log.info('Content deleted', { contentId: id });
}

/**
 * Get content statistics
 */
export async function getContentStats(hotelId?: string) {
  const where = hotelId ? { hotelId } : {};

  const [total, videos, images, html, pending, processing, ready, error] =
    await Promise.all([
      prisma.content.count({ where }),
      prisma.content.count({ where: { ...where, type: 'VIDEO' } }),
      prisma.content.count({ where: { ...where, type: 'IMAGE' } }),
      prisma.content.count({ where: { ...where, type: 'HTML' } }),
      prisma.content.count({ where: { ...where, status: 'PENDING' } }),
      prisma.content.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.content.count({ where: { ...where, status: 'READY' } }),
      prisma.content.count({ where: { ...where, status: 'ERROR' } }),
    ]);

  return {
    total,
    byType: {
      videos,
      images,
      html,
    },
    byStatus: {
      pending,
      processing,
      ready,
      error,
    },
  };
}
