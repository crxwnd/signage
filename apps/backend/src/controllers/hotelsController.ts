/**
 * Hotels Controller
 * CRUD operations for hotel management
 * RBAC: SUPER_ADMIN only for create/update/delete
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import hotelService from '../services/hotelService';

// Validation schemas
const createHotelSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    address: z.string().min(5, 'Address must be at least 5 characters').max(255),
});

const updateHotelSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    address: z.string().min(5).max(255).optional(),
});

function sendError(res: Response, status: number, code: string, message: string, details?: unknown) {
    const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code, message, details: details as Record<string, unknown> },
        timestamp: new Date().toISOString(),
    };
    res.status(status).json(errorResponse);
}

function sendSuccess<T>(res: Response, status: number, data: T, message?: string) {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
}

/**
 * GET /api/hotels
 * Get all hotels
 * Query params: ?stats=true to include statistics
 */
export async function getHotels(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        const includeStats = req.query.stats === 'true';

        // RBAC filtering
        if (user.role === 'SUPER_ADMIN') {
            // Super admin sees all hotels
            const hotels = await hotelService.getHotels(includeStats);
            sendSuccess(res, 200, { hotels });
        } else {
            // Other roles only see their hotel
            if (!user.hotelId) {
                sendSuccess(res, 200, { hotels: [] });
                return;
            }

            const hotel = await hotelService.getHotelById(user.hotelId);
            sendSuccess(res, 200, { hotels: hotel ? [hotel] : [] });
        }
    } catch (error) {
        log.error('Error fetching hotels', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch hotels');
    }
}

/**
 * GET /api/hotels/stats
 * Get global hotel statistics
 * RBAC: SUPER_ADMIN only
 */
export async function getHotelStats(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role !== 'SUPER_ADMIN') {
            sendError(res, 403, 'FORBIDDEN', 'Only Super Admins can view global stats');
            return;
        }

        const stats = await hotelService.getHotelStatsSummary();
        sendSuccess(res, 200, { stats });
    } catch (error) {
        log.error('Error fetching hotel stats', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch hotel stats');
    }
}

/**
 * GET /api/hotels/:id
 * Get hotel by ID with statistics
 */
export async function getHotelById(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (!id) {
            sendError(res, 400, 'BAD_REQUEST', 'Hotel ID is required');
            return;
        }

        // RBAC: Non-super admins can only view their hotel
        if (user.role !== 'SUPER_ADMIN' && user.hotelId !== id) {
            sendError(res, 403, 'FORBIDDEN', 'Cannot view other hotels');
            return;
        }

        const hotel = await hotelService.getHotelById(id);

        if (!hotel) {
            sendError(res, 404, 'NOT_FOUND', 'Hotel not found');
            return;
        }

        sendSuccess(res, 200, { hotel });
    } catch (error) {
        log.error('Error fetching hotel', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch hotel');
    }
}

/**
 * POST /api/hotels
 * Create new hotel
 * RBAC: SUPER_ADMIN only
 */
export async function createHotel(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role !== 'SUPER_ADMIN') {
            sendError(res, 403, 'FORBIDDEN', 'Only Super Admins can create hotels');
            return;
        }

        const validation = createHotelSchema.safeParse(req.body);
        if (!validation.success) {
            sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid data');
            return;
        }

        const hotel = await hotelService.createHotel(validation.data);

        log.info('Hotel created', { userId: user.userId, hotelId: hotel.id });

        sendSuccess(res, 201, { hotel }, 'Hotel created successfully');
    } catch (error) {
        log.error('Error creating hotel', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create hotel');
    }
}

/**
 * PATCH /api/hotels/:id
 * Update hotel
 * RBAC: SUPER_ADMIN only
 */
export async function updateHotel(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role !== 'SUPER_ADMIN') {
            sendError(res, 403, 'FORBIDDEN', 'Only Super Admins can update hotels');
            return;
        }

        if (!id) {
            sendError(res, 400, 'BAD_REQUEST', 'Hotel ID is required');
            return;
        }

        const validation = updateHotelSchema.safeParse(req.body);
        if (!validation.success) {
            sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid data');
            return;
        }

        try {
            const hotel = await hotelService.updateHotel(id, validation.data);
            log.info('Hotel updated', { userId: user.userId, hotelId: id });
            sendSuccess(res, 200, { hotel }, 'Hotel updated successfully');
        } catch (error) {
            if ((error as Error).message.includes('not found')) {
                sendError(res, 404, 'NOT_FOUND', 'Hotel not found');
                return;
            }
            throw error;
        }
    } catch (error) {
        log.error('Error updating hotel', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update hotel');
    }
}

/**
 * DELETE /api/hotels/:id
 * Delete hotel (WARNING: Cascades to all related data!)
 * RBAC: SUPER_ADMIN only
 */
export async function deleteHotel(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role !== 'SUPER_ADMIN') {
            sendError(res, 403, 'FORBIDDEN', 'Only Super Admins can delete hotels');
            return;
        }

        if (!id) {
            sendError(res, 400, 'BAD_REQUEST', 'Hotel ID is required');
            return;
        }

        try {
            await hotelService.deleteHotel(id);
            log.info('Hotel deleted', { userId: user.userId, hotelId: id });
            sendSuccess(res, 200, null, 'Hotel deleted successfully');
        } catch (error) {
            if ((error as Error).message.includes('not found')) {
                sendError(res, 404, 'NOT_FOUND', 'Hotel not found');
                return;
            }
            throw error;
        }
    } catch (error) {
        log.error('Error deleting hotel', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete hotel');
    }
}
