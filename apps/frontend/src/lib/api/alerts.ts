/**
 * Alerts API Client
 * Frontend API functions for alert management
 */

import { authenticatedFetch } from './auth';
import type { Alert, CreateAlertDTO } from '@shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AlertsFilter {
    active?: boolean;
    hotelId?: string;
    areaId?: string;
}

export async function getAlerts(filter?: AlertsFilter): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filter?.active !== undefined) params.set('active', String(filter.active));
    if (filter?.hotelId) params.set('hotelId', filter.hotelId);
    if (filter?.areaId) params.set('areaId', filter.areaId);

    const query = params.toString();
    const url = `${API_URL}/api/alerts${query ? `?${query}` : ''}`;

    const response = await authenticatedFetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch alerts');
    }

    const data = await response.json();
    return data.data;
}

export async function getAlertById(id: string): Promise<Alert> {
    const response = await authenticatedFetch(`${API_URL}/api/alerts/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch alert');
    }

    const data = await response.json();
    return data.data;
}

export async function createAlert(dto: CreateAlertDTO): Promise<Alert> {
    const response = await authenticatedFetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create alert');
    }

    const data = await response.json();
    return data.data;
}

export async function updateAlert(
    id: string,
    updates: Partial<CreateAlertDTO & { isActive?: boolean }>
): Promise<Alert> {
    const response = await authenticatedFetch(`${API_URL}/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error('Failed to update alert');
    }

    const data = await response.json();
    return data.data;
}

export async function deactivateAlert(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/alerts/${id}/deactivate`, {
        method: 'PUT',
    });

    if (!response.ok) {
        throw new Error('Failed to deactivate alert');
    }
}

export async function deleteAlert(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/alerts/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete alert');
    }
}
