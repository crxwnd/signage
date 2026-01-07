/**
 * User Analytics Service
 * Tracks and analyzes user activity
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

// Types
export interface UserActivity {
    id: string;
    userId: string;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export interface UserActivityStats {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalActions: number;
    lastActivity: Date | null;
    loginCount: number;
    contentUploads: number;
    schedulesCreated: number;
    alertsCreated: number;
}

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

// Activity actions
export const ActivityActions = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    TWO_FA_ENABLED: 'TWO_FA_ENABLED',
    TWO_FA_DISABLED: 'TWO_FA_DISABLED',
    CONTENT_UPLOAD: 'CONTENT_UPLOAD',
    CONTENT_DELETE: 'CONTENT_DELETE',
    SCHEDULE_CREATE: 'SCHEDULE_CREATE',
    SCHEDULE_UPDATE: 'SCHEDULE_UPDATE',
    SCHEDULE_DELETE: 'SCHEDULE_DELETE',
    ALERT_CREATE: 'ALERT_CREATE',
    ALERT_DEACTIVATE: 'ALERT_DEACTIVATE',
    DISPLAY_CREATE: 'DISPLAY_CREATE',
    DISPLAY_UPDATE: 'DISPLAY_UPDATE',
    DISPLAY_DELETE: 'DISPLAY_DELETE',
    USER_CREATE: 'USER_CREATE',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',
    SYNC_GROUP_CREATE: 'SYNC_GROUP_CREATE',
    SYNC_GROUP_UPDATE: 'SYNC_GROUP_UPDATE',
    AREA_CREATE: 'AREA_CREATE',
    HOTEL_CREATE: 'HOTEL_CREATE',
};

/**
 * Log user activity
 */
export async function logActivity(data: {
    userId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> {
    try {
        await prisma.userActivityLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details as object | undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            }
        });
    } catch (error) {
        // Don't fail the main operation if logging fails
        log.error('[UserAnalytics] Failed to log activity', { error, data });
    }
}

/**
 * Get user analytics overview
 */
export async function getAnalyticsOverview(from: Date, to: Date): Promise<UserAnalyticsOverview> {
    // Get basic counts
    const [totalUsers, newUsers, activities] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
            where: { createdAt: { gte: from, lte: to } }
        }),
        prisma.userActivityLog.findMany({
            where: { createdAt: { gte: from, lte: to } },
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    // Calculate active users (unique users with activity)
    const activeUserIds = new Set(activities.map(a => a.userId));
    const activeUsers = activeUserIds.size;

    // Count logins
    const totalLogins = activities.filter(a => a.action === 'LOGIN').length;

    // Activity by day
    const activityByDayMap = new Map<string, { logins: number; actions: number }>();

    // Initialize all days in range
    const currentDate = new Date(from);
    while (currentDate <= to) {
        const dateKey = currentDate.toISOString().split('T')[0] as string;
        activityByDayMap.set(dateKey, { logins: 0, actions: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in activity
    activities.forEach(activity => {
        const dateKey = activity.createdAt.toISOString().split('T')[0] as string;
        const existing = activityByDayMap.get(dateKey);
        if (existing) {
            existing.actions++;
            if (activity.action === 'LOGIN') {
                existing.logins++;
            }
        }
    });

    const activityByDay = Array.from(activityByDayMap.entries()).map(([date, data]) => ({
        date,
        logins: data.logins,
        actions: data.actions
    }));

    // Top users by activity
    const userActivityCount = new Map<string, { id: string; name: string; actions: number }>();
    activities.forEach(activity => {
        const existing = userActivityCount.get(activity.userId);
        if (existing) {
            existing.actions++;
        } else {
            userActivityCount.set(activity.userId, {
                id: activity.userId,
                name: activity.user?.name || 'Unknown',
                actions: 1
            });
        }
    });

    const topUsers = Array.from(userActivityCount.values())
        .sort((a, b) => b.actions - a.actions)
        .slice(0, 10);

    // Action breakdown
    const actionCounts = new Map<string, number>();
    activities.forEach(activity => {
        actionCounts.set(activity.action, (actionCounts.get(activity.action) || 0) + 1);
    });

    const actionBreakdown = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);

    return {
        period: { start: from.toISOString(), end: to.toISOString() },
        totalUsers,
        activeUsers,
        newUsers,
        totalLogins,
        activityByDay,
        topUsers,
        actionBreakdown
    };
}

/**
 * Get activity stats per user
 */
export async function getUserActivityStats(hotelId?: string): Promise<UserActivityStats[]> {
    const whereClause = hotelId ? { hotelId } : {};

    const users = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        }
    });

    // Get detailed stats for each user
    const stats = await Promise.all(users.map(async (user) => {
        const [totalActions, lastActivity, loginCount, contentUploads, schedulesCreated, alertsCreated] = await Promise.all([
            prisma.userActivityLog.count({
                where: { userId: user.id }
            }),
            prisma.userActivityLog.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            }),
            prisma.userActivityLog.count({
                where: { userId: user.id, action: 'LOGIN' }
            }),
            prisma.userActivityLog.count({
                where: { userId: user.id, action: 'CONTENT_UPLOAD' }
            }),
            prisma.userActivityLog.count({
                where: { userId: user.id, action: 'SCHEDULE_CREATE' }
            }),
            prisma.userActivityLog.count({
                where: { userId: user.id, action: 'ALERT_CREATE' }
            }),
        ]);

        return {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            totalActions,
            lastActivity: lastActivity?.createdAt || null,
            loginCount,
            contentUploads,
            schedulesCreated,
            alertsCreated,
        };
    }));

    return stats.sort((a, b) => b.totalActions - a.totalActions);
}

