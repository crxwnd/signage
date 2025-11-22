/**
 * Displays Controller
 * HTTP request handlers for display endpoints
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import * as displaysService from '../services/displaysService';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import { DisplayStatus } from '@shared-types';
import { broadcast } from '../socket/socketManager';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

const createDisplaySchema = z.object({
  name: z.string().min(3).max(100),
  location: z.string().min(3).max(200),
  hotelId: z.string().cuid(),
  areaId: z.string().cuid().optional().nullable(),
});

const updateDisplaySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  location: z.string().min(3).max(200).optional(),
  areaId: z.string().cuid().optional().nullable(),
  status: z.nativeEnum(DisplayStatus).optional(),
});

const getDisplaysQuerySchema = z.object({
  hotelId: z.string().cuid().optional(),
  status: z.nativeEnum(DisplayStatus).optional(),
  areaId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==============================================
// CONTROLLER HANDLERS
// ==============================================

/**
 * GET /api/displays
 * Get all displays with optional filtering and pagination
 */
export async function getDisplays(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate query parameters
    const query = getDisplaysQuerySchema.parse(req.query);

    const { hotelId, status, areaId, search, page, limit, sortBy, sortOrder } =
      query;

    // Get displays from service
    const result = await displaysService.getDisplays(
      { hotelId, status, areaId, search },
      { page, limit, sortBy, sortOrder }
    );

    const response: ApiSuccessResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get displays', error);

    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: { errors: error.issues },
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
        message: 'Failed to fetch displays',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/displays/:id
 * Get display by ID
 */
export async function getDisplayById(
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
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const display = await displaysService.getDisplayById(id);

    if (!display) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Display with id ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: display,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get display', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch display',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/displays
 * Create new display
 */
export async function createDisplay(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request body
    const payload = createDisplaySchema.parse(req.body);

    // Create display
    const display = await displaysService.createDisplay(payload);

    // Emit Socket.io event for real-time updates
    broadcast('display:created', {
      display: {
        id: display.id,
        name: display.name,
        location: display.location,
        status: display.status,
        hotelId: display.hotelId,
        areaId: display.areaId,
      },
      timestamp: Date.now(),
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: display,
      message: 'Display created successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to create display', error);

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

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create display',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PATCH /api/displays/:id
 * Update display
 */
export async function updateDisplay(
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
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate request body
    const payload = updateDisplaySchema.parse(req.body);

    // Update display
    const display = await displaysService.updateDisplay(id, payload);

    // Emit Socket.io event for real-time updates
    broadcast('display:updated', {
      display: {
        id: display.id,
        name: display.name,
        location: display.location,
        status: display.status,
        hotelId: display.hotelId,
        areaId: display.areaId,
      },
      timestamp: Date.now(),
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: display,
      message: 'Display updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to update display', error);

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

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update display',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/displays/:id
 * Delete display
 */
export async function deleteDisplay(
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
          message: 'Display ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    await displaysService.deleteDisplay(id);

    // Emit Socket.io event for real-time updates
    broadcast('display:deleted', {
      displayId: id,
      timestamp: Date.now(),
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: { id },
      message: 'Display deleted successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to delete display', error);

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
        message: 'Failed to delete display',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/displays/stats
 * Get display statistics
 */
export async function getDisplayStats(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await displaysService.getDisplayStats();

    const response: ApiSuccessResponse = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get display stats', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch display statistics',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}
