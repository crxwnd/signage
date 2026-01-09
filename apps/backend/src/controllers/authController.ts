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
  generateTOTPSecret,
  generateTOTPUrl,
  generateQRCode,
  verifyTOTPToken,
  type JWTPayload,
} from '../services/authService';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '../config/auth';
import * as userAnalyticsService from '../services/userAnalyticsService';

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
        areaId: true,
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
      areaId: user.areaId || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie with DEV-FRIENDLY options
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
 * If 2FA is enabled, returns requiresTwoFactor flag instead of tokens
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
        areaId: true,
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
      // Log failed login attempt
      await userAnalyticsService.logActivity({
        userId: user.id,
        action: userAnalyticsService.ActivityActions.LOGIN_FAILED,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        details: { reason: 'Invalid password' },
      }).catch(() => { }); // Don't fail login on logging error

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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      log.info('User requires 2FA', { userId: user.id, email: user.email });

      const response: ApiSuccessResponse = {
        success: true,
        data: {
          requiresTwoFactor: true,
          email: user.email,
        },
        message: '2FA verification required',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
      return;
    }

    log.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId || undefined,
      areaId: user.areaId || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie with DEV-FRIENDLY options
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

    // Log successful login
    await userAnalyticsService.logActivity({
      userId: user.id,
      action: userAnalyticsService.ActivityActions.LOGIN,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.get('user-agent'),
    }).catch(() => { }); // Don't fail login on logging error

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
      // Clear cookie just in case it exists but is empty/invalid
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge: 0,
      });

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
      // Clear invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge: 0,
      });

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
        areaId: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      // Clear cookie for non-existent user
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge: 0,
      });

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

    // Opcional: Rotar refresh token (generar uno nuevo)
    // Por simplicidad y evitar problemas de concurrencia, podemos mantener el mismo hasta que expire
    // O renovarlo aquí:
    // const newRefreshToken = generateRefreshToken(payload);
    // res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

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
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Log logout activity if we have user info from token
    const userId = (req as any).user?.userId;
    if (userId) {
      await userAnalyticsService.logActivity({
        userId,
        action: userAnalyticsService.ActivityActions.LOGOUT,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
      }).catch(() => { }); // Don't fail logout on logging error
    }

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
        areaId: true,
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

// ==============================================
// 2FA ENDPOINTS
// ==============================================

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA for authenticated user
 * Generates TOTP secret and returns QR code
 * Requires authentication middleware
 */
export async function setup2FA(req: Request, res: Response): Promise<void> {
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
      res.status(404).json(errorResponse);
      return;
    }

    if (user.twoFactorEnabled) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_ALREADY_ENABLED',
          message: '2FA is already enabled for this user',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret();

    // Generate otpauth URL
    const otpauthUrl = generateTOTPUrl(secret, user.email);

    // Generate QR code data URL
    const qrCodeDataUrl = await generateQRCode(otpauthUrl);

    // Store secret in database (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
      },
    });

    log.info('2FA setup initiated', { userId: user.id, email: user.email });

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataUrl,
        otpauthUrl,
      },
      message: '2FA setup initiated. Scan QR code with your authenticator app',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to setup 2FA', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during 2FA setup',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Validation schema for 2FA verify
 */
const verify2FASchema = z.object({
  token: z.string().length(6, 'TOTP token must be 6 digits'),
});

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code and enable 2FA
 * Requires authentication middleware
 */
export async function verify2FA(req: Request, res: Response): Promise<void> {
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

    // Validate request body
    const data = verify2FASchema.parse(req.body);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
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

    if (user.twoFactorEnabled) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_ALREADY_ENABLED',
          message: '2FA is already enabled for this user',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!user.twoFactorSecret) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_NOT_SETUP',
          message: '2FA setup not initiated. Call /2fa/setup first',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(data.token, user.twoFactorSecret);

    if (!isValid) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_2FA_TOKEN',
          message: 'Invalid TOTP token',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    log.info('2FA enabled successfully', { userId: user.id, email: user.email });

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        twoFactorEnabled: true,
      },
      message: '2FA enabled successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to verify 2FA', error);

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
        message: 'An unexpected error occurred during 2FA verification',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Validation schema for 2FA disable
 */
const disable2FASchema = z.object({
  token: z.string().length(6, 'TOTP token must be 6 digits'),
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for authenticated user
 * Requires valid TOTP token
 * Requires authentication middleware
 */
export async function disable2FA(req: Request, res: Response): Promise<void> {
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

    // Validate request body
    const data = disable2FASchema.parse(req.body);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
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

    if (!user.twoFactorEnabled) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_NOT_ENABLED',
          message: '2FA is not enabled for this user',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!user.twoFactorSecret) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_SECRET_NOT_FOUND',
          message: '2FA secret not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
      return;
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(data.token, user.twoFactorSecret);

    if (!isValid) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_2FA_TOKEN',
          message: 'Invalid TOTP token',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Disable 2FA and clear secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    log.info('2FA disabled successfully', { userId: user.id, email: user.email });

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        twoFactorEnabled: false,
      },
      message: '2FA disabled successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to disable 2FA', error);

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
        message: 'An unexpected error occurred while disabling 2FA',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Validation schema for 2FA login
 */
const login2FASchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  token: z.string().length(6, 'TOTP token must be 6 digits'),
});

/**
 * POST /api/auth/login/2fa
 * Complete 2FA login with TOTP token
 * Verifies credentials and TOTP token, then returns auth tokens
 */
export async function login2FA(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const data = login2FASchema.parse(req.body);

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
        areaId: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
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

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_NOT_ENABLED',
          message: '2FA is not enabled for this user. Use /login instead',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!user.twoFactorSecret) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: '2FA_SECRET_NOT_FOUND',
          message: '2FA secret not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
      return;
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(data.token, user.twoFactorSecret);

    if (!isValid) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_2FA_TOKEN',
          message: 'Invalid TOTP token',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(errorResponse);
      return;
    }

    log.info('User logged in successfully with 2FA', { userId: user.id, email: user.email });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId || undefined,
      areaId: user.areaId || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie with DEV-FRIENDLY options
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    // Remove password and secret from response
    const { password: _, twoFactorSecret: __, ...userWithoutSensitiveData } = user;

    const response: ApiSuccessResponse = {
      success: true,
      data: {
        user: userWithoutSensitiveData,
        accessToken,
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Failed to login with 2FA', error);

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
        message: 'An unexpected error occurred during 2FA login',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(errorResponse);
  }
}