/**
 * Areas Controller
 * HTTP request handlers for area endpoints
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import * as areasService from '../services/areasService';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

const getAreasQuerySchema = z.object({
  hotelId: z.string().cuid().optional(),
});

// ==============================================
// CONTROLLER FUNCTIONS
// ==============================================

/**
 * GET /api/areas
 * Get all areas, optionally filtered by hotelId
 */
export async function getAreas(req: Request, res: Response) {
  try {
    // Validate query params
    const { hotelId } = getAreasQuerySchema.parse(req.query);

    // Fetch areas from service
    const areas = await areasService.getAreas(hotelId);

    const response: ApiSuccessResponse = {
      success: true,
      data: areas,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to fetch areas', error);

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
      return res.status(400).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch areas',
      },
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
}
