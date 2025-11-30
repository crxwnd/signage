/**
 * Content Controller
 * HTTP request handlers for content endpoints
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import * as contentService from '../services/contentService';

// ============================================================================
// TYPES
// ============================================================================

interface ApiSuccessResponse {
  success: true;
  data?: unknown;
  message?: string;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const ContentTypeEnum = z.enum(['VIDEO', 'IMAGE', 'HTML']);
const ContentStatusEnum = z.enum(['PENDING', 'PROCESSING', 'READY', 'ERROR']);

const createContentSchema = z.object({
  name: z.string().min(3).max(200),
  type: ContentTypeEnum,
  originalUrl: z.string().url(),
  hotelId: z.string().cuid(),
  duration: z.number().int().positive().optional(),
  resolution: z.string().regex(/^\d+x\d+$/).optional(),
  fileSize: z.bigint().positive().optional(),
});

const updateContentSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  status: ContentStatusEnum.optional(),
  hlsUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  resolution: z.string().regex(/^\d+x\d+$/).optional(),
});

const getContentsQuerySchema = z.object({
  hotelId: z.string().cuid().optional(),
  type: ContentTypeEnum.optional(),
  status: ContentStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CONTROLLER HANDLERS
// ============================================================================

/**
 * GET /api/content
 * Get all content with optional filtering and pagination
 */
export async function getContents(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate query parameters
    const query = getContentsQuerySchema.parse(req.query);

    const { hotelId, type, status, search, page, limit, sortBy, sortOrder } =
      query;

    // Get content from service
    const result = await contentService.getContents(
      { hotelId, type, status, search },
      { page, limit, sortBy, sortOrder }
    );

    const response: ApiSuccessResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get contents', error);

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
        message: 'Failed to fetch contents',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/content/:id
 * Get content by ID
 */
export async function getContentById(
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
          message: 'Content ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const content = await contentService.getContentById(id);

    if (!content) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Content with id ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: content,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get content', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch content',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/content
 * Create new content
 */
export async function createContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request body
    const payload = createContentSchema.parse(req.body);

    // Create content
    const content = await contentService.createContent(payload);

    const response: ApiSuccessResponse = {
      success: true,
      data: content,
      message: 'Content created successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to create content', error);

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
        message: 'Failed to create content',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PATCH /api/content/:id
 * Update content
 */
export async function updateContent(
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
          message: 'Content ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate request body
    const payload = updateContentSchema.parse(req.body);

    // Update content
    const content = await contentService.updateContent(id, payload);

    const response: ApiSuccessResponse = {
      success: true,
      data: content,
      message: 'Content updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to update content', error);

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
        message: 'Failed to update content',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * DELETE /api/content/:id
 * Delete content
 */
export async function deleteContent(
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
          message: 'Content ID is required',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Delete content
    await contentService.deleteContent(id);

    const response: ApiSuccessResponse = {
      success: true,
      message: 'Content deleted successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to delete content', error);

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
        message: 'Failed to delete content',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/content/stats
 * Get content statistics
 */
export async function getContentStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { hotelId } = req.query;

    const stats = await contentService.getContentStats(
      hotelId as string | undefined
    );

    const response: ApiSuccessResponse = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get content stats', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch content statistics',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}
