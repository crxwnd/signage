/**
 * Auth API Client
 * Functions to interact with authentication endpoints
 */

import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 * ROBUST VERSION: Handles non-JSON responses (like 429 or 500) without crashing
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let data;

  // Intentar parsear como JSON solo si el header lo indica
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Si no es JSON (ej: Rate Limit 429, Error 500 HTML), leemos como texto
    const text = await response.text();
    // Simulamos estructura de error para que el resto del código lo entienda
    data = {
      success: false,
      error: {
        code: `HTTP_${response.status}`,
        message: text || response.statusText || 'Unknown Error',
      },
    };
  }

  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse;
    throw new ApiError(
      errorResponse.error?.message || 'API Error',
      errorResponse.error?.code || 'UNKNOWN',
      errorResponse.error?.details
    );
  }

  const successResponse = data as ApiSuccessResponse<T>;
  return successResponse.data;
}

/**
 * User type from backend
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';
  hotelId: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  hotelId?: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
}

/**
 * In-memory access token storage
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Login user
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<LoginResponse>(response);

  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Register new user
 */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<RegisterResponse>(response);

  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } finally {
    clearAccessToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

// ==========================================
// 🚦 SEMÁFORO DE REFRESCO (Singleton)
// ==========================================
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 5000; // 5 seconds between refresh attempts

/**
 * Refresh access token
 * Returns null if refresh fails (instead of throwing)
 * Implements single-flight pattern to avoid race conditions
 * 
 * IMPORTANT: If a refresh is in progress, callers will wait for it.
 * If cooldown is active, returns existing token (does NOT redirect).
 */
export async function refreshToken(): Promise<string | null> {
  // If already refreshing, wait for the existing promise
  // This is the key fix: don't return null, wait for the result
  if (isRefreshing && refreshPromise) {
    console.log('[Auth] Refresh in progress, waiting...');
    return refreshPromise;
  }

  // Cooldown: prevent rapid-fire refresh attempts
  const now = Date.now();
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
    // During cooldown, return existing token if we have one
    // Don't return null - that causes redirect loop
    const existingToken = getAccessToken();
    if (existingToken) {
      console.log('[Auth] Cooldown active, using existing token');
      return existingToken;
    }
    console.log('[Auth] Cooldown active, no existing token');
    // No token during cooldown - still don't return null immediately
    // Wait a bit and try again (or return null if truly no session)
    return null;
  }

  lastRefreshAttempt = now;
  isRefreshing = true;

  refreshPromise = (async (): Promise<string | null> => {
    try {
      console.log('[Auth] Refreshing token...');
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      // Handle rate limiting gracefully - but don't clear token
      if (response.status === 429) {
        console.warn('[Auth] Rate limited on refresh, keeping existing token');
        return getAccessToken(); // Return existing token, don't fail
      }

      // Handle other errors
      if (!response.ok) {
        console.warn('[Auth] Refresh failed with status:', response.status);
        clearAccessToken();
        return null;
      }

      const data = await response.json();
      const token = data?.data?.accessToken;

      if (token) {
        console.log('[Auth] Token refreshed successfully');
        setAccessToken(token);
        return token;
      }

      console.warn('[Auth] No access token in refresh response');
      return null;
    } catch (error) {
      console.warn('[Auth] Refresh token error:', error);
      clearAccessToken();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Get current user
 */
export async function getMe(): Promise<User> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await handleResponse<{ user: User }>(response);
  return data.user;
}

/**
 * Helper to make authenticated API requests
 * Automatically includes Authorization header
 * Redirects to login if no valid token is available
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  // If no token, try to refresh ONCE
  if (!token) {
    console.log('[Auth] Token missing, attempting refresh...');
    token = await refreshToken();
  }

  // If still no token after refresh attempt, redirect to login
  if (!token) {
    console.warn('[Auth] No valid session, redirecting to login...');
    // Only redirect if in browser and not already on login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired, please login again', 'SESSION_EXPIRED');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });
}

// ==============================================
// 2FA Functions
// ==============================================

export interface Setup2FAResponse {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

/**
 * Setup 2FA for current user
 * Returns QR code and secret for authenticator app
 */
export async function setup2FA(): Promise<Setup2FAResponse> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/2fa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.message || 'Failed to setup 2FA',
      data.error?.code || 'SETUP_2FA_ERROR'
    );
  }

  return data.data;
}

/**
 * Verify 2FA token and enable 2FA
 */
export async function verify2FA(token: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.message || 'Invalid verification code',
      data.error?.code || 'VERIFY_2FA_ERROR'
    );
  }
}

/**
 * Disable 2FA for current user
 * Requires valid TOTP token
 */
export async function disable2FA(token: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/auth/2fa/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.message || 'Failed to disable 2FA',
      data.error?.code || 'DISABLE_2FA_ERROR'
    );
  }
}