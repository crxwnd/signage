/**
 * User Model Types
 * Synced with Prisma schema: apps/backend/prisma/schema.prisma
 * NOTE: Password field is intentionally omitted for security
 */

/**
 * User role enum
 * Defines the hierarchy: SUPER_ADMIN → HOTEL_ADMIN → AREA_MANAGER
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOTEL_ADMIN = 'HOTEL_ADMIN',
  AREA_MANAGER = 'AREA_MANAGER',
}

/**
 * User interface (without password)
 * Safe for frontend consumption
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  hotelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User with hotel relation
 */
export interface UserWithHotel extends User {
  hotel?: {
    id: string;
    name: string;
    address: string;
  } | null;
}

/**
 * User creation payload
 */
export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  hotelId?: string | null;
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  email?: string;
  name?: string;
  role?: UserRole;
  hotelId?: string | null;
}

/**
 * User filter for querying
 */
export interface UserFilter {
  role?: UserRole;
  hotelId?: string;
  search?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor: boolean;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Setup 2FA response
 */
export interface Setup2FAResponse {
  secret: string;
  qrCode: string; // Data URL for QR code image
}

/**
 * Verify 2FA request
 */
export interface Verify2FARequest {
  code: string;
}

/**
 * Disable 2FA request
 */
export interface Disable2FARequest {
  password: string;
  code: string;
}

/**
 * JWT payload
 * Data encoded in access tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  hotelId: string | null;
  iat: number;
  exp: number;
}

/**
 * Authentication context
 * Available in authenticated requests
 */
export interface AuthContext {
  user: User;
  token: string;
}
