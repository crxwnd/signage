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
    // Forzar recarga o redirección podría hacerse aquí o en el componente
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

// ==========================================
// 🚦 SEMÁFORO DE REFRESCO (Singleton)
// ==========================================
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh access token
 * Implementa patrón Singleton para evitar condiciones de carrera (Race Conditions)
 */
export async function refreshToken(): Promise<string> {
  // Si ya hay un refresco en proceso, devolvemos esa misma promesa
  // Esto evita que 5 componentes disparen 5 peticiones simultáneas
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await handleResponse<{ accessToken: string }>(response);
      
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
      
      throw new Error('No access token returned');
    } catch (error) {
      clearAccessToken();
      throw error;
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
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  // 1. AUTO-RECUPERACIÓN SEGURA
  if (!token) {
    try {
      // Esta llamada ahora es segura y reutiliza la misma promesa si hay varias concurrentes
      token = await refreshToken(); 
    } catch (error) {
      console.warn('[Auth] Session expired or invalid, redirecting to login...');
      // Si falla el refresco, es crítico detener el ciclo.
      // Redirigir a login para romper el bucle infinito de reintentos
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         // Opcional: window.location.href = '/login';
      }
      throw new ApiError('Session expired', 'UNAUTHORIZED');
    }
  }

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