/**
 * Displays Controller
 * HTTP request handlers for display endpoints
 * Implements RBAC (Role-Based Access Control)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import * as displaysService from '../services/displaysService';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import { DisplayStatus } from '@shared-types';
import {
  emitDisplayCreated,
  emitDisplayUpdated,
  emitDisplayDeleted,
} from '../socket/displayEvents';
import {
  getDisplayFilter,
  canAccessDisplay,
  type RBACUser,
} from '../middleware/permissions';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

const createDisplaySchema = z.object({
  name: z.string().min(3),
  location: z.string().min(1), // Asegúrate de que location esté si lo usas
  // Cambiamos .cuid() por solo .string() para aceptar "seed-hotel-1"
  hotelId: z.string(),
  areaId: z.string().optional(),
  orientation: z.enum(['horizontal', 'vertical']).optional(),
  resolution: z.string().optional(),
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
 * RBAC: Filters results based on user role
 */
export async function getDisplays(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get user from JWT (set by authenticate middleware)
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

    // Validate query parameters
    const query = getDisplaysQuerySchema.parse(req.query);
    const { status, search, page, limit, sortBy, sortOrder } = query;

    // Apply RBAC filter based on user role
    const rbacFilter = getDisplayFilter(user);

    // Merge query filters with RBAC filter
    const filter = {
      ...rbacFilter,
      status,
      search,
      areaId: query.areaId || rbacFilter.areaId,
    };

    // Get displays from service
    const result = await displaysService.getDisplays(
      filter,
      { page, limit, sortBy, sortOrder }
    );

    log.info('Displays fetched with RBAC', {
      userId: user.userId,
      role: user.role,
      count: result.items?.length || 0,
    });

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
 * RBAC: Verifies user has access to this display
 */
export async function getDisplayById(
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

    // RBAC: Check if user can access this display
    if (!canAccessDisplay(user, display)) {
      log.warn('User denied access to display', {
        userId: user.userId,
        displayId: id,
        displayHotelId: display.hotelId,
      });
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this display',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
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
 * RBAC: HOTEL_ADMIN+ can create, hotelId from token for non-SUPER_ADMIN
 */
export async function createDisplay(
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

    // RBAC: AREA_MANAGER cannot create displays
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Area Managers cannot create displays',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Validate request body
    const payload = createDisplaySchema.parse(req.body);

    // Determine hotelId based on role
    let hotelId: string;
    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN must specify hotelId
      hotelId = payload.hotelId;
    } else {
      // HOTEL_ADMIN uses their own hotelId
      if (!user.hotelId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: { code: 'FORBIDDEN', message: 'User has no hotel assigned' },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
      }
      hotelId = user.hotelId;
    }

    // Create display
    const display = await displaysService.createDisplay({
      ...payload,
      hotelId,
    });

    log.info('Display created', {
      userId: user.userId,
      displayId: display.id,
      hotelId,
    });

    // Emit Socket.io event for real-time updates
    emitDisplayCreated({
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
 * RBAC: HOTEL_ADMIN+ can update displays in their hotel
 */
export async function updateDisplay(
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

    // RBAC: AREA_MANAGER cannot update displays
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Area Managers cannot update displays' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Display ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get display to check ownership
    const existingDisplay = await displaysService.getDisplayById(id);
    if (!existingDisplay) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Display with id ${id} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Check if user can modify this display
    if (!canAccessDisplay(user, existingDisplay)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this display' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Validate request body
    const payload = updateDisplaySchema.parse(req.body);

    // Update display
    const display = await displaysService.updateDisplay(id, payload);

    log.info('Display updated', { userId: user.userId, displayId: id });

    // Emit Socket.io event for real-time updates
    emitDisplayUpdated({
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

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update display' },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/displays/:id
 * Delete display
 * RBAC: HOTEL_ADMIN+ can delete displays in their hotel
 */
export async function deleteDisplay(
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

    // RBAC: AREA_MANAGER cannot delete displays
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Area Managers cannot delete displays' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Display ID is required' },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get display to check ownership
    const existingDisplay = await displaysService.getDisplayById(id);
    if (!existingDisplay) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: `Display with id ${id} not found` },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // RBAC: Check if user can delete this display
    if (!canAccessDisplay(user, existingDisplay)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this display' },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    await displaysService.deleteDisplay(id);

    log.info('Display deleted', { userId: user.userId, displayId: id });

    // Emit Socket.io event for real-time updates
    emitDisplayDeleted({
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

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete display' },
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
