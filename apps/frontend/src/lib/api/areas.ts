import { type ApiSuccessResponse, type ApiErrorResponse } from '@shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Area {
  id: string;
  name: string;
  description?: string;
  hotelId: string;
  _count?: {
    displays: number;
    users: number;
  };
}

export interface AreaFilter {
  hotelId?: string;
  id?: string;
}

export class ApiError extends Error {
  constructor(public message: string, public code: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

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
  
  // Manejo robusto de la respuesta
  const successData = (data as ApiSuccessResponse<any>).data;
  return successData.areas || successData;
}

export async function getAreas(filter?: AreaFilter): Promise<Area[]> {
  const params = new URLSearchParams();
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.id) params.append('id', filter.id);

  const response = await fetch(`${API_URL}/api/areas?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  return handleResponse<Area[]>(response);
}