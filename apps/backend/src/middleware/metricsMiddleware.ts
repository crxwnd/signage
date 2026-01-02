/**
 * Metrics Middleware
 * Records HTTP request metrics for Prometheus
 */

import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from '../services/metricsService';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSeconds = durationNs / 1e9;

        // Normalize path to avoid high cardinality
        let path = req.route?.path || req.path;
        // Replace IDs with :id
        path = path.replace(/\/[a-zA-Z0-9]{20,}/g, '/:id');
        path = path.replace(/\/[0-9a-f-]{36}/g, '/:id');

        recordHttpRequest(req.method, path, res.statusCode, durationSeconds);
    });

    next();
}
