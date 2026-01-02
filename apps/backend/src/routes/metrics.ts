/**
 * Metrics Routes
 * Exposes Prometheus metrics endpoint
 */

import { Router, Request, Response } from 'express';
import { getMetrics, getMetricsContentType } from '../services/metricsService';

const router: Router = Router();

/**
 * GET /api/metrics
 * Prometheus metrics endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const metrics = await getMetrics();
        const contentType = await getMetricsContentType();

        res.set('Content-Type', contentType);
        res.send(metrics);
    } catch (error) {
        res.status(500).send('Error collecting metrics');
    }
});

export default router;
