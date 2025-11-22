/**
 * Areas API Client
 * Functions to interact with areas endpoints
 */

import type { Area, ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

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
 * Get all areas
 * Optionally filter by hotelId
 */
export async function getAreas(hotelId?: string): Promise<Area[]> {
  const params = new URLSearchParams();
  if (hotelId) {
    params.append('hotelId', hotelId);
  }

  const url = `${API_URL}/api/areas${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Disable caching for real-time data
  });

  return handleResponse<Area[]>(response);
}
