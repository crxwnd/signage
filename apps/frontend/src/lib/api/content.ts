/**
 * Content API Client
 * HTTP client functions for content management
 */

// ============================================================================
// TYPES
// ============================================================================

export type ContentType = 'VIDEO' | 'IMAGE' | 'HTML';
export type ContentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';

export interface Content {
  id: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  originalUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  resolution: string | null;
  fileSize: string | null; // Serialized as string from BigInt
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentFilter {
  hotelId?: string;
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateContentPayload {
  name: string;
  type: ContentType;
  originalUrl: string;
  hotelId: string;
  duration?: number;
  resolution?: string;
  fileSize?: string;
}

export interface UpdateContentPayload {
  name?: string;
  status?: ContentStatus;
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
}

export interface ContentStats {
  total: number;
  byType: {
    videos: number;
    images: number;
    html: number;
  };
  byStatus: {
    pending: number;
    processing: number;
    ready: number;
    error: number;
  };
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================================
// ERROR HANDLING
// ============================================================================

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

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all content with optional filtering and pagination
 */
export async function getContents(
  filter?: ContentFilter,
  pagination?: PaginationQuery
): Promise<PaginatedResponse<Content>> {
  const params = new URLSearchParams();

  // Add filter params
  if (filter?.hotelId) params.append('hotelId', filter.hotelId);
  if (filter?.type) params.append('type', filter.type);
  if (filter?.status) params.append('status', filter.status);
  if (filter?.search) params.append('search', filter.search);

  // Add pagination params
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.limit) params.append('limit', pagination.limit.toString());
  if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
  if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

  const response = await fetch(`${API_URL}/api/content?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  return handleResponse<PaginatedResponse<Content>>(response);
}

/**
 * Get content by ID
 */
export async function getContentById(id: string): Promise<Content> {
  const response = await fetch(`${API_URL}/api/content/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  return handleResponse<Content>(response);
}

/**
 * Create new content
 */
export async function createContent(
  payload: CreateContentPayload
): Promise<Content> {
  const response = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return handleResponse<Content>(response);
}

/**
 * Upload content file (video or image)
 */
export async function uploadContent(
  file: File,
  name: string,
  hotelId: string
): Promise<Content> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('hotelId', hotelId);

  const response = await fetch(`${API_URL}/api/content/upload`, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  return handleResponse<Content>(response);
}

/**
 * Update content
 */
export async function updateContent(
  id: string,
  payload: UpdateContentPayload
): Promise<Content> {
  const response = await fetch(`${API_URL}/api/content/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return handleResponse<Content>(response);
}

/**
 * Delete content
 */
export async function deleteContent(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/content/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  return handleResponse<void>(response);
}

/**
 * Get content statistics
 */
export async function getContentStats(hotelId?: string): Promise<ContentStats> {
  const params = new URLSearchParams();
  if (hotelId) params.append('hotelId', hotelId);

  const response = await fetch(
    `${API_URL}/api/content/stats?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  return handleResponse<ContentStats>(response);
}
