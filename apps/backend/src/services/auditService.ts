/**
 * Audit Service
 * Comprehensive audit logging for compliance and traceability
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import type { Request } from 'express';

// ==============================================
// TYPES
// ==============================================

export type AuditCategory =
    | 'AUTHENTICATION'
    | 'CONTENT'
    | 'DISPLAY'
    | 'SCHEDULE'
    | 'ALERT'
    | 'USER'
    | 'SYSTEM'
    | 'SYNC_GROUP'
    | 'AREA'
    | 'HOTEL';

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'EXPORT'
    | 'IMPORT'
    | 'ASSIGN'
    | 'UNASSIGN'
    | 'ACTIVATE'
    | 'DEACTIVATE'
    | 'PAIR'
    | 'UNPAIR'
    | 'VIEW'
    | 'DOWNLOAD';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ActorType = 'USER' | 'SYSTEM' | 'SCHEDULER' | 'API';

interface AuditLogParams {
    userId?: string;
    actorType?: ActorType;
    action: AuditAction;
    category: AuditCategory;
    severity?: AuditSeverity;
    resource?: string;
    resourceId?: string;
    resourceName?: string;
    description: string;
    oldData?: object;
    newData?: object;
    metadata?: object;
    hotelId?: string;
    areaId?: string;
    req?: Request;
}

interface DisplayStateChangeParams {
    displayId: string;
    fromStatus: string | null;
    toStatus: string;
    trigger: string;
    triggeredBy?: string;
    errorCode?: string;
    errorMessage?: string;
    hotelId: string;
    ipAddress?: string;
}

interface SessionParams {
    userId: string;
    sessionToken: string;
    hotelId?: string;
    expiresAt: Date;
    req?: Request;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function getRequestInfo(req?: Request) {
    if (!req) return { ipAddress: undefined, userAgent: undefined };

    return {
        ipAddress: req.ip || req.socket?.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
    };
}

function parseUserAgent(userAgent?: string) {
    if (!userAgent) return { deviceType: undefined, browser: undefined, os: undefined };

    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

    return {
        deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
        browser,
        os,
    };
}

// ==============================================
// AUDIT LOG FUNCTIONS
// ==============================================

/**
 * Create audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
    try {
        const { ipAddress, userAgent } = getRequestInfo(params.req);

        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                actorType: params.actorType || 'USER',
                action: params.action,
                category: params.category,
                severity: params.severity || 'INFO',
                resource: params.resource,
                resourceId: params.resourceId,
                resourceName: params.resourceName,
                description: params.description,
                oldData: params.oldData,
                newData: params.newData,
                metadata: params.metadata,
                hotelId: params.hotelId,
                areaId: params.areaId,
                ipAddress,
                userAgent,
            },
        });

        log.debug('[Audit] Log created', {
            action: params.action,
            category: params.category,
            resourceId: params.resourceId
        });
    } catch (error) {
        log.error('[Audit] Failed to create log', { error, params });
    }
}

/**
 * Log display state change
 */
export async function logDisplayStateChange(params: DisplayStateChangeParams): Promise<void> {
    try {
        await prisma.displayStateHistory.create({
            data: {
                displayId: params.displayId,
                fromStatus: params.fromStatus,
                toStatus: params.toStatus,
                trigger: params.trigger,
                triggeredBy: params.triggeredBy,
                errorCode: params.errorCode,
                errorMessage: params.errorMessage,
                hotelId: params.hotelId,
                ipAddress: params.ipAddress,
            },
        });

        if (params.toStatus === 'ERROR' || params.trigger === 'MANUAL') {
            await createAuditLog({
                userId: params.triggeredBy,
                actorType: params.triggeredBy ? 'USER' : 'SYSTEM',
                action: 'UPDATE',
                category: 'DISPLAY',
                severity: params.toStatus === 'ERROR' ? 'WARNING' : 'INFO',
                resource: 'display',
                resourceId: params.displayId,
                description: `Display status changed from ${params.fromStatus || 'unknown'} to ${params.toStatus}`,
                metadata: {
                    trigger: params.trigger,
                    errorCode: params.errorCode,
                    errorMessage: params.errorMessage,
                },
                hotelId: params.hotelId,
            });
        }
    } catch (error) {
        log.error('[Audit] Failed to log display state change', { error, params });
    }
}

/**
 * Create user session
 */
export async function createSession(params: SessionParams): Promise<void> {
    try {
        const { ipAddress, userAgent } = getRequestInfo(params.req);
        const { deviceType, browser, os } = parseUserAgent(userAgent);

        await prisma.sessionLog.create({
            data: {
                userId: params.userId,
                sessionToken: params.sessionToken,
                status: 'ACTIVE',
                hotelId: params.hotelId,
                expiresAt: params.expiresAt,
                ipAddress,
                userAgent,
                deviceType,
                browser,
                os,
            },
        });
    } catch (error) {
        log.error('[Audit] Failed to create session', { error });
    }
}

/**
 * End user session
 */
