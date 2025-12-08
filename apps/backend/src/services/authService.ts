/**
 * Authentication Service
 * Handles password hashing, JWT generation/verification, and 2FA
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { UserRole } from '@prisma/client';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_REFRESH_TOKEN_EXPIRY,
  BCRYPT_ROUNDS,
  TOTP_WINDOW,
} from '../config/auth';

/**
 * Simple logger utility
 * TODO: Replace with Winston logger when implemented
 */
const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * JWT Payload for access and refresh tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  hotelId?: string;
  areaId?: string; // For AREA_MANAGER role - restricts access to specific area
}

/**
 * Decoded JWT token
 */
export interface DecodedToken extends JWTPayload {
  iat: number; // Issued at
  exp: number; // Expiration time
}

// =============================================================================
// PASSWORD HASHING
// =============================================================================

/**
 * Hash a plain text password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 *
 * @example
 * const hashedPassword = await hashPassword('mySecurePassword123');
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a bcrypt hash
 *
 * @param password - Plain text password to check
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 *
 * @example
 * const isValid = await comparePassword('myPassword', hashedPassword);
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    logger.debug('Password comparison completed', { isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Failed to compare password', { error });
    throw new Error('Failed to compare password');
  }
}

// =============================================================================
// JWT TOKEN GENERATION
// =============================================================================

/**
 * Generate a JWT access token (short-lived)
 *
 * @param payload - User data to encode in token
 * @returns JWT access token string
 *
 * @example
 * const token = generateAccessToken({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   role: UserRole.HOTEL_ADMIN,
 *   hotelId: 'hotel456'
 * });
 */
export function generateAccessToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
      issuer: 'signage-api',
      audience: 'signage-client',
    });

    logger.debug('Access token generated', {
      userId: payload.userId,
      expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
    });

    return token;
  } catch (error) {
    logger.error('Failed to generate access token', { error });
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate a JWT refresh token (long-lived)
 *
 * @param payload - User data to encode in token
 * @returns JWT refresh token string
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   role: UserRole.HOTEL_ADMIN
 * });
 */
export function generateRefreshToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
      issuer: 'signage-api',
      audience: 'signage-client',
    });

    logger.debug('Refresh token generated', {
      userId: payload.userId,
      expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
    });

    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', { error });
    throw new Error('Failed to generate refresh token');
  }
}

// =============================================================================
// JWT TOKEN VERIFICATION
// =============================================================================

/**
 * Verify and decode a JWT access token
 *
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const decoded = verifyAccessToken(token);
 *   console.log('User ID:', decoded.userId);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'signage-api',
      audience: 'signage-client',
    }) as DecodedToken;

    logger.debug('Access token verified', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Access token expired', { error });
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid access token', { error });
      throw new Error('Invalid token');
    } else {
      logger.error('Failed to verify access token', { error });
      throw new Error('Failed to verify token');
    }
  }
}

/**
 * Verify and decode a JWT refresh token
 *
 * @param token - JWT refresh token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const decoded = verifyRefreshToken(refreshToken);
 *   // Generate new access token
 * } catch (error) {
 *   console.error('Invalid refresh token');
 * }
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'signage-api',
      audience: 'signage-client',
    }) as DecodedToken;

    logger.debug('Refresh token verified', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Refresh token expired', { error });
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token', { error });
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Failed to verify refresh token', { error });
      throw new Error('Failed to verify refresh token');
    }
  }
}

// =============================================================================
// 2FA (TOTP) FUNCTIONS
// =============================================================================

/**
 * Generate a new TOTP secret for 2FA setup
 *
 * @returns Base32 encoded secret string
 *
 * @example
 * const secret = generateTOTPSecret();
 * // Use this secret to generate QR code for user
 */
export function generateTOTPSecret(): string {
  const secret = authenticator.generateSecret();
  logger.debug('TOTP secret generated');
  return secret;
}

/**
 * Generate otpauth:// URL for QR code generation
 *
 * @param secret - TOTP secret (base32 encoded)
 * @param email - User's email address
 * @returns otpauth:// URL string
 *
 * @example
 * const url = generateTOTPUrl(secret, 'user@example.com');
 * // Generate QR code from this URL
 */
export function generateTOTPUrl(secret: string, email: string): string {
  const issuer = 'Signage System';
  const url = authenticator.keyuri(email, issuer, secret);
  logger.debug('TOTP URL generated', { email, issuer });
  return url;
}

/**
 * Verify a TOTP token against a secret
 *
 * @param token - 6-digit TOTP code from user
 * @param secret - User's TOTP secret (base32 encoded)
 * @returns True if token is valid, false otherwise
 *
 * @example
 * const isValid = verifyTOTPToken('123456', userSecret);
 * if (isValid) {
 *   // Allow login
 * }
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    // Configure window for time drift tolerance
    authenticator.options = {
      window: TOTP_WINDOW,
    };

    const isValid = authenticator.verify({ token, secret });
    logger.debug('TOTP token verified', { isValid });
    return isValid;
  } catch (error) {
    logger.error('Failed to verify TOTP token', { error });
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 * These codes can be used if the user loses access to their authenticator app
 *
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes (hashed)
 *
 * @example
 * const backupCodes = await generateBackupCodes(10);
 * // Store these hashed codes in database
 * // Display unhashed codes to user ONCE during setup
 */
export async function generateBackupCodes(count: number = 10): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    // Hash the code before storing
    const hashedCode = await hashPassword(code);
    codes.push(hashedCode);
  }

  logger.debug('Backup codes generated', { count });
  return codes;
}

/**
 * Generate QR code as data URL from otpauth:// URL
 *
 * @param otpauthUrl - otpauth:// URL generated from generateTOTPUrl
 * @returns Promise resolving to data URL (can be used in <img src="">)
 *
 * @example
 * const secret = generateTOTPSecret();
 * const url = generateTOTPUrl(secret, 'user@example.com');
 * const qrCodeDataUrl = await generateQRCode(url);
 * // Send qrCodeDataUrl to frontend to display QR code
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    logger.debug('QR code generated');
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('Failed to generate QR code', { error });
    throw new Error('Failed to generate QR code');
  }
}