/**
 * Get recent activity
 */
export async function getRecentActivity(limit = 50, hotelId?: string): Promise<UserActivity[]> {
    const whereClause = hotelId
        ? { user: { hotelId } }
        : {};

    const activities = await prisma.userActivityLog.findMany({
        where: whereClause,
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return activities as UserActivity[];
}

/**
 * Get login history
 */
export async function getLoginHistory(limit = 100, hotelId?: string): Promise<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    success: boolean;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Date;
}[]> {
    const whereClause: Record<string, unknown> = {
        action: { in: ['LOGIN', 'LOGIN_FAILED'] }
    };

    if (hotelId) {
        whereClause.user = { hotelId };
    }

    const logins = await prisma.userActivityLog.findMany({
        where: whereClause,
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return logins.map(login => ({
        id: login.id,
        userId: login.userId,
        userName: login.user?.name || 'Unknown',
        userEmail: login.user?.email || '',
        userRole: login.user?.role || '',
        success: login.action === 'LOGIN',
        ipAddress: login.ipAddress,
        userAgent: login.userAgent,
        timestamp: login.createdAt
    }));
}

/**
 * Get security overview
 */
export async function getSecurityOverview(hotelId?: string): Promise<{
    failedLogins24h: number;
    activeSessions: number;
    usersWithout2FA: number;
}> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const whereClause = hotelId ? { hotelId } : {};

    const [failedLogins24h, usersWithout2FA] = await Promise.all([
        // Failed logins in last 24h
        prisma.userActivityLog.count({
            where: {
                action: 'LOGIN_FAILED',
                createdAt: { gte: twentyFourHoursAgo },
                ...(hotelId ? { user: { hotelId } } : {})
            }
        }),
        // Users without 2FA
        prisma.user.count({
            where: {
                ...whereClause,
                twoFactorEnabled: false
            }
        })
    ]);

    // Estimate active sessions from recent logins (simplified)
    const recentLogins = await prisma.userActivityLog.groupBy({
        by: ['userId'],
        where: {
            action: 'LOGIN',
            createdAt: { gte: new Date(Date.now() - 8 * 60 * 60 * 1000) }, // Last 8 hours
            ...(hotelId ? { user: { hotelId } } : {})
        }
    });

    return {
        failedLogins24h,
        activeSessions: recentLogins.length,
        usersWithout2FA
    };
}

export default {
    logActivity,
    getAnalyticsOverview,
    getUserActivityStats,
    getRecentActivity,
    getLoginHistory,
    getSecurityOverview,
    ActivityActions,
};
