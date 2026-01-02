/**
 * MinIO Service
 * Handles file storage operations with MinIO object storage
 */

import { Client } from 'minio';
import { Readable } from 'stream';
import path from 'path';
import { log } from '../middleware/logger';

// ==============================================
// CONFIGURATION
// ==============================================

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';

// Bucket names
export const BUCKETS = {
    UPLOADS: 'signage-uploads',
    HLS: 'signage-hls',
    THUMBNAILS: 'signage-thumbnails',
} as const;

// Public URL base (for client access)
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || `http://${MINIO_ENDPOINT}:${MINIO_PORT}`;

// ==============================================
// CLIENT INITIALIZATION
// ==============================================

let minioClient: Client | null = null;

/**
 * Get or create MinIO client
 */
export function getMinioClient(): Client {
    if (!minioClient) {
        minioClient = new Client({
            endPoint: MINIO_ENDPOINT,
            port: MINIO_PORT,
            useSSL: MINIO_USE_SSL,
            accessKey: MINIO_ACCESS_KEY,
            secretKey: MINIO_SECRET_KEY,
        });
        log.info('[MinIO] Client initialized', { endpoint: MINIO_ENDPOINT, port: MINIO_PORT });
    }
    return minioClient;
}

// ==============================================
// BUCKET OPERATIONS
// ==============================================

/**
 * Ensure all required buckets exist
 */
export async function ensureBuckets(): Promise<void> {
    const client = getMinioClient();

    for (const bucket of Object.values(BUCKETS)) {
        try {
            const exists = await client.bucketExists(bucket);
            if (!exists) {
                await client.makeBucket(bucket);
                log.info('[MinIO] Bucket created', { bucket });

                // Set public policy for HLS and thumbnails
                if (bucket === BUCKETS.HLS || bucket === BUCKETS.THUMBNAILS) {
                    const policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: ['s3:GetObject'],
                                Resource: [`arn:aws:s3:::${bucket}/*`],
                            },
                        ],
                    };
                    await client.setBucketPolicy(bucket, JSON.stringify(policy));
                    log.info('[MinIO] Public policy set', { bucket });
                }
            }
        } catch (error) {
            log.error('[MinIO] Failed to ensure bucket', { bucket, error });
            throw error;
        }
    }
}

// ==============================================
// FILE OPERATIONS
// ==============================================

/**
 * Upload file to MinIO
 */
export async function uploadFile(
    bucket: string,
    objectName: string,
    filePath: string,
    contentType?: string
): Promise<string> {
    const client = getMinioClient();

    const metaData = contentType ? { 'Content-Type': contentType } : {};

    await client.fPutObject(bucket, objectName, filePath, metaData);

    log.info('[MinIO] File uploaded', { bucket, objectName });

    return getPublicUrl(bucket, objectName);
}

/**
 * Upload buffer to MinIO
 */
export async function uploadBuffer(
    bucket: string,
    objectName: string,
    buffer: Buffer,
    contentType?: string
): Promise<string> {
    const client = getMinioClient();

    const metaData = contentType ? { 'Content-Type': contentType } : {};

    await client.putObject(bucket, objectName, buffer, buffer.length, metaData);

    log.info('[MinIO] Buffer uploaded', { bucket, objectName, size: buffer.length });

    return getPublicUrl(bucket, objectName);
}

/**
 * Upload stream to MinIO
 */
export async function uploadStream(
    bucket: string,
    objectName: string,
    stream: Readable,
    size?: number,
    contentType?: string
): Promise<string> {
    const client = getMinioClient();

    const metaData = contentType ? { 'Content-Type': contentType } : {};

    await client.putObject(bucket, objectName, stream, size, metaData);

    log.info('[MinIO] Stream uploaded', { bucket, objectName });

    return getPublicUrl(bucket, objectName);
}

/**
 * Download file from MinIO
 */
export async function downloadFile(
    bucket: string,
    objectName: string,
    destPath: string
): Promise<void> {
    const client = getMinioClient();

    await client.fGetObject(bucket, objectName, destPath);

    log.info('[MinIO] File downloaded', { bucket, objectName, destPath });
}

/**
 * Get file as stream from MinIO
 */
export async function getFileStream(
    bucket: string,
    objectName: string
): Promise<Readable> {
    const client = getMinioClient();

    return client.getObject(bucket, objectName);
}

/**
 * Delete file from MinIO
 */
export async function deleteFile(bucket: string, objectName: string): Promise<void> {
    const client = getMinioClient();

    await client.removeObject(bucket, objectName);

    log.info('[MinIO] File deleted', { bucket, objectName });
}

/**
 * Delete multiple files from MinIO
 */
