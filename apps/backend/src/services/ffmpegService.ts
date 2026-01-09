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
  aspectRatio: string; // e.g., "16:9", "9:16"
  orientation: 'horizontal' | 'vertical' | 'square';
  codec: string;
  bitrate: number; // in kbps
  fps: number;
  fileSize: number; // in bytes
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (width === 0 || height === 0) return 'unknown';

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  // Check for common ratios
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.01) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.01) return '3:4';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9';

  return `${ratioWidth}:${ratioHeight}`;
}

/**
 * Determine orientation from dimensions
 */
export function getOrientation(width: number, height: number): 'horizontal' | 'vertical' | 'square' {
  if (width > height) return 'horizontal';
  if (height > width) return 'vertical';
  return 'square';
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
export function getVideoInfo(filePath: string): Promise<VideoMetadata> {
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
        const aspectRatio = calculateAspectRatio(width, height);
        const orientation = getOrientation(width, height);

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
          aspectRatio,
          orientation,
          codec,
          bitrate,
          fps,
          fileSize,
        };

        log.info('Video metadata extracted successfully', {
          filePath,
          duration,
          resolution,
          aspectRatio,
          orientation,
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
export function generateThumbnail(
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

/**
 * Transcode progress callback interface
 */
export interface TranscodeProgress {
  percent: number;
  currentFps: number;
  targetSize: string;
  timemark: string;
}

/**
 * HLS output interface
 */
export interface HLSOutput {
  masterPlaylistUrl: string;
  qualities: {
    resolution: string;
    playlistUrl: string;
  }[];
}

/**
 * Quality preset for HLS transcoding
 */
interface QualityPreset {
  name: string;
  resolution: string;
  videoBitrate: string;
  audioBitrate: string;
  width: number;
  height: number;
}

/**
 * Quality presets for adaptive HLS
 */
const QUALITY_PRESETS: QualityPreset[] = [
  {
    name: '360p',
    resolution: '360p',
    videoBitrate: '800k',
    audioBitrate: '96k',
    width: 640,
    height: 360,
  },
  {
    name: '720p',
    resolution: '720p',
    videoBitrate: '2500k',
    audioBitrate: '128k',
    width: 1280,
    height: 720,
  },
  {
    name: '1080p',
    resolution: '1080p',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    width: 1920,
    height: 1080,
  },
];

/**
 * Transcode video to HLS format with multiple quality levels
 * @param inputPath Path to the input video file
 * @param outputDir Directory where HLS files will be saved
 * @param contentId Content ID for naming files
 * @param onProgress Optional callback for progress updates
 * @returns Promise<HLSOutput> HLS output with master playlist and quality variants
 */
export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  contentId: string,
  onProgress?: (progress: TranscodeProgress) => void
): Promise<HLSOutput> {
  log.info('Starting HLS transcoding', { inputPath, outputDir, contentId });

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Get video info to determine which qualities to generate
  const videoInfo = await getVideoInfo(inputPath);
  const sourceHeight = videoInfo.height;

  // Filter quality presets based on source resolution
  // Don't upscale - only include qualities <= source resolution
  const applicableQualities = QUALITY_PRESETS.filter(
    (preset) => preset.height <= sourceHeight
  );

  if (applicableQualities.length === 0) {
    const lowestPreset = QUALITY_PRESETS[0];
    if (lowestPreset) {
      applicableQualities.push(lowestPreset);
    }
  }

  log.info('Selected quality presets', {
    sourceResolution: videoInfo.resolution,
    qualities: applicableQualities.map((q) => q.resolution),
  });

  // Transcode each quality variant
  const transcodePromises = applicableQualities.map((preset) =>
    transcodeQualityVariant(
      inputPath,
      outputDir,
      contentId,
      preset,
      onProgress
    )
  );

  await Promise.all(transcodePromises);

  // Generate master playlist
  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  await generateMasterPlaylist(
    masterPlaylistPath,
    applicableQualities,
    contentId
  );

  log.info('HLS transcoding completed successfully', {
    contentId,
    masterPlaylist: masterPlaylistPath,
  });

  return {
    masterPlaylistUrl: `${contentId}/master.m3u8`,
    qualities: applicableQualities.map((preset) => ({
      resolution: preset.resolution,
      playlistUrl: `${contentId}/${preset.resolution}/playlist.m3u8`,
    })),
  };
}

/**
 * Transcode a single quality variant
 */
async function transcodeQualityVariant(
  inputPath: string,
  outputDir: string,
  _contentId: string,
  preset: QualityPreset,
  onProgress?: (progress: TranscodeProgress) => void
): Promise<void> {
  const variantDir = path.join(outputDir, preset.resolution);
  await fs.mkdir(variantDir, { recursive: true });

  const playlistPath = path.join(variantDir, 'playlist.m3u8');
  const segmentPattern = path.join(variantDir, 'segment_%03d.ts');

  return new Promise((resolve, reject) => {
    log.info('Transcoding quality variant', {
      resolution: preset.resolution,
      outputDir: variantDir,
    });

    let command = ffmpeg(inputPath)
      .outputOptions([
        // Video codec
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        `-b:v ${preset.videoBitrate}`,
        `-maxrate ${preset.videoBitrate}`,
        `-bufsize ${parseInt(preset.videoBitrate) * 2}k`,

        // Scale to target resolution
        `-vf scale=${preset.width}:${preset.height}`,

        // Audio codec
        '-c:a aac',
        `-b:a ${preset.audioBitrate}`,
        '-ac 2',

        // HLS specific options
        '-f hls',
        '-hls_time 10', // 10 second segments
        '-hls_playlist_type vod',
        '-hls_segment_filename', segmentPattern,

        // Keyframe interval for seeking
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
      ])
      .output(playlistPath);

    // Progress handler
    if (onProgress) {
      command = command.on('progress', (progress) => {
        onProgress({
          percent: progress.percent || 0,
          currentFps: progress.currentFps || 0,
          targetSize: String(progress.targetSize || '0kB'),
          timemark: progress.timemark || '00:00:00',
        });
      });
    }

    command
      .on('end', () => {
        log.info('Quality variant transcoded successfully', {
          resolution: preset.resolution,
          playlist: playlistPath,
        });
        resolve();
      })
      .on('error', (err) => {
        log.error('Failed to transcode quality variant', {
          error: err,
          resolution: preset.resolution,
          inputPath,
        });
        reject(
          new Error(
            `Failed to transcode ${preset.resolution}: ${err.message}`
          )
        );
      })
      .run();
  });
}

/**
 * Generate master playlist that references all quality variants
 */
async function generateMasterPlaylist(
  masterPlaylistPath: string,
  qualities: QualityPreset[],
  _contentId: string
): Promise<void> {
  log.info('Generating master playlist', { masterPlaylistPath });

  const lines: string[] = ['#EXTM3U', '#EXT-X-VERSION:3'];

  // Add each quality variant
  for (const preset of qualities) {
    // Calculate bandwidth (video + audio bitrate in bits/sec)
    const videoBitrate = parseInt(preset.videoBitrate) * 1000;
    const audioBitrate = parseInt(preset.audioBitrate) * 1000;
    const bandwidth = videoBitrate + audioBitrate;

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${preset.width}x${preset.height},NAME="${preset.name}"`
    );
    lines.push(`${preset.resolution}/playlist.m3u8`);
  }

  const content = lines.join('\n') + '\n';
  await fs.writeFile(masterPlaylistPath, content, 'utf-8');

  log.info('Master playlist generated successfully', { masterPlaylistPath });
}
