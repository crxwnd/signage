/**
 * Upload Middleware
 * Handles file uploads with multer for content management
 */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { log } from './logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const UPLOAD_DIR = path.join(__dirname, '../../storage/uploads');

// File size limits
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

// Allowed MIME types
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov files
  'video/x-msvideo', // .avi files
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// File extensions mapping
const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * Configure multer storage
 * Generates unique filenames with timestamp + UUID
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-uuid.ext
    const timestamp = Date.now();
    const uniqueId = randomUUID();
    const ext =
      VIDEO_EXTENSIONS[file.mimetype] ||
      IMAGE_EXTENSIONS[file.mimetype] ||
      path.extname(file.originalname);

    const filename = `${timestamp}-${uniqueId}${ext}`;
    log.info('Generating upload filename', {
      originalName: file.originalname,
      newFilename: filename,
      mimetype: file.mimetype,
    });

    cb(null, filename);
  },
});

// ============================================================================
// FILE FILTER
// ============================================================================

/**
 * Filter uploaded files by type
 * Only allows videos and images
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (isVideo || isImage) {
    log.info('File type accepted', {
      filename: file.originalname,
      mimetype: file.mimetype,
      type: isVideo ? 'video' : 'image',
    });
    cb(null, true);
  } else {
    log.warn('File type rejected', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only videos (mp4, webm, mov, avi) and images (jpg, png, gif, webp) are allowed.`
      )
    );
  }
};

// ============================================================================
// MULTER CONFIGURATIONS
// ============================================================================

/**
 * Multer configuration for video uploads
 * Max size: 500 MB
 */
export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 1, // Only one file at a time
  },
});

/**
 * Multer configuration for image uploads
 * Max size: 10 MB
 */
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1, // Only one file at a time
  },
});

/**
 * Multer configuration for any content upload
 * Dynamically adjusts size limit based on file type
 */
export const uploadContent = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use max limit, will validate in controller
    files: 1,
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate file size based on type
 * Returns error message if file is too large
 */
export function validateFileSize(
  file: Express.Multer.File
): string | null {
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    const maxMB = MAX_VIDEO_SIZE / (1024 * 1024);
    return `Video file is too large. Maximum size is ${maxMB}MB.`;
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    const maxMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return `Image file is too large. Maximum size is ${maxMB}MB.`;
  }

  return null;
}

/**
 * Get content type from MIME type
 */
export function getContentTypeFromMime(
  mimetype: string
): 'VIDEO' | 'IMAGE' | null {
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) {
    return 'VIDEO';
  }
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return 'IMAGE';
  }
  return null;
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
