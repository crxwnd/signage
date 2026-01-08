/**
 * Report Routes
 * Endpoints for generating and exporting reports
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import * as reportService from '../services/reportService';
import * as auditService from '../services/auditService';
import { log } from '../middleware/logger';

const router: Router = Router();

router.use(authenticate);

// ==============================================
// DISPLAY REPORTS
// ==============================================

/**
 * GET /api/reports/displays
 * Get display report data
 */
router.get(
    '/displays',
    requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']),
    async (req: Request, res: Response) => {
        try {
            const user = req.user!;

            // Parse filters
            const hotelId =
                user.role === 'SUPER_ADMIN' ? (req.query.hotelId as string) : user.hotelId || undefined;

            const areaId =
                user.role === 'AREA_MANAGER' ? user.areaId || undefined : (req.query.areaId as string);

            const from = req.query.from
                ? new Date(req.query.from as string)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

            const to = req.query.to ? new Date(req.query.to as string) : new Date();

            const data = await reportService.generateDisplayReport({
                hotelId,
                areaId,
                from,
                to,
            });

            // Log report generation
            await auditService.createAuditLog({
                userId: user.userId,
                action: 'VIEW',
                category: 'SYSTEM',
                resource: 'report',
                resourceName: 'Display Report',
                description: `Generated display report for period ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`,
                hotelId,
                req,
            });

            res.json({ success: true, data });
        } catch (error) {
            log.error('Failed to generate display report', { error });
            res.status(500).json({ success: false, error: 'Failed to generate report' });
        }
    }
);

/**
 * GET /api/reports/displays/export
 * Export display report to Excel
 */
router.get(
    '/displays/export',
    requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const user = req.user!;

            const hotelId =
                user.role === 'SUPER_ADMIN' ? (req.query.hotelId as string) : user.hotelId || undefined;

            const areaId = req.query.areaId as string;

            const from = req.query.from
                ? new Date(req.query.from as string)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const to = req.query.to ? new Date(req.query.to as string) : new Date();

            const filters = { hotelId, areaId, from, to };
            const data = await reportService.generateDisplayReport(filters);
            const buffer = await reportService.generateDisplayReportExcel(data, filters);

            // Log export
            await auditService.createAuditLog({
                userId: user.userId,
                action: 'EXPORT',
                category: 'SYSTEM',
                resource: 'report',
                resourceName: 'Display Report Excel',
                description: `Exported display report to Excel`,
                hotelId,
                req,
            });

            const filename = `display-report-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.xlsx`;

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        } catch (error) {
            log.error('Failed to export display report', { error });
            res.status(500).json({ success: false, error: 'Failed to export report' });
        }
    }
);

// ==============================================
// USER REPORTS
// ==============================================

/**
 * GET /api/reports/users
 * Get user report data
 */
router.get(
    '/users',
    requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const user = req.user!;

            const hotelId =
                user.role === 'SUPER_ADMIN' ? (req.query.hotelId as string) : user.hotelId || undefined;

            const from = req.query.from
                ? new Date(req.query.from as string)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const to = req.query.to ? new Date(req.query.to as string) : new Date();

            const data = await reportService.generateUserReport({
                hotelId,
                from,
                to,
            });

            await auditService.createAuditLog({
                userId: user.userId,
                action: 'VIEW',
                category: 'SYSTEM',
                resource: 'report',
                resourceName: 'User Report',
                description: `Generated user report`,
                hotelId,
                req,
            });

            res.json({ success: true, data });
        } catch (error) {
            log.error('Failed to generate user report', { error });
            res.status(500).json({ success: false, error: 'Failed to generate report' });
        }
    }
);

/**
 * GET /api/reports/users/export
 * Export user report to Excel
 */
router.get(
    '/users/export',
    requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const user = req.user!;

            const hotelId =
                user.role === 'SUPER_ADMIN' ? (req.query.hotelId as string) : user.hotelId || undefined;

            const from = req.query.from
                ? new Date(req.query.from as string)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const to = req.query.to ? new Date(req.query.to as string) : new Date();

            const filters = { hotelId, from, to };
            const data = await reportService.generateUserReport(filters);
            const buffer = await reportService.generateUserReportExcel(data, filters);

            await auditService.createAuditLog({
                userId: user.userId,
                action: 'EXPORT',
                category: 'SYSTEM',
                resource: 'report',
                resourceName: 'User Report Excel',
                description: `Exported user report to Excel`,
                hotelId,
                req,
            });

            const filename = `user-report-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.xlsx`;

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        } catch (error) {
            log.error('Failed to export user report', { error });
            res.status(500).json({ success: false, error: 'Failed to export report' });
        }
    }
);

// ==============================================
// COMPLIANCE REPORTS
// ==============================================

/**
 * GET /api/reports/compliance
 * Get compliance report data
 */
router.get('/compliance', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = req.user!;

        const hotelId = req.query.hotelId as string;

        const from = req.query.from
            ? new Date(req.query.from as string)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const to = req.query.to ? new Date(req.query.to as string) : new Date();

        const data = await reportService.generateComplianceReport({
            hotelId,
            from,
            to,
        });

        await auditService.createAuditLog({
            userId: user.userId,
            action: 'VIEW',
            category: 'SYSTEM',
            severity: 'WARNING',
            resource: 'report',
            resourceName: 'Compliance Report',
            description: `Generated compliance report`,
            hotelId,
            req,
        });

        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to generate compliance report', { error });
        res.status(500).json({ success: false, error: 'Failed to generate report' });
    }
});

// ==============================================
// AUDIT LOGS (accessible from reports section)
// ==============================================

/**
 * GET /api/reports/audit
 * Get audit logs with filtering
 */
router.get(
    '/audit',
    requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']),
    async (req: Request, res: Response) => {
        try {
            const user = req.user!;

            const hotelId =
                user.role === 'HOTEL_ADMIN' ? user.hotelId : (req.query.hotelId as string);

            const params = {
                hotelId: hotelId || undefined,
                areaId: req.query.areaId as string,
                userId: req.query.userId as string,
                category: req.query.category as auditService.AuditCategory,
                action: req.query.action as auditService.AuditAction,
                severity: req.query.severity as auditService.AuditSeverity,
                resourceType: req.query.resourceType as string,
                from: req.query.from ? new Date(req.query.from as string) : undefined,
                to: req.query.to ? new Date(req.query.to as string) : undefined,
                limit: parseInt(req.query.limit as string) || 100,
                offset: parseInt(req.query.offset as string) || 0,
            };

            const result = await auditService.getAuditLogs(params);

            res.json({ success: true, data: result });
        } catch (error) {
            log.error('Failed to get audit logs', { error });
            res.status(500).json({ success: false, error: 'Failed to get audit logs' });
        }
    }
);

export default router;
