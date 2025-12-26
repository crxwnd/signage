/**
 * Users API Client
 * Functions to interact with users endpoints
 * Uses authenticatedFetch to include Authorization header
 */

import { authenticatedFetch } from './auth';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// =============================================================================
// TYPES
// =============================================================================

export type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    hotelId: string | null;
    areaId: string | null;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    hotel?: { id: string; name: string } | null;
    area?: { id: string; name: string } | null;
}

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    hotelId?: string | null;
    areaId?: string | null;
}

export interface UpdateUserData {
    name?: string;
    role?: UserRole;
    hotelId?: string | null;
    areaId?: string | null;
    password?: string;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

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

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all users (filtered by RBAC on backend)
 */
export async function getUsers(): Promise<User[]> {
    const response = await authenticatedFetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await handleResponse<{ users: User[] }>(response);
    return data.users;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
    const response = await authenticatedFetch(`${API_URL}/api/users/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await handleResponse<{ user: User }>(response);
    return data.user;
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserData): Promise<User> {
    const response = await authenticatedFetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await handleResponse<{ user: User }>(response);
    return result.user;
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await authenticatedFetch(`${API_URL}/api/users/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await handleResponse<{ user: User }>(response);
    return result.user;
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<{ id: string }> {
    const response = await authenticatedFetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return handleResponse<{ id: string }>(response);
}
