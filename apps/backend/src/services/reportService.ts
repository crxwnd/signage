/**
 * Report Service
 * Generates comprehensive reports with data aggregation
 */

import { prisma } from '../utils/prisma';
import type ExcelJS from 'exceljs';
import { Workbook } from 'exceljs';

// ==============================================
// TYPES
// ==============================================

export interface ReportFilters {
    hotelId?: string;
    areaId?: string;
    userId?: string;
    displayId?: string;
    from: Date;
    to: Date;
}

export interface DisplayReportData {
    summary: {
        totalDisplays: number;
        activeDisplays: number;
        offlineDisplays: number;
        errorDisplays: number;
        avgUptimePercent: number;
        totalPlaybackHours: number;
    };
    displayMetrics: Array<{
        id: string;
        name: string;
        location: string;
        areaName: string;
        hotelName: string;
        status: string;
        uptimePercent: number;
        totalPlaybackHours: number;
        contentChanges: number;
        errorCount: number;
        lastSeen: Date | null;
    }>;
    dailyActivity: Array<{
        date: string;
        onlineCount: number;
        offlineCount: number;
        errorCount: number;
        playbackHours: number;
    }>;
    statusHistory: Array<{
        displayId: string;
        displayName: string;
        timestamp: Date;
        fromStatus: string | null;
        toStatus: string;
        trigger: string;
        errorMessage: string | null;
    }>;
}

export interface UserReportData {
    summary: {
        totalUsers: number;
        activeUsers: number;
        totalLogins: number;
        failedLogins: number;
        totalActions: number;
        usersWithout2FA: number;
    };
    userMetrics: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        hotelName: string | null;
        areaName: string | null;
        loginCount: number;
        lastLogin: Date | null;
        totalActions: number;
        contentUploads: number;
        schedulesCreated: number;
        twoFactorEnabled: boolean;
    }>;
    dailyActivity: Array<{
        date: string;
        logins: number;
        failedLogins: number;
        actions: number;
    }>;
    actionBreakdown: Array<{
        action: string;
        count: number;
    }>;
}

export interface ComplianceReportData {
    securityMetrics: {
        usersWithout2FA: number;
        failedLoginsLast24h: number;
        activeSessionsCount: number;
    };
    auditSummary: {
        totalAuditLogs: number;
        criticalEvents: number;
        warningEvents: number;
        byCategory: Array<{ category: string; count: number }>;
    };
    accessControl: {
        roleDistribution: Array<{ role: string; count: number }>;
        hotelAdminCount: number;
        areaManagerCount: number;
    };
}

// ==============================================
// DISPLAY REPORTS
// ==============================================

