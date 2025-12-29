/**
 * Authentication Middleware
 * Middleware for protecting routes and checking user permissions
 */

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken, type DecodedToken } from '../services/authService';
import { log } from './logger';
import type { ApiErrorResponse } from '@shared-types';

/**
 * Extend Express Request to include user data
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Authenticate middleware
 * Verifies JWT token from Authorization header and attaches user to request
 *
 * @example
 * router.get('/protected', authenticate, (req, res) => {
 *   console.log(req.user); // { userId, email, role, hotelId }
 * });
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must start with "Bearer "',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token found in authorization header',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: error instanceof Error ? error.message : 'Invalid token',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Attach user to request
    req.user = decoded;

    log.debug('User authenticated', {
      userId: decoded.userId,
      role: decoded.role,
    });

    next();
  } catch (error) {
    log.error('Authentication middleware error', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Require role middleware factory
 * Creates middleware that checks if user has one of the required roles
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 *
 * @example
 * // Only SUPER_ADMIN can access
 * router.delete('/users/:id', authenticate, requireRole(['SUPER_ADMIN']), deleteUser);
 *
 * @example
 * // SUPER_ADMIN and HOTEL_ADMIN can access
 * router.post('/hotels', authenticate, requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), createHotel);
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
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

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        log.warn('User does not have required role', {
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        });

        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
            details: {
              required: allowedRoles,
              current: req.user.role,
            },
          },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
      }

      log.debug('User role authorized', {
        userId: req.user.userId,
        role: req.user.role,
      });

      next();
    } catch (error) {
      log.error('Role authorization middleware error', error);

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'An error occurred during authorization',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
    }
  };
}

/**
 * Require same hotel middleware
 * Ensures user can only access resources from their own hotel
 * SUPER_ADMIN can access all hotels
 *
 * @param getHotelIdFromRequest - Function to extract hotelId from request
 * @returns Express middleware function
 *
 * @example
 * router.get('/displays/:id',
 *   authenticate,
 *   requireSameHotel((req) => req.params.hotelId),
 *   getDisplay
 * );
 */
export function requireSameHotel(
  getHotelIdFromRequest: (req: Request) => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
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

      // SUPER_ADMIN can access all hotels
      if (req.user.role === UserRole.SUPER_ADMIN) {
        next();
        return;
      }

      // Get hotel ID from request
      const requestedHotelId = getHotelIdFromRequest(req);

      if (!requestedHotelId) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'HOTEL_ID_REQUIRED',
            message: 'Hotel ID is required',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Check if user belongs to the same hotel
      if (req.user.hotelId !== requestedHotelId) {
        log.warn('User attempted to access different hotel resources', {
          userId: req.user.userId,
          userHotelId: req.user.hotelId,
          requestedHotelId,
        });

        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access resources from your own hotel',
          },
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(errorResponse);
        return;
      }

      next();
    } catch (error) {
      log.error('Hotel authorization middleware error', error);

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'An error occurred during hotel authorization',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
    }
  };
}
