import { authenticatedFetch } from './auth';
import { type ApiSuccessResponse, type ApiErrorResponse } from '@shared-types';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Definición de tipos
export interface Area {
  id: string;
  name: string;
  description?: string;
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
  };
  _count?: {
    displays: number;
    users: number;
  };
}

export interface AreaFilter {
  hotelId?: string;
  id?: string;
}

export interface CreateAreaInput {
  name: string;
  description?: string;
  hotelId?: string; // Required for SUPER_ADMIN, auto-set for HOTEL_ADMIN
}

export interface UpdateAreaInput {
  name?: string;
  description?: string;
}

// Clase de error personalizada
export class ApiError extends Error {
  constructor(public message: string, public code: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper para manejar respuestas
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiErrorResponse;
    throw new ApiError(
      error.error?.message || 'Unknown error',
      error.error?.code || 'INTERNAL_ERROR',
      error.error?.details
    );
  }

  // Manejo robusto: data.data.areas, data.data.area, o data.data
  const successData = (data as ApiSuccessResponse<any>).data;
  return successData.areas || successData.area || successData;
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Get areas with optional filtering (RBAC applied on backend)
 */
export async function getAreas(filter?: AreaFilter): Promise<Area[]> {
  const params = new URLSearchParams();
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.id) params.append('id', filter.id);

  const response = await authenticatedFetch(`${API_URL}/api/areas?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<Area[]>(response);
}

/**
 * Get a single area by ID
 */
export async function getAreaById(id: string): Promise<Area> {
  const response = await authenticatedFetch(`${API_URL}/api/areas/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<Area>(response);
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

/**
 * Create a new area
 * - SUPER_ADMIN: must provide hotelId
 * - HOTEL_ADMIN: hotelId auto-set to their hotel
 * - AREA_MANAGER: forbidden
 */
export async function createArea(data: CreateAreaInput): Promise<Area> {
  const response = await authenticatedFetch(`${API_URL}/api/areas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<Area>(response);
}

/**
 * Update an existing area
 * - SUPER_ADMIN: can update any area
 * - HOTEL_ADMIN: can update areas in their hotel
 * - AREA_MANAGER: forbidden
 */
export async function updateArea(id: string, data: UpdateAreaInput): Promise<Area> {
  const response = await authenticatedFetch(`${API_URL}/api/areas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<Area>(response);
}

/**
 * Delete an area
 * - SUPER_ADMIN: can delete any area
 * - HOTEL_ADMIN: can delete areas in their hotel
 * - AREA_MANAGER: forbidden
 */
export async function deleteArea(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/areas/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const data = await response.json();
    const error = data as ApiErrorResponse;
    throw new ApiError(
      error.error?.message || 'Failed to delete area',
      error.error?.code || 'DELETE_ERROR',
      error.error?.details
    );
  }
}