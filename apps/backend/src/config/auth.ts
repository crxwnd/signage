/**
 * Authentication Configuration
 * JWT and security settings
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * JWT Secret Keys
 * CRITICAL: These must be set in environment variables in production
 */
function getRequiredSecret(name: string, devDefault: string): string {
  const value = process.env[name];
  if (isProduction && !value) {
    throw new Error(`SECURITY ERROR: ${name} environment variable must be set in production`);
  }
  return value || devDefault;
}

export const JWT_SECRET = getRequiredSecret('JWT_SECRET', 'dev-jwt-secret-CHANGE-IN-PRODUCTION');
export const JWT_REFRESH_SECRET = getRequiredSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-CHANGE-IN-PRODUCTION');

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
 * Using 'lax' for sameSite to allow cookies in development across redirects
 */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true, // Prevent XSS attacks
  secure: isProduction, // HTTPS only in production
  sameSite: 'lax' as const, // 'lax' for dev compatibility, strict causes issues
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/', // Allow cookie on all routes
};

/**
 * Rate Limiting Configuration for Auth Endpoints
 * More lenient limits to prevent accidental lockouts during development
 */
export const AUTH_RATE_LIMIT = {
  windowMs: isProduction ? 5 * 60 * 1000 : 60 * 1000, // 5 min prod, 1 min dev
  max: isProduction ? 30 : 1000, // 30 req/5min prod, 1000 req/min dev
  message: 'Too many authentication attempts, please try again later',
};