export async function deleteFiles(bucket: string, objectNames: string[]): Promise<void> {
    const client = getMinioClient();

    await client.removeObjects(bucket, objectNames);

    log.info('[MinIO] Files deleted', { bucket, count: objectNames.length });
}

/**
 * Delete all files with prefix (folder)
 */
export async function deleteFolder(bucket: string, prefix: string): Promise<void> {
    const client = getMinioClient();

    const objectsList: string[] = [];
    const stream = client.listObjects(bucket, prefix, true);

    for await (const obj of stream) {
        if (obj.name) {
            objectsList.push(obj.name);
        }
    }

    if (objectsList.length > 0) {
        await client.removeObjects(bucket, objectsList);
        log.info('[MinIO] Folder deleted', { bucket, prefix, count: objectsList.length });
    }
}

/**
 * Check if file exists
 */
export async function fileExists(bucket: string, objectName: string): Promise<boolean> {
    const client = getMinioClient();

    try {
        await client.statObject(bucket, objectName);
        return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

/**
 * Get file info
 */
export async function getFileInfo(bucket: string, objectName: string): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
} | null> {
    const client = getMinioClient();

    try {
        const stat = await client.statObject(bucket, objectName);
        return {
            size: stat.size,
            lastModified: stat.lastModified,
            contentType: stat.metaData?.['content-type'],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'NotFound') {
            return null;
        }
        throw error;
    }
}

/**
 * List files in bucket with prefix
 */
export async function listFiles(bucket: string, prefix?: string): Promise<string[]> {
    const client = getMinioClient();

    const files: string[] = [];
    const stream = client.listObjects(bucket, prefix || '', true);

    for await (const obj of stream) {
        if (obj.name) {
            files.push(obj.name);
        }
    }

    return files;
}

// ==============================================
// URL GENERATION
// ==============================================

/**
 * Get public URL for an object
 */
export function getPublicUrl(bucket: string, objectName: string): string {
    return `${MINIO_PUBLIC_URL}/${bucket}/${objectName}`;
}

/**
 * Get presigned URL for temporary access (uploads)
 */
export async function getPresignedUploadUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600
): Promise<string> {
    const client = getMinioClient();

    return client.presignedPutObject(bucket, objectName, expirySeconds);
}

/**
 * Get presigned URL for downloads (private buckets)
 */
export async function getPresignedDownloadUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600
): Promise<string> {
    const client = getMinioClient();

    return client.presignedGetObject(bucket, objectName, expirySeconds);
}

// ==============================================
// CONTENT-SPECIFIC HELPERS
// ==============================================

/**
 * Upload original content file
 */
export async function uploadOriginalContent(
    contentId: string,
    filePath: string,
    originalName: string,
    mimeType: string
): Promise<string> {
    const ext = path.extname(originalName);
    const objectName = `${contentId}/original${ext}`;

    return uploadFile(BUCKETS.UPLOADS, objectName, filePath, mimeType);
}

/**
 * Upload HLS segment
 */
export async function uploadHlsSegment(
    contentId: string,
    segmentName: string,
    filePath: string
): Promise<string> {
    const objectName = `${contentId}/${segmentName}`;
    const contentType = segmentName.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/mp2t';

    return uploadFile(BUCKETS.HLS, objectName, filePath, contentType);
}

/**
 * Upload thumbnail
 */
export async function uploadThumbnail(
    contentId: string,
    filePath: string
): Promise<string> {
    const objectName = `${contentId}/thumbnail.jpg`;

    return uploadFile(BUCKETS.THUMBNAILS, objectName, filePath, 'image/jpeg');
}

/**
 * Delete all content files (original + HLS + thumbnail)
 */
export async function deleteContentFiles(contentId: string): Promise<void> {
    await Promise.all([
        deleteFolder(BUCKETS.UPLOADS, `${contentId}/`),
        deleteFolder(BUCKETS.HLS, `${contentId}/`),
        deleteFolder(BUCKETS.THUMBNAILS, `${contentId}/`),
    ]);

    log.info('[MinIO] Content files deleted', { contentId });
}

// ==============================================
// EXPORTS
// ==============================================

export default {
    getMinioClient,
    ensureBuckets,
    uploadFile,
    uploadBuffer,
    uploadStream,
    downloadFile,
    getFileStream,
    deleteFile,
    deleteFiles,
    deleteFolder,
    fileExists,
    getFileInfo,
    listFiles,
    getPublicUrl,
    getPresignedUploadUrl,
    getPresignedDownloadUrl,
    uploadOriginalContent,
    uploadHlsSegment,
    uploadThumbnail,
    deleteContentFiles,
    BUCKETS,
};
