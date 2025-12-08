/**
 * Area Controller
 * HTTP request handlers for area management
 * Implements strict RBAC (Role-Based Access Control)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  deleteArea,
  areaExists,
  userHasAccessToArea,
} from '../services/areaService';
import type { JWTPayload } from '../services/authService';

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Create area schema
 */
const createAreaSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  hotelId: z.string().cuid('Invalid hotel ID'), // For SUPER_ADMIN
});

/**
 * Update area schema
 */
const updateAreaSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100).optional(),
  description: z.string().max(500).optional(),
});

// =============================================================================
// CONTROLLER HANDLERS
// =============================================================================

/**
 * GET /api/areas
 * Get all areas (with RBAC filtering)
 *
 * RBAC Rules:
 * - SUPER_ADMIN: See all areas
 * - HOTEL_ADMIN: See only areas in their hotel
 * - AREA_MANAGER: See only their specific area
 */
export async function getAreasHandler(req: Request, res: Response): Promise<void> {
  try {
    // Get authenticated user from JWT (set by authenticate middleware)
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Apply RBAC filtering
    let areas;

    switch (user.role) {
      case 'SUPER_ADMIN':
        // Super Admin: See ALL areas across all hotels
        areas = await getAreas();
        log.info('Super Admin retrieved all areas', { userId: user.userId, count: areas.length });
        break;

      case 'HOTEL_ADMIN':
        // Hotel Admin: See only areas in their hotel
        if (!user.hotelId) {
          const errorResponse: ApiErrorResponse = {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Hotel Admin must have a hotel assigned',
            },
            timestamp: new Date().toISOString(),
          };
          res.status(403).json(errorResponse);
          return;
        }
        areas = await getAreas({ hotelId: user.hotelId });
        log.info('Hotel Admin retrieved areas for hotel', {
          userId: user.userId,
          hotelId: user.hotelId,
          count: areas.length,
        });
        break;

      case 'AREA_MANAGER':
        // Area Manager: See ONLY their specific area
        if (!user.areaId) {
          const errorResponse: ApiErrorResponse = {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Area Manager must have an area assigned',
            },
            timestamp: new Date().toISOString(),
          };
          res.status(403).json(errorResponse);
          return;
        }
        areas = await getAreas({ id: user.areaId });
        log.info('Area Manager retrieved their area', {
          userId: user.userId,
          areaId: user.areaId,
          count: areas.length,
        });
        break;

      default:
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid role',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: { areas },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get areas', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching areas',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/areas/:id
 * Get a single area by ID (with RBAC check)
 *
 * RBAC Rules:
 * - SUPER_ADMIN: Can access any area
 * - HOTEL_ADMIN: Can only access areas in their hotel
 * - AREA_MANAGER: Can only access their specific area
 */
export async function getAreaByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Area ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get authenticated user from JWT
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Get the area
    const area = await getAreaById(id);

    if (!area) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Area not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Check if user has access to this area
    const hasAccess = await userHasAccessToArea(
      id,
      user.hotelId || null,
      user.areaId || null,
      user.role
    );

    if (!hasAccess) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this area',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    log.info('Area retrieved successfully', { userId: user.userId, areaId: id });

    const response: ApiSuccessResponse = {
      success: true,
      data: { area },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get area', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching area',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/areas
 * Create a new area
 *
 * RBAC Rules:
 * - SUPER_ADMIN: Can create areas for any hotel (hotelId required in body)
 * - HOTEL_ADMIN: Can only create areas for their hotel (hotelId auto-set)
 * - AREA_MANAGER: FORBIDDEN (cannot create areas)
 */
export async function createAreaHandler(req: Request, res: Response): Promise<void> {
  try {
    // Get authenticated user from JWT
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: Only SUPER_ADMIN and HOTEL_ADMIN can create areas
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Area Managers cannot create areas',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Validate request body
    const data = createAreaSchema.parse(req.body);

    // RBAC: HOTEL_ADMIN can only create areas for their hotel
    let hotelId: string;

    if (user.role === 'SUPER_ADMIN') {
      // Super admin can specify any hotelId
      hotelId = data.hotelId;
    } else if (user.role === 'HOTEL_ADMIN') {
      // Hotel admin: force hotelId to their hotel (ignore body hotelId)
      if (!user.hotelId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Hotel Admin must have a hotel assigned',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
      }
      hotelId = user.hotelId;
    } else {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid role for area creation',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Create the area
    const area = await createArea({
      name: data.name,
      description: data.description,
      hotelId,
    });

    log.info('Area created successfully', {
      userId: user.userId,
      areaId: area.id,
      hotelId,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: { area },
      message: 'Area created successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to create area', error);

    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.issues as unknown as Record<string, unknown>,
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
        message: 'An unexpected error occurred while creating area',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PATCH /api/areas/:id
 * Update an area
 *
 * RBAC Rules:
 * - SUPER_ADMIN: Can update any area
 * - HOTEL_ADMIN: Can only update areas in their hotel
 * - AREA_MANAGER: FORBIDDEN (cannot update areas)
 */
export async function updateAreaHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Area ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get authenticated user from JWT
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: Only SUPER_ADMIN and HOTEL_ADMIN can update areas
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Area Managers cannot update areas',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Check if area exists
    const exists = await areaExists(id);

    if (!exists) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Area not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Check if user has access to this area
    const hasAccess = await userHasAccessToArea(
      id,
      user.hotelId || null,
      user.areaId || null,
      user.role
    );

    if (!hasAccess) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this area',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Validate request body
    const data = updateAreaSchema.parse(req.body);

    // Update the area
    const area = await updateArea(id, data);

    log.info('Area updated successfully', {
      userId: user.userId,
      areaId: id,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: { area },
      message: 'Area updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to update area', error);

    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.issues as unknown as Record<string, unknown>,
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
        message: 'An unexpected error occurred while updating area',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/areas/:id
 * Delete an area
 *
 * RBAC Rules:
 * - SUPER_ADMIN: Can delete any area
 * - HOTEL_ADMIN: Can only delete areas in their hotel
 * - AREA_MANAGER: FORBIDDEN (cannot delete areas)
 */
export async function deleteAreaHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Area ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get authenticated user from JWT
    const user = (req as any).user as JWTPayload | undefined;

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // RBAC: Only SUPER_ADMIN and HOTEL_ADMIN can delete areas
    if (user.role === 'AREA_MANAGER') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Area Managers cannot delete areas',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Check if area exists
    const exists = await areaExists(id);

    if (!exists) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Area not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Check if user has access to this area
    const hasAccess = await userHasAccessToArea(
      id,
      user.hotelId || null,
      user.areaId || null,
      user.role
    );

    if (!hasAccess) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this area',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Delete the area
    await deleteArea(id);

    log.info('Area deleted successfully', {
      userId: user.userId,
      areaId: id,
    });

    const response: ApiSuccessResponse = {
      success: true,
      data: null,
      message: 'Area deleted successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to delete area', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while deleting area',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}