export async function generateDisplayReport(filters: ReportFilters): Promise<DisplayReportData> {
    const { hotelId, areaId, from, to } = filters;

    // Build where clause
    const displayWhere: Record<string, unknown> = {};
    if (hotelId) displayWhere.hotelId = hotelId;
    if (areaId) displayWhere.areaId = areaId;

    // Get displays with current status
    const displays = await prisma.display.findMany({
        where: displayWhere,
        include: {
            area: { select: { id: true, name: true } },
            hotel: { select: { id: true, name: true } },
        },
    });

    // Get playback logs for period
    const playbackLogs = await prisma.playbackLog.findMany({
        where: {
            displayId: { in: displays.map((d) => d.id) },
            startedAt: { gte: from, lte: to },
        },
    });

    // Get state history for period
    const stateHistory = await prisma.displayStateHistory.findMany({
        where: {
            displayId: { in: displays.map((d) => d.id) },
            createdAt: { gte: from, lte: to },
        },
        include: {
            display: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Get content source changes for period
    const sourceChanges = await prisma.contentSourceChange.findMany({
        where: {
            displayId: { in: displays.map((d) => d.id) },
            timestamp: { gte: from, lte: to },
        },
    });

    // Calculate metrics per display
    const displayMetrics = displays.map((display) => {
        const displayPlayback = playbackLogs.filter((p) => p.displayId === display.id);
        const displayStateChanges = stateHistory.filter((s) => s.displayId === display.id);
        const displaySourceChanges = sourceChanges.filter((s) => s.displayId === display.id);

        const totalPlaybackSeconds = displayPlayback.reduce((sum, p) => sum + (p.duration || 0), 0);
        const errorCount = displayStateChanges.filter((s) => s.toStatus === 'ERROR').length;

        // Calculate uptime (simplified)
        const onlineChanges = displayStateChanges.filter((s) => s.toStatus === 'ONLINE').length;
        const offlineChanges = displayStateChanges.filter((s) => s.toStatus === 'OFFLINE').length;
        const uptimePercent =
            onlineChanges + offlineChanges > 0
                ? Math.min(100, (onlineChanges / Math.max(1, onlineChanges + offlineChanges)) * 100)
                : display.status === 'ONLINE'
                    ? 100
                    : 0;

        return {
            id: display.id,
            name: display.name,
            location: display.location || 'Unknown',
            areaName: display.area?.name || 'Unassigned',
            hotelName: display.hotel?.name || 'Unknown',
            status: display.status,
            uptimePercent: Math.round(uptimePercent),
            totalPlaybackHours: Math.round((totalPlaybackSeconds / 3600) * 10) / 10,
            contentChanges: displaySourceChanges.length,
            errorCount,
            lastSeen: display.lastSeen,
        };
    });

    // Calculate daily activity
    const dailyMap = new Map<string, { online: number; offline: number; error: number; playback: number }>();

    stateHistory.forEach((state) => {
        const dateKey = state.createdAt.toISOString().split('T')[0] as string;
        const current = dailyMap.get(dateKey) || { online: 0, offline: 0, error: 0, playback: 0 };
        if (state.toStatus === 'ONLINE') current.online++;
        else if (state.toStatus === 'OFFLINE') current.offline++;
        else if (state.toStatus === 'ERROR') current.error++;
        dailyMap.set(dateKey, current);
    });

    playbackLogs.forEach((playback) => {
        const dateKey = playback.startedAt.toISOString().split('T')[0] as string;
        const current = dailyMap.get(dateKey) || { online: 0, offline: 0, error: 0, playback: 0 };
        current.playback += (playback.duration || 0) / 3600;
        dailyMap.set(dateKey, current);
    });

    const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
            date,
            onlineCount: data.online,
            offlineCount: data.offline,
            errorCount: data.error,
            playbackHours: Math.round(data.playback * 10) / 10,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Summary
    const summary = {
        totalDisplays: displays.length,
        activeDisplays: displays.filter((d) => d.status === 'ONLINE').length,
        offlineDisplays: displays.filter((d) => d.status === 'OFFLINE').length,
        errorDisplays: displays.filter((d) => d.status === 'ERROR').length,
        avgUptimePercent: Math.round(
            displayMetrics.reduce((sum, d) => sum + d.uptimePercent, 0) / Math.max(1, displayMetrics.length)
        ),
        totalPlaybackHours:
            Math.round(displayMetrics.reduce((sum, d) => sum + d.totalPlaybackHours, 0) * 10) / 10,
    };

    return {
        summary,
        displayMetrics,
        dailyActivity,
        statusHistory: stateHistory.slice(0, 500).map((s) => ({
            displayId: s.displayId,
            displayName: s.display.name,
            timestamp: s.createdAt,
            fromStatus: s.fromStatus,
            toStatus: s.toStatus,
            trigger: s.trigger,
            errorMessage: s.errorMessage,
        })),
    };
}

// ==============================================
// USER REPORTS
// ==============================================

export async function generateUserReport(filters: ReportFilters): Promise<UserReportData> {
    const { hotelId, from, to } = filters;

    const userWhere: Record<string, unknown> = {};
    if (hotelId) userWhere.hotelId = hotelId;

    // Get users
    const users = await prisma.user.findMany({
        where: userWhere,
        include: {
            hotel: { select: { name: true } },
            area: { select: { name: true } },
        },
    });

    // Get activity logs for period
    const activityLogs = await prisma.userActivityLog.findMany({
        where: {
            userId: { in: users.map((u) => u.id) },
            createdAt: { gte: from, lte: to },
        },
    });

    // Calculate user metrics
    const userMetrics = users.map((user) => {
        const userActivity = activityLogs.filter((a) => a.userId === user.id);
        const logins = userActivity.filter((a) => a.action === 'LOGIN');
        const uploads = userActivity.filter((a) => a.action === 'CONTENT_UPLOAD');
        const schedules = userActivity.filter((a) => a.action === 'SCHEDULE_CREATE');

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hotelName: user.hotel?.name || null,
            areaName: user.area?.name || null,
            loginCount: logins.length,
            lastLogin: logins.length > 0 && logins[0] ? logins[0].createdAt : null,
            totalActions: userActivity.length,
            contentUploads: uploads.length,
            schedulesCreated: schedules.length,
            twoFactorEnabled: user.twoFactorEnabled,
        };
    });

    // Daily activity
    const dailyMap = new Map<string, { logins: number; failed: number; actions: number }>();

    activityLogs.forEach((activity) => {
        const dateKey = activity.createdAt.toISOString().split('T')[0] as string;
        const current = dailyMap.get(dateKey) || { logins: 0, failed: 0, actions: 0 };
        current.actions++;
        if (activity.action === 'LOGIN') current.logins++;
        if (activity.action === 'LOGIN_FAILED') current.failed++;
        dailyMap.set(dateKey, current);
    });

    const dailyActivity = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
            date,
            logins: data.logins,
            failedLogins: data.failed,
            actions: data.actions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Action breakdown
    const actionMap = new Map<string, number>();
    activityLogs.forEach((a) => {
        actionMap.set(a.action, (actionMap.get(a.action) || 0) + 1);
    });

    const actionBreakdown = Array.from(actionMap.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);

    // Summary
    const summary = {
        totalUsers: users.length,
        activeUsers: userMetrics.filter((u) => u.totalActions > 0).length,
        totalLogins: activityLogs.filter((a) => a.action === 'LOGIN').length,
        failedLogins: activityLogs.filter((a) => a.action === 'LOGIN_FAILED').length,
        totalActions: activityLogs.length,
        usersWithout2FA: users.filter((u) => !u.twoFactorEnabled).length,
    };

    return {
        summary,
        userMetrics,
        dailyActivity,
        actionBreakdown,
    };
}

// ==============================================
// COMPLIANCE REPORTS
// ==============================================

export async function generateComplianceReport(filters: ReportFilters): Promise<ComplianceReportData> {
    const { hotelId, from, to } = filters;

    const whereHotel = hotelId ? { hotelId } : {};

    // Security metrics
    const [usersWithout2FA, failedLogins24h, activeSessions, users] = await Promise.all([
        prisma.user.count({ where: { ...whereHotel, twoFactorEnabled: false } }),
        prisma.userActivityLog.count({
            where: {
                action: 'LOGIN_FAILED',
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.sessionLog.count({ where: { ...whereHotel, status: 'ACTIVE' } }),
        prisma.user.findMany({ where: whereHotel, select: { role: true } }),
    ]);

    // Audit summary
    const [totalAuditLogs, criticalEvents, warningEvents, byCategory] = await Promise.all([
        prisma.auditLog.count({ where: { ...whereHotel, createdAt: { gte: from, lte: to } } }),
        prisma.auditLog.count({
            where: { ...whereHotel, createdAt: { gte: from, lte: to }, severity: 'CRITICAL' },
        }),
        prisma.auditLog.count({
            where: { ...whereHotel, createdAt: { gte: from, lte: to }, severity: 'WARNING' },
        }),
        prisma.auditLog.groupBy({
            by: ['category'],
            where: { ...whereHotel, createdAt: { gte: from, lte: to } },
            _count: { id: true },
        }),
    ]);

    // Role distribution
    const roleDistribution = users.reduce(
        (acc, user) => {
            const existing = acc.find((r) => r.role === user.role);
            if (existing) existing.count++;
            else acc.push({ role: user.role, count: 1 });
            return acc;
        },
        [] as Array<{ role: string; count: number }>
    );

    return {
        securityMetrics: {
            usersWithout2FA,
            failedLoginsLast24h: failedLogins24h,
            activeSessionsCount: activeSessions,
        },
        auditSummary: {
            totalAuditLogs,
            criticalEvents,
            warningEvents,
            byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
        },
        accessControl: {
            roleDistribution,
            hotelAdminCount: roleDistribution.find((r) => r.role === 'HOTEL_ADMIN')?.count || 0,
            areaManagerCount: roleDistribution.find((r) => r.role === 'AREA_MANAGER')?.count || 0,
        },
    };
}

// ==============================================
// EXCEL EXPORT
// ==============================================

export async function generateDisplayReportExcel(
    data: DisplayReportData,
    filters: ReportFilters
): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'Signage System';
    workbook.created = new Date();

    // Colors
    const headerBg = 'FF254D6E';
    const headerFont = 'FFFFFFFF';
    const successBg = 'FF4CAF50';
    const warningBg = 'FFFFC107';
    const errorBg = 'FFF44336';

    // ========== Sheet 1: Summary ==========
    const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: '254D6E' } },
    });

    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    summarySheet.addRow({
        metric: 'Report Period',
        value: `${filters.from.toLocaleDateString()} - ${filters.to.toLocaleDateString()}`,
    });
    summarySheet.addRow({ metric: 'Total Displays', value: data.summary.totalDisplays });
    summarySheet.addRow({ metric: 'Active Displays', value: data.summary.activeDisplays });
    summarySheet.addRow({ metric: 'Offline Displays', value: data.summary.offlineDisplays });
    summarySheet.addRow({ metric: 'Error Displays', value: data.summary.errorDisplays });
    summarySheet.addRow({ metric: 'Average Uptime %', value: `${data.summary.avgUptimePercent}%` });
    summarySheet.addRow({ metric: 'Total Playback Hours', value: data.summary.totalPlaybackHours });

    // ========== Sheet 2: Display Details ==========
    const detailsSheet = workbook.addWorksheet('Display Details');

    detailsSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Area', key: 'areaName', width: 15 },
        { header: 'Hotel', key: 'hotelName', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Uptime %', key: 'uptimePercent', width: 12 },
        { header: 'Playback Hours', key: 'totalPlaybackHours', width: 15 },
        { header: 'Content Changes', key: 'contentChanges', width: 15 },
        { header: 'Errors', key: 'errorCount', width: 10 },
        { header: 'Last Seen', key: 'lastSeen', width: 20 },
    ];

    detailsSheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    data.displayMetrics.forEach((display) => {
        const row = detailsSheet.addRow({
            ...display,
            lastSeen: display.lastSeen ? display.lastSeen.toLocaleString() : 'Never',
        });

        // Color status cell
        const statusCell = row.getCell('status');
        if (display.status === 'ONLINE') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: successBg } };
        } else if (display.status === 'OFFLINE') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: warningBg } };
        } else if (display.status === 'ERROR') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: errorBg } };
        }

        // Color uptime cell
        const uptimeCell = row.getCell('uptimePercent');
        if (display.uptimePercent >= 95) {
            uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: successBg } };
        } else if (display.uptimePercent >= 80) {
            uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: warningBg } };
        } else {
            uptimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: errorBg } };
        }
    });

    detailsSheet.autoFilter = 'A1:J1';

    // ========== Sheet 3: Daily Activity ==========
    const dailySheet = workbook.addWorksheet('Daily Activity');

    dailySheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Online Events', key: 'onlineCount', width: 15 },
        { header: 'Offline Events', key: 'offlineCount', width: 15 },
        { header: 'Error Events', key: 'errorCount', width: 15 },
        { header: 'Playback Hours', key: 'playbackHours', width: 15 },
    ];

    dailySheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    data.dailyActivity.forEach((day) => {
        dailySheet.addRow(day);
    });

    // ========== Sheet 4: Status History ==========
    const historySheet = workbook.addWorksheet('Status History');

    historySheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Display', key: 'displayName', width: 25 },
        { header: 'From Status', key: 'fromStatus', width: 12 },
        { header: 'To Status', key: 'toStatus', width: 12 },
        { header: 'Trigger', key: 'trigger', width: 20 },
        { header: 'Error Message', key: 'errorMessage', width: 40 },
    ];

    historySheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    data.statusHistory.forEach((event) => {
        historySheet.addRow({
            ...event,
            timestamp: event.timestamp.toLocaleString(),
            fromStatus: event.fromStatus || 'N/A',
            errorMessage: event.errorMessage || '',
        });
    });

    historySheet.autoFilter = 'A1:F1';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function generateUserReportExcel(
    data: UserReportData,
    filters: ReportFilters
): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'Signage System';
    workbook.created = new Date();

    const headerBg = 'FF254D6E';
    const headerFont = 'FFFFFFFF';

    // ========== Sheet 1: Summary ==========
    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    summarySheet.addRow({
        metric: 'Report Period',
        value: `${filters.from.toLocaleDateString()} - ${filters.to.toLocaleDateString()}`,
    });
    summarySheet.addRow({ metric: 'Total Users', value: data.summary.totalUsers });
    summarySheet.addRow({ metric: 'Active Users', value: data.summary.activeUsers });
    summarySheet.addRow({ metric: 'Total Logins', value: data.summary.totalLogins });
    summarySheet.addRow({ metric: 'Failed Logins', value: data.summary.failedLogins });
    summarySheet.addRow({ metric: 'Total Actions', value: data.summary.totalActions });
    summarySheet.addRow({ metric: 'Users without 2FA', value: data.summary.usersWithout2FA });

    // ========== Sheet 2: User Details ==========
    const detailsSheet = workbook.addWorksheet('User Details');

    detailsSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Hotel', key: 'hotelName', width: 20 },
        { header: 'Area', key: 'areaName', width: 15 },
        { header: 'Logins', key: 'loginCount', width: 10 },
        { header: 'Actions', key: 'totalActions', width: 10 },
        { header: 'Uploads', key: 'contentUploads', width: 10 },
        { header: 'Schedules', key: 'schedulesCreated', width: 12 },
        { header: '2FA', key: 'twoFactorEnabled', width: 8 },
    ];

    detailsSheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    data.userMetrics.forEach((user) => {
        const row = detailsSheet.addRow({
            ...user,
            hotelName: user.hotelName || 'N/A',
            areaName: user.areaName || 'N/A',
            twoFactorEnabled: user.twoFactorEnabled ? 'Yes' : 'No',
        });

        // Highlight users without 2FA
        if (!user.twoFactorEnabled) {
            row.getCell('twoFactorEnabled').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC107' },
            };
        }
    });

    detailsSheet.autoFilter = 'A1:J1';

    // ========== Sheet 3: Action Breakdown ==========
    const actionsSheet = workbook.addWorksheet('Action Breakdown');

    actionsSheet.columns = [
        { header: 'Action', key: 'action', width: 25 },
        { header: 'Count', key: 'count', width: 15 },
    ];

    actionsSheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.font = { color: { argb: headerFont }, bold: true };
    });

    data.actionBreakdown.forEach((action) => {
        actionsSheet.addRow(action);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export default {
    generateDisplayReport,
    generateUserReport,
    generateComplianceReport,
    generateDisplayReportExcel,
    generateUserReportExcel,
};
