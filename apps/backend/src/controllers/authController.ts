/**
 * Authentication Controller
 * HTTP request handlers for authentication endpoints
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { log } from '../middleware/logger';
import { prisma } from '../utils/prisma';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type JWTPayload,
} from '../services/authService';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '../config/auth';

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

/**
 * Register user schema
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']).optional(),
  hotelId: z.string().cuid().optional(),
});

/**
 * Login schema
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ==============================================
// CONTROLLER HANDLERS
// ==============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(errorResponse);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'AREA_MANAGER',
        hotelId: data.hotelId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    log.info('User registered successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        user,
        accessToken,
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    log.error('Failed to register user', error);

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
        message: 'An unexpected error occurred during registration',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        hotelId: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    log.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to login', error);

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
        message: 'An unexpected error occurred during login',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verify refresh token
    let decoded: JWTPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: error instanceof Error ? error.message : 'Invalid refresh token',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    log.info('Access token refreshed', { userId: user.id });

    // Generate new access token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId || undefined,
    };

    const accessToken = generateAccessToken(payload);

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        accessToken,
        user,
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to refresh token', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while refreshing token',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/auth/logout
 * Logout user by clearing refresh token cookie
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    // Clear refresh token cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      maxAge: 0,
    });

    log.info('User logged out successfully');

    const response: ApiSuccessResponse = {
      success: true,
      data: null,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to logout', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during logout',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires authentication middleware
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    // User is attached to req by authenticate middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: { user },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to get current user', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}
