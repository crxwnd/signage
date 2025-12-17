/**
 * Content Controller
 * HTTP request handlers for content endpoints
 * Implements RBAC (Role-Based Access Control)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import { log } from '../middleware/logger';
import * as contentService from '../services/contentService';
import {
  validateFileSize,
  getContentTypeFromMime,
  formatFileSize,
} from '../middleware/upload';
import { addVideoTranscodeJob } from '../queue/videoQueue';
import { getVideoInfo } from '../services/ffmpegService';
import {
  getHotelFilter,
  type RBACUser,
} from '../middleware/permissions';

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
  // CORRECCIÓN: Se eliminó .cuid() para permitir IDs como 'seed-hotel-1'
  hotelId: z.string(),
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
  // CORRECCIÓN: Se eliminó .cuid()
  hotelId: z.string().optional(),
  type: ContentTypeEnum.optional(),
  status: ContentStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const uploadContentSchema = z.object({
  name: z.string().min(3).max(200),
  // CORRECCIÓN CRÍTICA: Se eliminó .cuid() para el upload
  hotelId: z.string(),
});

// ============================================================================
// CONTROLLER HANDLERS
// ============================================================================

/**
 * GET /api/content
 * Get all content with optional filtering and pagination
 * RBAC: Filters by user's hotel
 */
export async function getContents(
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

    // Validate query parameters
    const query = getContentsQuerySchema.parse(req.query);
    const { type, status, search, page, limit, sortBy, sortOrder } = query;

    // Apply RBAC filter based on user role
    const rbacFilter = getHotelFilter(user);

    // Get content from service with RBAC filter
    const result = await contentService.getContents(
      { ...rbacFilter, type, status, search },
      { page, limit, sortBy, sortOrder }
    );

    log.info('Content fetched with RBAC', {
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
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch contents' },
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

/**
 * POST /api/content/upload
 * Upload content file (video or image)
 */
export async function uploadContentFile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate body parameters
    const body = uploadContentSchema.parse(req.body);
    const { name, hotelId } = body;

    const file = req.file;

    // Validate file size based on type
    const sizeError = validateFileSize(file);
    if (sizeError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: sizeError,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Get content type from MIME type
    const contentType = getContentTypeFromMime(file.mimetype);
    if (!contentType) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `Unsupported file type: ${file.mimetype}`,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    log.info('File uploaded successfully', {
      filename: file.filename,
      originalName: file.originalname,
      size: formatFileSize(file.size),
      type: contentType,
      mimetype: file.mimetype,
    });

    // Build originalUrl (relative path to uploaded file)
    const originalUrl = `/uploads/${file.filename}`;

    // Extract video metadata if it's a video
    let duration: number | undefined;
    let resolution: string | undefined;

    if (contentType === 'VIDEO') {
      try {
        const videoPath = path.join(
          __dirname,
          '../../storage/uploads',
          file.filename
        );
        const videoMetadata = await getVideoInfo(videoPath);

        duration = videoMetadata.duration;
        resolution = videoMetadata.resolution;

        log.info('Video metadata extracted', {
          filename: file.filename,
          duration,
          resolution,
        });
      } catch (error) {
        log.warn('Failed to extract video metadata', {
          error,
          filename: file.filename,
        });
        // Continue without metadata - not critical
      }
    }

    // Create content in database
    // Inicialmente se crea como PENDING
    const content = await contentService.createContent({
      name,
      type: contentType,
      originalUrl,
      hotelId,
      duration,
      resolution,
      fileSize: BigInt(file.size),
    });

    log.info('Content created in database', {
      contentId: content.id,
      name: content.name,
      type: content.type,
    });

    // === AUTO-APPROVE IMAGES ===
    // Si NO es video (es imagen o HTML), marcar como READY inmediatamente
    if (contentType !== 'VIDEO') {
      await contentService.updateContent(content.id, { status: 'READY' });
      // Actualizamos el objeto local para que la respuesta al cliente ya diga READY
      content.status = 'READY';
      // Para imágenes, podemos usar la URL original como thumbnail por defecto
      if (contentType === 'IMAGE') {
        await contentService.updateContent(content.id, { thumbnailUrl: originalUrl });
        content.thumbnailUrl = originalUrl;
      }
      log.info('Non-video content auto-approved to READY', { contentId: content.id });
    }

    // If it's a video, add to transcoding queue
    if (contentType === 'VIDEO') {
      try {
        const inputPath = path.join(
          __dirname,
          '../../storage/uploads',
          file.filename
        );
        const outputDir = path.join(__dirname, '../../storage/hls', content.id);
        const thumbnailPath = path.join(
          __dirname,
          '../../storage/thumbnails',
          `${content.id}.jpg`
        );

        await addVideoTranscodeJob({
          contentId: content.id,
          inputPath,
          outputDir,
          thumbnailPath,
        });

        log.info('Video transcoding job added to queue', {
          contentId: content.id,
        });
      } catch (error) {
        log.error('Failed to add video to transcoding queue', {
          error,
          contentId: content.id,
        });
        // Don't fail the upload - transcoding can be retried later
      }
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: content,
      message: `Content uploaded successfully. ${contentType === 'VIDEO'
        ? 'Video transcoding has been queued.'
        : ''
        }`,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to upload content', error);

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
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload content',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}