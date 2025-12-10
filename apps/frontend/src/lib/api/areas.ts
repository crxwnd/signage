import { authenticatedFetch } from './auth'; // <--- CAMBIO CLAVE
import { type ApiSuccessResponse, type ApiErrorResponse } from '@shared-types';

// Definición de tipos
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
  
  // Manejo robusto: data.data.areas o data.data
  const successData = (data as ApiSuccessResponse<any>).data;
  return successData.areas || successData;
}

// Función principal para obtener áreas
export async function getAreas(filter?: AreaFilter): Promise<Area[]> {
  const params = new URLSearchParams();
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.id) params.append('id', filter.id);

  // USAMOS authenticatedFetch
  // Esto inyecta automáticamente: Authorization: Bearer <token>
  const response = await authenticatedFetch(`/api/areas?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<Area[]>(response);
}