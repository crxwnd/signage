/**
 * Authentication Configuration
 * JWT and security settings
 */

/**
 * JWT Secret Keys
 * CRITICAL: These must be set in environment variables in production
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-CHANGE-IN-PRODUCTION';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-CHANGE-IN-PRODUCTION';

/**
 * JWT Token Expiration Times
 */
export const JWT_ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const JWT_REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Bcrypt Configuration
 */
export const BCRYPT_ROUNDS = 12; // Number of salt rounds for password hashing

/**
 * 2FA Configuration
 */
export const TOTP_WINDOW = 1; // Number of time steps to check before and after current time
export const TOTP_STEP = 30; // Time step in seconds (30s is standard for TOTP)

/**
 * Cookie Configuration for Refresh Token
 */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true, // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/api/auth', // Only send cookie on auth routes
};

/**
 * Rate Limiting Configuration for Auth Endpoints
 */
export const AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
};
