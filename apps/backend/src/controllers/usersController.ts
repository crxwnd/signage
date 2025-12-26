/**
 * Users Controller
 * Request handlers for user management
 * Implements RBAC:
 * - SUPER_ADMIN: Full access to all users
 * - HOTEL_ADMIN: Access to users in their hotel
 * - AREA_MANAGER: No access (403)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { BCRYPT_ROUNDS } from '../config/auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(100),
    role: z.enum(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']),
    hotelId: z.string().min(1).optional().nullable(),
    areaId: z.string().min(1).optional().nullable(),
});

const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    role: z.enum(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']).optional(),
    hotelId: z.string().min(1).optional().nullable(),
    areaId: z.string().min(1).optional().nullable(),
    password: z.string().min(8).optional(),
    twoFactorEnabled: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sendError(res: Response, status: number, code: string, message: string) {
    const errorResponse: ApiErrorResponse = {
        success: false,
        error: { code, message },
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

// =============================================================================
// CONTROLLERS
// =============================================================================

/**
 * GET /api/users
 * Get all users with RBAC filtering
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        // AREA_MANAGER cannot access user management
        if (user.role === 'AREA_MANAGER') {
            sendError(res, 403, 'FORBIDDEN', 'Area managers cannot access user management');
            return;
        }

        // Build where clause based on role
        let whereClause: { hotelId?: string } = {};

        if (user.role === 'HOTEL_ADMIN') {
            if (!user.hotelId) {
                sendError(res, 403, 'FORBIDDEN', 'Hotel admin must have a hotel assigned');
                return;
            }
            // HOTEL_ADMIN can only see users from their hotel
            whereClause = { hotelId: user.hotelId };
        }
        // SUPER_ADMIN sees all users (no filter)

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                hotelId: true,
                areaId: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                hotel: {
                    select: { id: true, name: true },
                },
                area: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        log.info('Users fetched', {
            userId: user.userId,
            role: user.role,
            count: users.length
        });

        sendSuccess(res, 200, { users });
    } catch (error) {
        log.error('Error fetching users', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch users');
    }
}

/**
 * GET /api/users/:id
 * Get user by ID
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role === 'AREA_MANAGER') {
            sendError(res, 403, 'FORBIDDEN', 'Area managers cannot access user management');
            return;
        }

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                hotelId: true,
                areaId: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                hotel: {
                    select: { id: true, name: true },
                },
                area: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!targetUser) {
            sendError(res, 404, 'NOT_FOUND', 'User not found');
            return;
        }

        // HOTEL_ADMIN can only see users from their hotel
        if (user.role === 'HOTEL_ADMIN') {
            if (targetUser.hotelId !== user.hotelId) {
                sendError(res, 403, 'FORBIDDEN', 'Cannot access users from other hotels');
                return;
            }
        }

        sendSuccess(res, 200, { user: targetUser });
    } catch (error) {
        log.error('Error fetching user', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch user');
    }
}

/**
 * POST /api/users
 * Create new user
 */
export async function createUser(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role === 'AREA_MANAGER') {
            sendError(res, 403, 'FORBIDDEN', 'Area managers cannot create users');
            return;
        }

        // Validate request body
        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid data');
            return;
        }

        const { email, password, name, role, hotelId, areaId } = validation.data;

        // HOTEL_ADMIN cannot create SUPER_ADMIN
        if (user.role === 'HOTEL_ADMIN' && role === 'SUPER_ADMIN') {
            sendError(res, 403, 'FORBIDDEN', 'Hotel admins cannot create super admins');
            return;
        }

        // HOTEL_ADMIN can only create users for their hotel
        if (user.role === 'HOTEL_ADMIN') {
            if (hotelId && hotelId !== user.hotelId) {
                sendError(res, 403, 'FORBIDDEN', 'Hotel admins can only create users for their hotel');
                return;
            }
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            sendError(res, 409, 'EMAIL_EXISTS', 'A user with this email already exists');
            return;
        }

        // Validate hotelId exists if provided
        if (hotelId) {
            const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
            if (!hotel) {
                sendError(res, 400, 'INVALID_HOTEL', 'Hotel not found');
                return;
            }
        }

        // Validate areaId exists if provided
        if (areaId) {
            const area = await prisma.area.findUnique({ where: { id: areaId } });
            if (!area) {
                sendError(res, 400, 'INVALID_AREA', 'Area not found');
                return;
            }
            // Area must belong to the specified hotel
            if (hotelId && area.hotelId !== hotelId) {
                sendError(res, 400, 'INVALID_AREA', 'Area does not belong to the specified hotel');
                return;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                hotelId: role === 'SUPER_ADMIN' ? null : (hotelId || user.hotelId),
                areaId: role === 'AREA_MANAGER' ? areaId : null,
                twoFactorEnabled: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                hotelId: true,
                areaId: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                hotel: {
                    select: { id: true, name: true },
                },
                area: {
                    select: { id: true, name: true },
                },
            },
        });

        log.info('User created', {
            createdBy: user.userId,
            newUserId: newUser.id,
            role: newUser.role
        });

        sendSuccess(res, 201, { user: newUser }, 'User created successfully');
    } catch (error) {
        log.error('Error creating user', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create user');
    }
}

