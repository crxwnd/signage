/**
 * Schedule API Client
 * Frontend API functions for schedule management
 */

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Schedule {
    id: string;
    name: string;
    contentId: string;
    content?: {
        id: string;
        name: string;
        type: string;
        thumbnailUrl?: string;
    };
    displayId?: string;
    display?: {
        id: string;
        name: string;
        location: string;
    };
    areaId?: string;
    area?: {
        id: string;
        name: string;
    };
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    recurrence?: string;
    priority: number;
    isActive: boolean;
    hotelId: string;
    hotel?: {
        id: string;
        name: string;
    };
    createdBy: string;
    creator?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    nextOccurrences?: string[];
    recurrenceDescription?: string;
}

export interface CreateScheduleDTO {
    name: string;
    contentId: string;
    displayId?: string;
    areaId?: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    recurrence?: string;
    priority?: number;
    hotelId?: string;
}

export type UpdateScheduleDTO = Partial<CreateScheduleDTO> & {
    isActive?: boolean;
};

export interface ScheduleFilters {
    displayId?: string;
    areaId?: string;
    hotelId?: string;
    active?: boolean;
}

// API Functions

export async function getSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    const params = new URLSearchParams();
    if (filters?.displayId) params.set('displayId', filters.displayId);
    if (filters?.areaId) params.set('areaId', filters.areaId);
    if (filters?.hotelId) params.set('hotelId', filters.hotelId);
    if (filters?.active !== undefined) params.set('active', String(filters.active));

    const response = await authenticatedFetch(`${API_URL}/api/schedules?${params}`);
    if (!response.ok) throw new Error('Failed to fetch schedules');
    const data = await response.json();
    return data.data;
}

export async function getSchedule(id: string): Promise<Schedule> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules/${id}`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    const data = await response.json();
    return data.data;
}

export async function createSchedule(dto: CreateScheduleDTO): Promise<Schedule> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
    }
    const data = await response.json();
    return data.data;
}

export async function updateSchedule(id: string, dto: UpdateScheduleDTO): Promise<Schedule> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
    }
    const data = await response.json();
    return data.data;
}

export async function deleteSchedule(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete schedule');
}

export async function getActiveContent(displayId: string): Promise<{
    scheduleId: string;
    contentId: string;
    priority: number;
    scheduleName: string;
} | null> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules/active/${displayId}`);
    if (!response.ok) throw new Error('Failed to fetch active content');
    const data = await response.json();
    return data.data;
}

export async function getSchedulePreview(id: string, count: number = 10): Promise<{
    scheduleId: string;
    occurrences: string[];
    recurrenceDescription: string;
}> {
    const response = await authenticatedFetch(`${API_URL}/api/schedules/${id}/preview?count=${count}`);
    if (!response.ok) throw new Error('Failed to fetch schedule preview');
    const data = await response.json();
    return data.data;
}