export async function endSession(sessionToken: string, reason: string): Promise<void> {
    try {
        await prisma.sessionLog.update({
            where: { sessionToken },
            data: {
                status: reason === 'LOGOUT' ? 'LOGGED_OUT' : reason === 'EXPIRED' ? 'EXPIRED' : 'REVOKED',
                endedAt: new Date(),
                endReason: reason,
            },
        });
    } catch (error) {
        log.error('[Audit] Failed to end session', { error, sessionToken });
    }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
    try {
        await prisma.sessionLog.update({
            where: { sessionToken },
            data: { lastActiveAt: new Date() },
        });
    } catch {
        // Silent fail
    }
}

// ==============================================
// QUERY FUNCTIONS
// ==============================================

interface AuditQueryParams {
    hotelId?: string;
    areaId?: string;
    userId?: string;
    category?: AuditCategory;
    action?: AuditAction;
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(params: AuditQueryParams) {
    const where: Record<string, unknown> = {};

    if (params.hotelId) where.hotelId = params.hotelId;
    if (params.areaId) where.areaId = params.areaId;
    if (params.userId) where.userId = params.userId;
    if (params.category) where.category = params.category;
    if (params.action) where.action = params.action;
    if (params.severity) where.severity = params.severity;
    if (params.resourceType) where.resource = params.resourceType;
    if (params.resourceId) where.resourceId = params.resourceId;

    if (params.from || params.to) {
        const dateFilter: Record<string, Date> = {};
        if (params.from) dateFilter.gte = params.from;
        if (params.to) dateFilter.lte = params.to;
        where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: params.limit || 100,
            skip: params.offset || 0,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
}

/**
 * Get display state history
 */
export async function getDisplayStateHistory(displayId: string, limit = 100) {
    return prisma.displayStateHistory.findMany({
        where: { displayId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get active sessions
 */
export async function getActiveSessions(hotelId?: string) {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (hotelId) where.hotelId = hotelId;

    return prisma.sessionLog.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
        },
        orderBy: { lastActiveAt: 'desc' },
    });
}

/**
 * Get display complete timeline
 */
export async function getDisplayTimeline(displayId: string, from?: Date, to?: Date) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [stateHistory, playbackLogs, sourceChanges] = await Promise.all([
        prisma.displayStateHistory.findMany({
            where: {
                displayId,
                ...(hasDateFilter && { createdAt: dateFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.playbackLog.findMany({
            where: {
                displayId,
                ...(hasDateFilter && { startedAt: dateFilter }),
            },
            orderBy: { startedAt: 'desc' },
            take: 100,
        }),
        prisma.contentSourceChange.findMany({
            where: {
                displayId,
                ...(hasDateFilter && { timestamp: dateFilter }),
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
        }),
    ]);

    const timeline = [
        ...stateHistory.map(e => ({ type: 'STATE_CHANGE', ...e, timestamp: e.createdAt })),
        ...playbackLogs.map(e => ({ type: 'PLAYBACK', ...e, timestamp: e.startedAt })),
        ...sourceChanges.map(e => ({ type: 'SOURCE_CHANGE', ...e })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
}

/**
 * Get user activity timeline
 */
export async function getUserTimeline(userId: string, from?: Date, to?: Date) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [activityLogs, auditLogs, sessions] = await Promise.all([
        prisma.userActivityLog.findMany({
            where: {
                userId,
                ...(hasDateFilter && { createdAt: dateFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.auditLog.findMany({
            where: {
                userId,
                ...(hasDateFilter && { createdAt: dateFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.sessionLog.findMany({
            where: {
                userId,
                ...(hasDateFilter && { startedAt: dateFilter }),
            },
            orderBy: { startedAt: 'desc' },
            take: 50,
        }),
    ]);

    return { activityLogs, auditLogs, sessions };
}

/**
 * Get audit summary statistics
 */
export async function getAuditSummary(hotelId?: string, from?: Date, to?: Date) {
    const where: Record<string, unknown> = {};
    if (hotelId) where.hotelId = hotelId;
    if (from || to) {
        const dateFilter: Record<string, Date> = {};
        if (from) dateFilter.gte = from;
        if (to) dateFilter.lte = to;
        where.createdAt = dateFilter;
    }

    const [
        totalLogs,
        byCategory,
        byAction,
        bySeverity,
        criticalEvents,
    ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
            by: ['category'],
            where,
            _count: { id: true },
        }),
        prisma.auditLog.groupBy({
            by: ['action'],
            where,
            _count: { id: true },
        }),
        prisma.auditLog.groupBy({
            by: ['severity'],
            where,
            _count: { id: true },
        }),
        prisma.auditLog.findMany({
            where: { ...where, severity: 'CRITICAL' },
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }),
    ]);

    return {
        totalLogs,
        byCategory: byCategory.map(c => ({ category: c.category, count: c._count.id })),
        byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
        bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.id })),
        criticalEvents,
    };
}

export default {
    createAuditLog,
    logDisplayStateChange,
    createSession,
    endSession,
    updateSessionActivity,
    getAuditLogs,
    getDisplayStateHistory,
    getActiveSessions,
    getDisplayTimeline,
    getUserTimeline,
    getAuditSummary,
};
