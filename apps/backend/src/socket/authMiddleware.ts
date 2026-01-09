/**
 * Socket.io Authentication Middleware
 * Validates JWT token on WebSocket connections
 */

import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    hotelId?: string;
}

/**
 * Socket.io authentication middleware
 * Validates JWT token on connection
 */
export const socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: ExtendedError) => void
): Promise<void> => {
    try {
        const token = socket.handshake.auth?.token;

        // If no token, check if it's a player connection (uses pairing auth)
        if (!token) {
            const isPlayer = socket.handshake.query?.type === 'player';
            if (isPlayer) {
                socket.data.isPlayer = true;
                socket.data.authenticated = false;
                log.debug(`[Socket Auth] Player connection without JWT (uses pairing): ${socket.id}`);
                return next();
            }

            // For admin/frontend connections without token, still allow but mark as unauthenticated
            // The client will provide token after initial connection in some cases
            socket.data.authenticated = false;
            log.debug(`[Socket Auth] Anonymous connection: ${socket.id}`);
            return next();
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;

        // Verify that the user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, hotelId: true },
        });

        if (!user) {
            log.warn(`[Socket Auth] User not found: ${decoded.userId}`);
            socket.data.authenticated = false;
            return next();
        }

        // Attach user data to socket
        socket.data.userId = user.id;
        socket.data.email = user.email;
        socket.data.role = user.role;
        socket.data.hotelId = user.hotelId;
        socket.data.authenticated = true;

        log.info(`[Socket Auth] Authenticated: ${socket.id}`, {
            userId: user.id,
            role: user.role,
        });

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            log.debug(`[Socket Auth] Token expired for socket: ${socket.id}`);
            socket.data.authenticated = false;
            // Don't reject - allow connection but mark as unauthenticated
            return next();
        }
        if (error instanceof jwt.JsonWebTokenError) {
            log.debug(`[Socket Auth] Invalid token for socket: ${socket.id}`);
            socket.data.authenticated = false;
            return next();
        }
        log.error('[Socket Auth] Error:', error);
        socket.data.authenticated = false;
        next();
    }
};

/**
 * Helper to check if socket is authenticated
 */
export const isAuthenticated = (socket: Socket): boolean => {
    return socket.data.authenticated === true;
};

/**
 * Helper to check if socket has required role
 */
export const hasRole = (socket: Socket, allowedRoles: string[]): boolean => {
    if (!socket.data.authenticated) return false;
    return allowedRoles.includes(socket.data.role);
};

/**
 * Helper to check if socket belongs to a specific hotel
 */
export const belongsToHotel = (socket: Socket, hotelId: string): boolean => {
    if (!socket.data.authenticated) return false;
    // SUPER_ADMIN can access all hotels
    if (socket.data.role === 'SUPER_ADMIN') return true;
    return socket.data.hotelId === hotelId;
};
