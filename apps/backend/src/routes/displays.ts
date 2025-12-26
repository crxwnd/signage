/**
 * Display Routes
 * HTTP routes for display management
 *
 * SECURITY: Most routes are protected by authentication middleware
 * EXCEPTION: /:id/playlist is PUBLIC for SmartTV displays
 */

import { Router, type Router as ExpressRouter, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as displaysController from '../controllers/displaysController';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

const router: ExpressRouter = Router();

// ==============================================
// PUBLIC ROUTES (No authentication required)
// These are for SmartTV displays that don't have user sessions
// ==============================================

/**
 * GET /api/displays/:id/playlist
 * PUBLIC endpoint for SmartTV displays to get their content
 * No authentication required - display identifies by ID
 */
router.get('/:id/playlist', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Verify display exists
        const display = await prisma.display.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                status: true,
                hotelId: true,
            },
        });

        if (!display) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Display not found' }
            });
            return;
        }

        // Get playlist for this display
        const playlist = await prisma.displayContent.findMany({
            where: { displayId: id },
            include: {
                content: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        hlsUrl: true,
                        originalUrl: true,
                        thumbnailUrl: true,
                        duration: true,
                        status: true,
                    },
                },
            },
            orderBy: { order: 'asc' },
        });

        // Filter only READY content
        const items = playlist.filter(item => item.content.status === 'READY');

        // Update lastSeen for this display
        await prisma.display.update({
            where: { id },
            data: { lastSeen: new Date() },
        });

        log.info('Display playlist fetched (public)', { displayId: id, itemCount: items.length });

        res.json({
            success: true,
            data: {
                displayId: id,
                displayName: display.name,
                items: items.map(item => ({
                    id: item.id,
                    order: item.order,
                    content: item.content,
                })),
            },
        });
    } catch (error) {
        log.error('Error fetching display playlist', { error });
        next(error);
    }
});

// ==============================================
// PROTECTED ROUTES (Authentication required)
// ==============================================
router.use(authenticate);

/**
 * GET /api/displays/stats
 * Get display statistics
 */
router.get('/stats', displaysController.getDisplayStats);

/**
 * GET /api/displays
 * Get all displays with optional filtering
 */
router.get('/', displaysController.getDisplays);

/**
 * GET /api/displays/:id
 * Get display by ID
 */
router.get('/:id', displaysController.getDisplayById);

/**
 * POST /api/displays
 * Create new display
 */
router.post('/', displaysController.createDisplay);

/**
 * PATCH /api/displays/:id
 * Update display
 */
router.patch('/:id', displaysController.updateDisplay);

/**
 * DELETE /api/displays/:id
 * Delete display
 */
router.delete('/:id', displaysController.deleteDisplay);

export default router;
