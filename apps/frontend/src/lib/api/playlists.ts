/**
 * Playlists API Client
 * HTTP client functions for playlist management (display-content assignments)
 */

import { authenticatedFetch, ApiError } from './auth';

// ============================================================================
// TYPES
// ============================================================================

export interface PlaylistItem {
  id: string;
  displayId: string;
  contentId: string;
  order: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  content: {
    id: string;
    name: string;
    type: string;
    status: string;
    thumbnailUrl: string | null;
    hlsUrl: string | null;
    duration: number | null;
  };
}

export interface AddToPlaylistPayload {
  contentId: string;
  order?: number;
  startTime?: string;
  endTime?: string;
}

export interface ReorderItem {
  id: string;
  order: number;
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
 * Get playlist for a display
 * GET /api/playlists/:displayId
 */
export async function getPlaylist(displayId: string): Promise<PlaylistItem[]> {
  const response = await authenticatedFetch(
    `${API_URL}/api/playlists/${displayId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return handleResponse<PlaylistItem[]>(response);
}

/**
 * Add content to a display's playlist
 * POST /api/playlists/:displayId/content
 */
export async function addToPlaylist(
  displayId: string,
  payload: AddToPlaylistPayload
): Promise<PlaylistItem> {
  const response = await authenticatedFetch(
    `${API_URL}/api/playlists/${displayId}/content`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<PlaylistItem>(response);
}

/**
 * Remove item from playlist
 * DELETE /api/playlists/item/:id
 */
export async function removeFromPlaylist(itemId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${API_URL}/api/playlists/item/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  await handleResponse<{ id: string }>(response);
}

/**
 * Reorder playlist items
 * PUT /api/playlists/:displayId/reorder
 */
export async function reorderPlaylist(
  displayId: string,
  items: ReorderItem[]
): Promise<PlaylistItem[]> {
  const response = await authenticatedFetch(
    `${API_URL}/api/playlists/${displayId}/reorder`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );

  return handleResponse<PlaylistItem[]>(response);
}
