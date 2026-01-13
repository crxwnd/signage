/**
 * Display Routes
 * HTTP routes for display management
 *
 * SECURITY: Most routes are protected by authentication middleware
 * EXCEPTION: /:id/playlist and /:id/current-source are PUBLIC for SmartTV displays
 * 
 * ROUTE ORDER: Static paths MUST come before dynamic /:id paths
 * Otherwise Express will interpret "confirm-pairing" as an :id value
 */

import { Router, type Router as ExpressRouter, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as displaysController from '../controllers/displaysController';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { contentResolver } from '../services/contentResolver';

const router: ExpressRouter = Router();

// ==============================================
// AUTHENTICATED STATIC ROUTES (BEFORE :id routes)
// confirm-pairing MUST be here, NOT after /:id routes
// ==============================================

/**
 * POST /api/displays/confirm-pairing
 * Admin confirms pairing code to link display to a displayId
 * 
 * CRITICAL: This route MUST be defined BEFORE any /:id routes
 * Otherwise "confirm-pairing" gets interpreted as an :id value
 */
router.post('/confirm-pairing', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, displayId } = req.body;

        log.info('[Pairing] Confirm pairing request', { code, displayId });

        if (!code || !displayId) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Code and displayId are required' }
            });
            return;
        }

        // Import socket manager functions
        const socketManager = await import('../socket/socketManager');

        // Get pairing data
        const pairingData = socketManager.getPairingData(code);

        if (!pairingData) {
            log.warn('[Pairing] Invalid or expired code', { code });
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Invalid or expired pairing code' }
            });
            return;
        }

        // Verify display exists
        const display = await prisma.display.findUnique({
            where: { id: displayId },
        });

        if (!display) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Display not found' }
            });
            return;
        }

        // Update display
        await prisma.display.update({
            where: { id: displayId },
            data: {
                pairedAt: new Date(),
                pairingCode: null,
                status: 'ONLINE',
            },
        });

        // Notify the display via socket
        const io = socketManager.getIO();
        if (io) {
            io.to(pairingData.socketId).emit('pairing:confirmed' as any, { displayId });
            log.info('[Pairing] Confirmed successfully', { displayId, socketId: pairingData.socketId });
        }

        // Clean up pairing code
        socketManager.deletePairingCode(code);

        res.json({
            success: true,
            data: { displayId, message: 'Display paired successfully' }
        });
    } catch (error) {
        log.error('[Pairing] Error confirming pairing', { error });
        next(error);
    }
});

// ==============================================
// PUBLIC ROUTES WITH :id (No authentication)
// These are for SmartTV displays that don't have user sessions
// ==============================================

/**
 * GET /api/displays/:id/current-source
 * PUBLIC endpoint for displays to get their current content source
 * Returns the highest priority content source (alert > sync > schedule > playlist > fallback)
 */
router.get('/:id/current-source', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Display ID required' });
        }

        const source = await contentResolver.resolve(id);

        // Update lastSeen for this display
        await prisma.display.update({
            where: { id },
            data: { lastSeen: new Date() },
        }).catch(() => {
            // Ignore if display doesn't exist
        });

        log.debug('Display current-source fetched', { displayId: id, type: source.type });

        res.json({
            success: true,
            data: source,
        });
    } catch (error) {
        log.error('Error fetching display current-source', { error });
        next(error);
    }
});

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

/**
 * POST /api/displays/:id/quick-url
 * Quick play content from URL directly on display (temporary content)
 * Content will loop automatically and be logged
 */
router.post('/:id/quick-url', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { url, source, type, thumbnailUrl, loop = true } = req.body;
        const user = (req as any).user;

        if (!url || !source || !type) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'url, source, and type are required' }
            });
        }

        // Verify display exists
        const display = await prisma.display.findUnique({
            where: { id },
            select: { id: true, name: true, hotelId: true },
        });

        if (!display) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Display not found' }
            });
        }

        // Log the quick URL playback
        await prisma.playbackLog.create({
            data: {
                displayId: display.id,
                sourceType: 'QUICK_URL',
                sourceId: null,
                contentId: `quick-url-${Date.now()}`,
                startedAt: new Date(),
                hotelId: display.hotelId,
            }
        });

        // Emit socket event to display to play the URL
        const socketManager = await import('../socket/socketManager');
        const io = socketManager.getIO();

        if (io) {
            io.to(`display:${id}`).emit('quick-play' as any, {
                type: 'QUICK_URL',
                url,
                source,
                contentType: type,
                thumbnailUrl,
                loop,
            });

            log.info('Quick URL sent to display', { displayId: id, url, source, type, userId: user?.userId });
        }

        res.json({
            success: true,
            message: `Content sent to ${display.name}`,
            data: { displayId: id, url, source, type, loop }
        });
    } catch (error) {
        log.error('Error sending quick URL to display', { error });
        next(error);
    }
});

export default router;

