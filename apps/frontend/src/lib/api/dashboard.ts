/**
 * Dashboard API Client
 * Fetches aggregated stats and system information
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DashboardStats {
    displays: {
        total: number;
        online: number;
        offline: number;
        error: number;
    };
    content: {
        total: number;
        videos: number;
        images: number;
        html: number;
        processing: number;
    };
    syncGroups: {
        total: number;
        active: number;
    };
    recentActivity: ActivityItem[];
    systemStatus: {
        server: 'online' | 'degraded' | 'offline';
        database: boolean;
        redis: boolean;
        socketConnections: number;
        storageUsed: number;
        storageTotal: number;
    };
}

export interface ActivityItem {
    id: string;
    type: 'display_connected' | 'display_disconnected' | 'content_uploaded' | 'content_deleted' | 'user_action' | 'sync_started';
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }

    const data = await response.json();
    return data.data;
}
