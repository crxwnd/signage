/**
 * Playlist Service
 * Business logic for display-content playlist management
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

export interface PlaylistItem {
  id: string;
  displayId: string;
  contentId: string;
  order: number;
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date;
  content: {
    id: string;
    name: string;
    type: string;
    status: string;
    thumbnailUrl: string | null;
    hlsUrl: string | null;
    duration: number | null;
  };
}

export interface AddToPlaylistPayload {
  contentId: string;
  order?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface ReorderItem {
  id: string;
  order: number;
}

/**
 * Get playlist for a display (ordered by `order` field)
 */
export async function getPlaylist(displayId: string): Promise<PlaylistItem[]> {
  // Verify display exists
  const display = await prisma.display.findUnique({ where: { id: displayId } });
  if (!display) {
    throw new Error(`Display with id ${displayId} not found`);
  }

  const items = await prisma.displayContent.findMany({
    where: { displayId },
    orderBy: { order: 'asc' },
    include: {
      content: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          thumbnailUrl: true,
          hlsUrl: true,
          duration: true,
        },
      },
    },
  });

  return items as PlaylistItem[];
}

/**
 * Add content to a display's playlist
 * SECURITY: Validates that content and display belong to the same hotel
 */
export async function addToPlaylist(
  displayId: string,
  payload: AddToPlaylistPayload
): Promise<PlaylistItem> {
  const { contentId, order, startTime, endTime } = payload;

  // Fetch display and content to validate hotel ownership
  const [display, content] = await Promise.all([
    prisma.display.findUnique({ where: { id: displayId } }),
    prisma.content.findUnique({ where: { id: contentId } }),
  ]);

  if (!display) {
    throw new Error(`Display with id ${displayId} not found`);
  }

  if (!content) {
    throw new Error(`Content with id ${contentId} not found`);
  }

  // SECURITY: Validate same hotel - prevents cross-hotel content assignment
  if (display.hotelId !== content.hotelId) {
    log.warn('Cross-hotel content assignment attempt blocked', {
      displayId,
      displayHotelId: display.hotelId,
      contentId,
      contentHotelId: content.hotelId,
    });
    throw new Error('Content and Display must belong to the same hotel');
  }

  // Calculate order if not provided (append to end)
  let newOrder = order;
  if (newOrder === undefined) {
    const maxOrder = await prisma.displayContent.aggregate({
      where: { displayId },
      _max: { order: true },
    });
    newOrder = (maxOrder._max.order ?? -1) + 1;
  }

  // Create the playlist item
  const item = await prisma.displayContent.create({
    data: {
      displayId,
      contentId,
      order: newOrder,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
    },
    include: {
      content: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          thumbnailUrl: true,
          hlsUrl: true,
          duration: true,
        },
      },
    },
  });

  log.info('Content added to playlist', {
    displayId,
    contentId,
    order: newOrder,
    hotelId: display.hotelId,
  });

  return item as PlaylistItem;
}

/**
 * Remove item from playlist
 */
export async function removeFromPlaylist(id: string): Promise<void> {
  const item = await prisma.displayContent.findUnique({ where: { id } });

  if (!item) {
    throw new Error(`Playlist item with id ${id} not found`);
  }

  await prisma.displayContent.delete({ where: { id } });

  log.info('Content removed from playlist', {
    itemId: id,
    displayId: item.displayId,
    contentId: item.contentId,
  });
}

/**
 * Reorder playlist items using a transaction for consistency
 */
export async function reorderPlaylist(
  displayId: string,
  items: ReorderItem[]
): Promise<PlaylistItem[]> {
  // Verify display exists
  const display = await prisma.display.findUnique({ where: { id: displayId } });
  if (!display) {
    throw new Error(`Display with id ${displayId} not found`);
  }

  // Verify all items belong to this display
  const existingItems = await prisma.displayContent.findMany({
    where: {
      id: { in: items.map((i) => i.id) },
      displayId,
    },
  });

  if (existingItems.length !== items.length) {
    throw new Error('One or more items do not belong to this display');
  }

  // Update all items in a transaction for consistency
  await prisma.$transaction(
    items.map((item) =>
      prisma.displayContent.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  log.info('Playlist reordered', {
    displayId,
    itemCount: items.length,
  });

  // Return updated playlist
  return getPlaylist(displayId);
}

/**
 * Get the hotelId for a display (used for RBAC validation)
 */
export async function getDisplayHotelId(displayId: string): Promise<string | null> {
  const display = await prisma.display.findUnique({
    where: { id: displayId },
    select: { hotelId: true },
  });
  return display?.hotelId ?? null;
}

/**
 * Get the hotelId for a playlist item (used for RBAC validation)
 */
export async function getPlaylistItemHotelId(itemId: string): Promise<string | null> {
  const item = await prisma.displayContent.findUnique({
    where: { id: itemId },
    include: {
      display: {
        select: { hotelId: true },
      },
    },
  });
  return item?.display.hotelId ?? null;
}
