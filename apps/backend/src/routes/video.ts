/**
 * Video HLS Streaming Routes
 * Serves HLS video segments and playlists
 */

import { Router, type Request, type Response, type IRouter } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { log } from '../middleware/logger';
import { config } from '../config';

const router: IRouter = Router();

/**
 * Get HLS storage path
 */
function getHLSPath(contentId: string, ...segments: string[]): string {
  return path.join(config.uploadsDir, 'hls', contentId, ...segments);
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/video/:contentId/master.m3u8
 * Serve master HLS playlist
 */
router.get('/:contentId/master.m3u8', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_ID',
          message: 'Content ID is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    log.info('Serving master playlist', { contentId });

    const playlistPath = getHLSPath(contentId, 'master.m3u8');

    // Check if file exists
    if (!(await fileExists(playlistPath))) {
      log.warn('Master playlist not found', { contentId, playlistPath });
      res.status(404).json({
        success: false,
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Master playlist not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Set appropriate headers for HLS
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Stream the file
    const fileStream = await fs.readFile(playlistPath, 'utf-8');
    res.send(fileStream);
  } catch (error) {
    log.error('Failed to serve master playlist', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to serve master playlist',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/video/:contentId/:quality/playlist.m3u8
 * Serve quality-specific playlist
 */
router.get(
  '/:contentId/:quality/playlist.m3u8',
  async (req: Request, res: Response) => {
    try {
      const { contentId, quality } = req.params;

      if (!contentId || !quality) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Content ID and quality are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate quality parameter
      const validQualities = ['360p', '720p', '1080p'];
      if (!validQualities.includes(quality)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUALITY',
            message: `Invalid quality. Must be one of: ${validQualities.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      log.info('Serving quality playlist', { contentId, quality });

      const playlistPath = getHLSPath(contentId, quality, 'playlist.m3u8');

      // Check if file exists
      if (!(await fileExists(playlistPath))) {
        log.warn('Quality playlist not found', {
          contentId,
          quality,
          playlistPath,
        });
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAYLIST_NOT_FOUND',
            message: 'Quality playlist not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Set appropriate headers for HLS
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');

      // Stream the file
      const fileStream = await fs.readFile(playlistPath, 'utf-8');
      res.send(fileStream);
    } catch (error) {
      log.error('Failed to serve quality playlist', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve quality playlist',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/video/:contentId/:quality/segment_:segmentNum.ts
 * Serve HLS video segment
 */
router.get(
  '/:contentId/:quality/segment_:segmentNum.ts',
  async (req: Request, res: Response) => {
    try {
      const { contentId, quality, segmentNum } = req.params;

      if (!contentId || !quality || !segmentNum) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Content ID, quality, and segment number are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate quality parameter
      const validQualities = ['360p', '720p', '1080p'];
      if (!validQualities.includes(quality)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUALITY',
            message: `Invalid quality. Must be one of: ${validQualities.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate segment number (should be 3 digits: 000, 001, etc.)
      if (!/^\d{3}$/.test(segmentNum)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SEGMENT',
            message: 'Invalid segment number',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      log.debug('Serving video segment', { contentId, quality, segmentNum });

      const segmentPath = getHLSPath(
        contentId,
        quality,
        `segment_${segmentNum}.ts`
      );

      // Check if file exists
      if (!(await fileExists(segmentPath))) {
        log.warn('Video segment not found', {
          contentId,
          quality,
          segmentNum,
          segmentPath,
        });
        res.status(404).json({
          success: false,
          error: {
            code: 'SEGMENT_NOT_FOUND',
            message: 'Video segment not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Set appropriate headers for video segments
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache segments for 1 year
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');

      // Get file size for Content-Length header
      const stats = await fs.stat(segmentPath);
      res.setHeader('Content-Length', stats.size);

      // Stream the segment file
      const fileBuffer = await fs.readFile(segmentPath);
      res.send(fileBuffer);
    } catch (error) {
      log.error('Failed to serve video segment', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve video segment',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * OPTIONS requests for CORS preflight
 */
router.options('*', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(204).send();
});

export default router;
