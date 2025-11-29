/**
 * FFmpeg Service
 * Service for video processing, transcoding, and metadata extraction
 */

import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';
import { log } from '../middleware/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const execPromise = promisify(exec);

/**
 * Video metadata interface
 */
export interface VideoMetadata {
  duration: number; // Duration in seconds
  width: number;
  height: number;
  resolution: string; // e.g., "1920x1080"
  codec: string;
  bitrate: number; // in kbps
  fps: number;
  fileSize: number; // in bytes
}

/**
 * Check if FFmpeg is installed and accessible
 * @returns Promise<boolean> True if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execPromise('ffmpeg -version');
    const version = stdout.split('\n')[0];
    log.info('FFmpeg check successful', { version });
    return true;
  } catch (error) {
    log.error('FFmpeg not found or not accessible', { error });
    return false;
  }
}

/**
 * Get video metadata using ffprobe
 * @param filePath Path to the video file
 * @returns Promise<VideoMetadata> Video metadata
 */
export async function getVideoInfo(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    log.info('Extracting video metadata', { filePath });

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log.error('Failed to extract video metadata', { error: err, filePath });
        reject(new Error(`Failed to extract video metadata: ${err.message}`));
        return;
      }

      try {
        // Get video stream
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video'
        );

        if (!videoStream) {
          throw new Error('No video stream found in file');
        }

        // Calculate duration
        const duration = metadata.format.duration
          ? Math.floor(metadata.format.duration)
          : 0;

        // Get dimensions
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const resolution = `${width}x${height}`;

        // Get codec
        const codec = videoStream.codec_name || 'unknown';

        // Get bitrate (convert to kbps)
        const bitrate = metadata.format.bit_rate
          ? Math.floor(metadata.format.bit_rate / 1000)
          : 0;

        // Get FPS
        const fpsString = videoStream.r_frame_rate || '0/1';
        const [num, den] = fpsString.split('/').map(Number);
        const fps = den && den > 0 && num ? Math.round(num / den) : 0;

        // Get file size
        const fileSize = metadata.format.size || 0;

        const videoInfo: VideoMetadata = {
          duration,
          width,
          height,
          resolution,
          codec,
          bitrate,
          fps,
          fileSize,
        };

        log.info('Video metadata extracted successfully', {
          filePath,
          duration,
          resolution,
          codec,
          fileSize,
        });

        resolve(videoInfo);
      } catch (parseError) {
        log.error('Failed to parse video metadata', { error: parseError });
        reject(
          new Error(
            `Failed to parse video metadata: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          )
        );
      }
    });
  });
}

/**
 * Generate a thumbnail from a video
 * @param inputPath Path to the video file
 * @param outputPath Path where the thumbnail will be saved
 * @param timeOffset Time offset in seconds (default: 1 second)
 * @returns Promise<string> Path to the generated thumbnail
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timeOffset: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    log.info('Generating video thumbnail', {
      inputPath,
      outputPath,
      timeOffset,
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    fs.mkdir(outputDir, { recursive: true }).catch((err) => {
      log.warn('Failed to create output directory', { error: err });
    });

    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timeOffset],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720', // HD thumbnail
      })
      .on('end', () => {
        log.info('Thumbnail generated successfully', { outputPath });
        resolve(outputPath);
      })
      .on('error', (err) => {
        log.error('Failed to generate thumbnail', {
          error: err,
          inputPath,
          outputPath,
        });
        reject(new Error(`Failed to generate thumbnail: ${err.message}`));
      });
  });
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns Promise<boolean> True if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param filePath Path to the file
 * @returns Promise<number> File size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    log.error('Failed to get file size', { error, filePath });
    throw new Error(`Failed to get file size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
