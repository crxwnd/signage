/**
 * Displays API Client
 * Functions to interact with displays endpoints
 * Uses authenticatedFetch to include Authorization header
 */

import type {
  Display,
  CreateDisplayPayload,
  UpdateDisplayPayload,
  DisplayFilter,
  PaginationQuery,
  PaginatedResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from '@shared-types';
import { authenticatedFetch } from './auth';

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
 * Get all displays with optional filtering and pagination
 */
export async function getDisplays(
  filter?: DisplayFilter,
  pagination?: PaginationQuery
): Promise<PaginatedResponse<Display>> {
  const params = new URLSearchParams();

  // Add filter parameters
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.status) params.append('status', filter.status);
  if (filter?.areaId) params.append('areaId', filter.areaId);
  if (filter?.search) params.append('search', filter.search);

  // Add pagination parameters
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.limit) params.append('limit', pagination.limit.toString());
  if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
  if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

  const url = `${API_URL}/api/displays${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await authenticatedFetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<PaginatedResponse<Display>>(response);
}

/**
 * Get display by ID
 */
export async function getDisplayById(id: string): Promise<Display> {
  const response = await authenticatedFetch(`${API_URL}/api/displays/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<Display>(response);
}

/**
 * Create new display
 */
export async function createDisplay(
  payload: CreateDisplayPayload
): Promise<Display> {
  const response = await authenticatedFetch(`${API_URL}/api/displays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<Display>(response);
}

/**
 * Update display
 */
export async function updateDisplay(
  id: string,
  payload: UpdateDisplayPayload
): Promise<Display> {
  const response = await authenticatedFetch(`${API_URL}/api/displays/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<Display>(response);
}

/**
 * Delete display
 */
export async function deleteDisplay(id: string): Promise<{ id: string }> {
  const response = await authenticatedFetch(`${API_URL}/api/displays/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<{ id: string }>(response);
}

/**
 * Get display statistics
 */
export async function getDisplayStats(): Promise<{
  total: number;
  online: number;
  offline: number;
  error: number;
}> {
  const response = await authenticatedFetch(`${API_URL}/api/displays/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<{
    total: number;
    online: number;
    offline: number;
    error: number;
  }>(response);
}

