/**
 * Storage Service
 * Abstraction layer for file storage - supports both local filesystem and MinIO
 */

import fs from 'fs/promises';
import path from 'path';
import { log } from '../middleware/logger';
import minioService from './minioService';

// ==============================================
// CONFIGURATION
// ==============================================

export const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const LOCAL_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const LOCAL_PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');

// ==============================================
// INITIALIZATION
// ==============================================

/**
 * Initialize storage (ensure directories/buckets exist)
 */
export async function initializeStorage(): Promise<void> {
    if (STORAGE_MODE === 'minio') {
        try {
            await minioService.ensureBuckets();
            log.info('[Storage] MinIO storage initialized');
        } catch (error) {
            log.warn('[Storage] MinIO not available, falling back to local storage', { error });
        }
    } else {
        // Ensure local directories exist
        await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
        await fs.mkdir(path.join(LOCAL_PUBLIC_DIR, 'hls'), { recursive: true });
        await fs.mkdir(path.join(LOCAL_PUBLIC_DIR, 'thumbnails'), { recursive: true });
        log.info('[Storage] Local storage initialized');
    }
}

// ==============================================
// CONTENT OPERATIONS
// ==============================================

/**
 * Save uploaded content file
 */
export async function saveOriginalContent(
    contentId: string,
    filePath: string,
    originalName: string,
    mimeType: string
): Promise<string> {
    if (STORAGE_MODE === 'minio') {
        return minioService.uploadOriginalContent(contentId, filePath, originalName, mimeType);
    }

    // Local storage
    const ext = path.extname(originalName);
    const destDir = path.join(LOCAL_UPLOAD_DIR, contentId);
    const destPath = path.join(destDir, `original${ext}`);

    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(filePath, destPath);

    return `/uploads/${contentId}/original${ext}`;
}

/**
 * Save HLS segment
 */
export async function saveHlsSegment(
    contentId: string,
    segmentName: string,
    filePath: string
): Promise<string> {
    if (STORAGE_MODE === 'minio') {
        return minioService.uploadHlsSegment(contentId, segmentName, filePath);
    }

    // Local storage
    const destDir = path.join(LOCAL_PUBLIC_DIR, 'hls', contentId);
    const destPath = path.join(destDir, segmentName);

    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(filePath, destPath);

    return `/hls/${contentId}/${segmentName}`;
}

/**
 * Save thumbnail
 */
export async function saveThumbnail(
    contentId: string,
    filePath: string
): Promise<string> {
    if (STORAGE_MODE === 'minio') {
        return minioService.uploadThumbnail(contentId, filePath);
    }

    // Local storage
    const destDir = path.join(LOCAL_PUBLIC_DIR, 'thumbnails', contentId);
    const destPath = path.join(destDir, 'thumbnail.jpg');

    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(filePath, destPath);

    return `/thumbnails/${contentId}/thumbnail.jpg`;
}

/**
 * Delete all content files
 */
export async function deleteContentFiles(contentId: string): Promise<void> {
    if (STORAGE_MODE === 'minio') {
        await minioService.deleteContentFiles(contentId);
        return;
    }

    // Local storage
    const dirs = [
        path.join(LOCAL_UPLOAD_DIR, contentId),
        path.join(LOCAL_PUBLIC_DIR, 'hls', contentId),
        path.join(LOCAL_PUBLIC_DIR, 'thumbnails', contentId),
    ];

    for (const dir of dirs) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch {
            // Ignore if doesn't exist
        }
    }

    log.info('[Storage] Content files deleted', { contentId });
}

/**
 * Get full URL for content
 */
export function getContentUrl(relativePath: string): string {
    if (STORAGE_MODE === 'minio') {
        // MinIO URLs are already absolute
        if (relativePath.startsWith('http')) {
            return relativePath;
        }
        // Legacy local paths - convert to MinIO URL
        const minioUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
        if (relativePath.startsWith('/hls/')) {
            return `${minioUrl}/signage-hls${relativePath.replace('/hls', '')}`;
        }
        if (relativePath.startsWith('/thumbnails/')) {
            return `${minioUrl}/signage-thumbnails${relativePath.replace('/thumbnails', '')}`;
        }
        if (relativePath.startsWith('/uploads/')) {
            return `${minioUrl}/signage-uploads${relativePath.replace('/uploads', '')}`;
        }
    }

    // Local storage - return as-is (served by Express static)
    return relativePath;
}

// ==============================================
// EXPORTS
// ==============================================

export default {
    initializeStorage,
    saveOriginalContent,
    saveHlsSegment,
    saveThumbnail,
    deleteContentFiles,
    getContentUrl,
    STORAGE_MODE,
};
