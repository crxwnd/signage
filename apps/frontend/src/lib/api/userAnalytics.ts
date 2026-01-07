/**
 * User Analytics API Client
 */

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserAnalyticsOverview {
    period: { start: string; end: string };
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalLogins: number;
    activityByDay: Array<{ date: string; logins: number; actions: number }>;
    topUsers: Array<{ id: string; name: string; actions: number }>;
    actionBreakdown: Array<{ action: string; count: number }>;
}

export interface UserActivityStats {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalActions: number;
    lastActivity: string | null;
    loginCount: number;
    contentUploads: number;
    schedulesCreated: number;
    alertsCreated: number;
}

export interface UserActivity {
    id: string;
    userId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export async function getUserAnalyticsOverview(from?: string, to?: string): Promise<UserAnalyticsOverview> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await authenticatedFetch(`${API_URL}/api/analytics/users/overview?${params}`);

    if (!response.ok) throw new Error('Failed to fetch user analytics');
    const data = await response.json();
    return data.data;
}

export async function getUserActivityStats(): Promise<UserActivityStats[]> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/users/stats`);

    if (!response.ok) throw new Error('Failed to fetch user stats');
    const data = await response.json();
    return data.data.users;
}

export async function getRecentUserActivity(limit = 50): Promise<UserActivity[]> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/users/activity?limit=${limit}`);

    if (!response.ok) throw new Error('Failed to fetch activity');
    const data = await response.json();
    return data.data.activities;
}

export interface LoginHistoryItem {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    success: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    timestamp: string;
}

export interface SecurityOverview {
    failedLogins24h: number;
    activeSessions: number;
    usersWithout2FA: number;
}

export async function getLoginHistory(limit = 100): Promise<LoginHistoryItem[]> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/users/logins?limit=${limit}`);

    if (!response.ok) throw new Error('Failed to fetch login history');
    const data = await response.json();
    return data.data.logins;
}

export async function getSecurityOverview(): Promise<SecurityOverview> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/users/security`);

    if (!response.ok) throw new Error('Failed to fetch security overview');
    const data = await response.json();
    return data.data;
}
