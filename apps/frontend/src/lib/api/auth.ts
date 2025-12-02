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
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse;
    throw new ApiError(
      errorResponse.error.message,
      errorResponse.error.code,
      errorResponse.error.details
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

/**
 * Login request payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
}

/**
 * Register request payload
 */
export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  hotelId?: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: User;
  accessToken: string;
}

/**
 * In-memory access token storage
 * NOTE: This is intentionally not in localStorage for security
 */
let accessToken: string | null = null;

/**
 * Get current access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Set access token in memory
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Clear access token from memory
 */
export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies (refresh token)
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<LoginResponse>(response);

  // Store access token in memory
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Register new user
 * POST /api/auth/register
 */
export async function register(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies (refresh token)
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<RegisterResponse>(response);

  // Store access token in memory
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });
  } finally {
    // Always clear token even if request fails
    clearAccessToken();
  }
}

/**
 * Refresh access token using refresh token from cookie
 * POST /api/auth/refresh
 */
export async function refreshToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies (refresh token)
  });

  const data = await handleResponse<{ accessToken: string }>(response);

  // Update access token in memory
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data.accessToken;
}

/**
 * Get current user information
 * GET /api/auth/me
 * Requires authentication
 */
export async function getMe(): Promise<User> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError('No access token available', 'UNAUTHORIZED');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  const data = await handleResponse<{ user: User }>(response);
  return data.user;
}

/**
 * Helper to make authenticated API requests
 * Automatically includes Authorization header with access token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  if (!token) {
    throw new ApiError('No access token available', 'UNAUTHORIZED');
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
