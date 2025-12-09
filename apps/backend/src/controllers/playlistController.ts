/**
 * Playlist Controller
 * HTTP request handlers for playlist endpoints
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { log } from '../middleware/logger';
import * as playlistService from '../services/playlistService';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

const addToPlaylistSchema = z.object({
  contentId: z.string().cuid(),
  order: z.number().int().min(0).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
});

const reorderPlaylistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
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
 */
export async function getPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
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

    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch playlist',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/playlists/:displayId/content
 * Add content to playlist
 */
export async function addToPlaylist(req: Request, res: Response): Promise<void> {
  try {
    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const payload = addToPlaylistSchema.parse(req.body);
    const item = await playlistService.addToPlaylist(displayId, payload);

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

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(errorResponse);
        return;
      }

      // Security: Cross-hotel assignment blocked
      if (error.message.includes('same hotel')) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
      }
    }

    // Unique constraint violation (content already in playlist)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'This content is already in the playlist',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add content to playlist',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/playlists/item/:id
 * Remove item from playlist
 */
export async function removeFromPlaylist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    await playlistService.removeFromPlaylist(id);

    const response: ApiSuccessResponse = {
      success: true,
      data: { id },
      message: 'Content removed from playlist',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to remove from playlist', error);

    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove content from playlist',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PUT /api/playlists/:displayId/reorder
 * Reorder playlist items
 */
export async function reorderPlaylist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { displayId } = req.params;

    if (!displayId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { items } = reorderPlaylistSchema.parse(req.body);
    const playlist = await playlistService.reorderPlaylist(displayId, items);

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

    if (error instanceof Error && error.message.includes('not found')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    if (
      error instanceof Error &&
      error.message.includes('do not belong to this display')
    ) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reorder playlist',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}
