/**
 * Areas API Client
 * Functions to interact with areas endpoints
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

  const successResponse = data as ApiSuccessResponse;
  return successResponse.data as T;
}

/**
 * Get authentication token from localStorage
 * TODO: Replace with proper auth context when implemented
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// =============================================================================
// TYPES
// =============================================================================

export interface Area {
  id: string;
  name: string;
  description: string | null;
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
  };
  _count?: {
    displays: number;
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaPayload {
  name: string;
  description?: string;
  hotelId: string; // Required for SUPER_ADMIN, ignored for HOTEL_ADMIN
}

export interface UpdateAreaPayload {
  name?: string;
  description?: string;
}

export interface AreaFilter {
  hotelId?: string;
  id?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all areas (filtered by user role via RBAC)
 *
 * RBAC:
 * - SUPER_ADMIN: Returns all areas
 * - HOTEL_ADMIN: Returns areas in their hotel only
 * - AREA_MANAGER: Returns their specific area only
 *
 * @param filter - Optional filter criteria (only applies for SUPER_ADMIN)
 * @returns Array of areas
 */
export async function getAreas(filter?: AreaFilter): Promise<Area[]> {
  const params = new URLSearchParams();

  // Add filter parameters (only used by SUPER_ADMIN)
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.id) params.append('id', filter.id);

  const url = `${API_URL}/api/areas${params.toString() ? `?${params.toString()}` : ''}`;

  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include', // Send cookies for refresh token
    cache: 'no-store', // Disable caching for real-time data
  });

  const data = await handleResponse<{ areas: Area[] }>(response);
  return data.areas;
}

/**
 * Get area by ID
 *
 * RBAC check: User must have access to this area
 *
 * @param id - Area ID
 * @returns Area details
 */
export async function getAreaById(id: string): Promise<Area> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/areas/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await handleResponse<{ area: Area }>(response);
  return data.area;
}

/**
 * Create new area
 *
 * RBAC:
 * - SUPER_ADMIN: Can create for any hotel (hotelId required)
 * - HOTEL_ADMIN: Can create for their hotel only (hotelId auto-set)
 * - AREA_MANAGER: Forbidden
 *
 * @param payload - Area creation data
 * @returns Created area
 */
export async function createArea(payload: CreateAreaPayload): Promise<Area> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/areas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ area: Area }>(response);
  return data.area;
}

/**
 * Update area
 *
 * RBAC:
 * - SUPER_ADMIN: Can update any area
 * - HOTEL_ADMIN: Can update areas in their hotel only
 * - AREA_MANAGER: Forbidden
 *
 * @param id - Area ID
 * @param payload - Updated area data
 * @returns Updated area
 */
export async function updateArea(
  id: string,
  payload: UpdateAreaPayload
): Promise<Area> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/areas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ area: Area }>(response);
  return data.area;
}

/**
 * Delete area
 *
 * RBAC:
 * - SUPER_ADMIN: Can delete any area
 * - HOTEL_ADMIN: Can delete areas in their hotel only
 * - AREA_MANAGER: Forbidden
 *
 * Note: Deleting an area sets areaId to null for all associated displays and users
 *
 * @param id - Area ID
 * @returns Deleted area ID
 */
export async function deleteArea(id: string): Promise<{ id: string }> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/areas/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  await handleResponse<null>(response);
  return { id };
}
