/**
 * Analytics API Client
 * Fetches analytics data for displays, content, and bandwidth
 */

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface AnalyticsOverview {
    period: { start: string; end: string };
    kpis: {
        uptimePercent: number;
        totalPlays: number;
        bandwidthGB: number;
        activeDisplays: number;
    };
    activityTrend: Array<{ date: string; plays: number; bandwidth: number }>;
    topDisplays: Array<{ id: string; name: string; plays: number }>;
}

export interface DisplayMetrics {
    id: string;
    name: string;
    location: string;
    status: string;
    uptimePercent: number;
    hoursOnline: number;
    disconnections: number;
    lastError: string | null;
    bandwidthMB: number;
    lastSeen: string;
}

export interface BandwidthData {
    daily: Array<{ date: string; totalMB: number }>;
    byDisplay: Array<{ displayId: string; name: string; totalMB: number }>;
    summary: {
        totalGB: number;
        avgDailyMB: number;
        projectedMonthlyGB: number;
    };
}

export interface ContentMetrics {
    id: string;
    name: string;
    type: string;
    plays: number;
    completionRate: number;
    avgDuration: number;
    displaysCount: number;
}

// API Functions
export async function getAnalyticsOverview(from?: string, to?: string): Promise<AnalyticsOverview> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await authenticatedFetch(`${API_URL}/api/analytics/overview?${params}`);

    if (!response.ok) throw new Error('Failed to fetch analytics overview');
    const data = await response.json();
    return data.data;
}

export async function getDisplayAnalytics(): Promise<{ displays: DisplayMetrics[]; pagination: { page: number; total: number } }> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/displays`);

    if (!response.ok) throw new Error('Failed to fetch display analytics');
    const data = await response.json();
    return data.data;
}

export async function getBandwidthAnalytics(): Promise<BandwidthData> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/bandwidth`);

    if (!response.ok) throw new Error('Failed to fetch bandwidth analytics');
    const data = await response.json();
    return data.data;
}

export async function getContentAnalytics(): Promise<{ content: ContentMetrics[] }> {
    const response = await authenticatedFetch(`${API_URL}/api/analytics/content`);

    if (!response.ok) throw new Error('Failed to fetch content analytics');
    const data = await response.json();
    return data.data;
}
