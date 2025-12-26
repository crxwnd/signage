/**
 * Hotels Controller
 * Request handlers for hotel listing
 */

import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

function sendError(res: Response, status: number, code: string, message: string) {
    const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code, message },
        timestamp: new Date().toISOString(),
    };
    res.status(status).json(errorResponse);
}

function sendSuccess<T>(res: Response, status: number, data: T) {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
}

/**
 * GET /api/hotels
 * Get all hotels (for dropdowns)
 */
export async function getHotels(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        // Build where clause based on role
        let whereClause: { id?: string } = {};

        if (user.role === 'HOTEL_ADMIN' || user.role === 'AREA_MANAGER') {
            // Non-super admins can only see their own hotel
            if (user.hotelId) {
                whereClause = { id: user.hotelId };
            }
        }
        // SUPER_ADMIN sees all hotels (no filter)

        const hotels = await prisma.hotel.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                address: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        log.info('Hotels fetched', {
            userId: user.userId,
            role: user.role,
            count: hotels.length
        });

        sendSuccess(res, 200, { hotels });
    } catch (error) {
        log.error('Error fetching hotels', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch hotels');
    }
}
