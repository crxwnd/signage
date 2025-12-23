/**
 * Playlist Controller
 * HTTP request handlers for playlist endpoints
 * Implements RBAC (Role-Based Access Control)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { log } from '../middleware/logger';
import * as playlistService from '../services/playlistService';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import { prisma } from '../utils/prisma';
import {
  canAccessDisplay,
  type RBACUser,
} from '../middleware/permissions';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

const addToPlaylistSchema = z.object({
  contentId: z.string().min(1),
  order: z.number().int().min(0).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
});

const reorderPlaylistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
});

// ==============================================
// CONTROLLER HANDLERS
// ==============================================

/**
 * GET /api/playlists/:displayId
 * Get playlist for a display
 * RBAC: User must have access to the display
 */
export async function getPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as RBACUser | undefined;
    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Display ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get display to verify access
    const display = await prisma.display.findUnique({
      where: { id: displayId },
      select: { id: true, hotelId: true, areaId: true },
    });

    if (!display) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Display ${displayId} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Verify user can access this display
    if (!canAccessDisplay(user, display)) {
      log.warn('User denied access to display playlist', {
        userId: user.userId,
        displayId,
      });
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this display' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const playlist = await playlistService.getPlaylist(displayId);

    const response: ApiSuccessResponse = {
      success: true,
      data: playlist,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get playlist', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch playlist' },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/playlists/:displayId/content
 * Add content to playlist
 * RBAC: HOTEL_ADMIN+ can add, must have access to display and content
 */
export async function addToPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as RBACUser | undefined;
    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: AREA_MANAGER cannot modify playlists
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Area Managers cannot modify playlists' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Display ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const payload = addToPlaylistSchema.parse(req.body);

    // Get display to verify access
    const display = await prisma.display.findUnique({
      where: { id: displayId },
      select: { id: true, hotelId: true, areaId: true },
    });

    if (!display) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Display ${displayId} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Verify user can access this display
    if (!canAccessDisplay(user, display)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this display' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Get content to verify access
    const content = await prisma.content.findUnique({
      where: { id: payload.contentId },
      select: { id: true, hotelId: true },
    });

    if (!content) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Content ${payload.contentId} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Verify user can access this content (same hotel)
    if (user.role !== 'SUPER_ADMIN' && content.hotelId !== user.hotelId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to use this content' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const item = await playlistService.addToPlaylist(displayId, payload);

    log.info('Content added to playlist', {
      userId: user.userId,
      displayId,
      contentId: payload.contentId,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: item,
      message: 'Content added to playlist',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to add to playlist', error);

    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: { errors: error.issues },
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Unique constraint violation (content already in playlist)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'CONFLICT', message: 'This content is already in the playlist' },
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add content to playlist' },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/playlists/item/:id
 * Remove item from playlist
 * RBAC: HOTEL_ADMIN+ can remove, must have access to the display
 */
export async function removeFromPlaylist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user as RBACUser | undefined;
    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: AREA_MANAGER cannot modify playlists
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Area Managers cannot modify playlists' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Item ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get playlist item with display info to verify access
    const playlistItem = await prisma.displayContent.findUnique({
      where: { id },
      include: {
        display: { select: { id: true, hotelId: true, areaId: true } },
      },
    });

    if (!playlistItem) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Playlist item ${id} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Verify user can access the display
    if (!canAccessDisplay(user, playlistItem.display)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this playlist' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    await playlistService.removeFromPlaylist(id);

    log.info('Content removed from playlist', {
      userId: user.userId,
      itemId: id,
      displayId: playlistItem.displayId,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: { id },
      message: 'Content removed from playlist',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to remove from playlist', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove content from playlist' },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PUT /api/playlists/:displayId/reorder
 * Reorder playlist items
 * RBAC: HOTEL_ADMIN+ can reorder, must have access to display
 */
export async function reorderPlaylist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user as RBACUser | undefined;
    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: AREA_MANAGER cannot modify playlists
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Area Managers cannot modify playlists' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Display ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get display to verify access
    const display = await prisma.display.findUnique({
      where: { id: displayId },
      select: { id: true, hotelId: true, areaId: true },
    });

    if (!display) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Display ${displayId} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Verify user can access this display
    if (!canAccessDisplay(user, display)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this display' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { items } = reorderPlaylistSchema.parse(req.body);
    const playlist = await playlistService.reorderPlaylist(displayId, items);

    log.info('Playlist reordered', {
      userId: user.userId,
      displayId,
      itemCount: items.length,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: playlist,
      message: 'Playlist reordered successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to reorder playlist', error);

    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: { errors: error.issues },
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (
      error instanceof Error &&
      error.message.includes('do not belong to this display')
    ) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder playlist' },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