/**
 * PATCH /api/users/:id
 * Update user
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role === 'AREA_MANAGER') {
            sendError(res, 403, 'FORBIDDEN', 'Area managers cannot update users');
            return;
        }

        // Validate request body
        const validation = updateUserSchema.safeParse(req.body);
        if (!validation.success) {
            sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid data');
            return;
        }

        const updates = validation.data;

        // Find target user
        const targetUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!targetUser) {
            sendError(res, 404, 'NOT_FOUND', 'User not found');
            return;
        }

        // HOTEL_ADMIN can only update users from their hotel
        if (user.role === 'HOTEL_ADMIN') {
            if (targetUser.hotelId !== user.hotelId) {
                sendError(res, 403, 'FORBIDDEN', 'Cannot update users from other hotels');
                return;
            }
            // HOTEL_ADMIN cannot promote to SUPER_ADMIN
            if (updates.role === 'SUPER_ADMIN') {
                sendError(res, 403, 'FORBIDDEN', 'Hotel admins cannot create super admins');
                return;
            }
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (updates.name) updateData.name = updates.name;
        if (updates.role) updateData.role = updates.role;
        if (updates.hotelId !== undefined) updateData.hotelId = updates.hotelId;
        if (updates.areaId !== undefined) updateData.areaId = updates.areaId;
        if (updates.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = updates.twoFactorEnabled;

        // Hash password if provided
        if (updates.password) {
            updateData.password = await bcrypt.hash(updates.password, BCRYPT_ROUNDS);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                hotelId: true,
                areaId: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                hotel: {
                    select: { id: true, name: true },
                },
                area: {
                    select: { id: true, name: true },
                },
            },
        });

        log.info('User updated', {
            updatedBy: user.userId,
            targetUserId: id
        });

        sendSuccess(res, 200, { user: updatedUser }, 'User updated successfully');
    } catch (error) {
        log.error('Error updating user', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update user');
    }
}

/**
 * DELETE /api/users/:id
 * Delete user
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!user) {
            sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
            return;
        }

        if (user.role === 'AREA_MANAGER') {
            sendError(res, 403, 'FORBIDDEN', 'Area managers cannot delete users');
            return;
        }

        // Cannot delete yourself
        if (user.userId === id) {
            sendError(res, 400, 'INVALID_OPERATION', 'Cannot delete your own account');
            return;
        }

        // Find target user
        const targetUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!targetUser) {
            sendError(res, 404, 'NOT_FOUND', 'User not found');
            return;
        }

        // HOTEL_ADMIN can only delete users from their hotel
        if (user.role === 'HOTEL_ADMIN') {
            if (targetUser.hotelId !== user.hotelId) {
                sendError(res, 403, 'FORBIDDEN', 'Cannot delete users from other hotels');
                return;
            }
            // HOTEL_ADMIN cannot delete SUPER_ADMIN
            if (targetUser.role === 'SUPER_ADMIN') {
                sendError(res, 403, 'FORBIDDEN', 'Hotel admins cannot delete super admins');
                return;
            }
        }

        await prisma.user.delete({
            where: { id },
        });

        log.info('User deleted', {
            deletedBy: user.userId,
            deletedUserId: id
        });

        sendSuccess(res, 200, { id }, 'User deleted successfully');
    } catch (error) {
        log.error('Error deleting user', { error });
        sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete user');
    }
}
