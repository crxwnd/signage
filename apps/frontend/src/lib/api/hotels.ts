/**
 * Hotels API Client
 * CRUD operations for hotel management
 */

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Hotel {
    id: string;
    name: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    stats?: HotelStats;
}

export interface HotelStats {
    displayCount: number;
    onlineDisplays: number;
    offlineDisplays: number;
    contentCount: number;
    userCount: number;
    areaCount: number;
    alertCount: number;
    scheduleCount: number;
}

export interface CreateHotelInput {
    name: string;
    address: string;
}

export interface UpdateHotelInput {
    name?: string;
    address?: string;
}

export interface GlobalHotelStats {
    totalHotels: number;
    totalDisplays: number;
    onlineDisplays: number;
    totalContent: number;
    totalUsers: number;
}

/**
 * Get all hotels
 */
export async function getHotels(includeStats = false): Promise<Hotel[]> {
    const url = includeStats
        ? `${API_URL}/api/hotels?stats=true`
        : `${API_URL}/api/hotels`;

    const response = await authenticatedFetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch hotels');
    }

    const data = await response.json();
    return data.data.hotels;
}

/**
 * Get hotel by ID
 */
export async function getHotelById(id: string): Promise<Hotel> {
    const response = await authenticatedFetch(`${API_URL}/api/hotels/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch hotel');
    }

    const data = await response.json();
    return data.data.hotel;
}

/**
 * Get global hotel statistics
 */
export async function getHotelGlobalStats(): Promise<GlobalHotelStats> {
    const response = await authenticatedFetch(`${API_URL}/api/hotels/stats`);

    if (!response.ok) {
        throw new Error('Failed to fetch hotel stats');
    }

    const data = await response.json();
    return data.data.stats;
}

/**
 * Create hotel
 */
export async function createHotel(input: CreateHotelInput): Promise<Hotel> {
    const response = await authenticatedFetch(`${API_URL}/api/hotels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create hotel');
    }

    const data = await response.json();
    return data.data.hotel;
}

/**
 * Update hotel
 */
export async function updateHotel(id: string, input: UpdateHotelInput): Promise<Hotel> {
    const response = await authenticatedFetch(`${API_URL}/api/hotels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update hotel');
    }

    const data = await response.json();
    return data.data.hotel;
}

/**
 * Delete hotel
 */
export async function deleteHotel(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/hotels/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete hotel');
    }
}
