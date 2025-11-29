/**
 * FFmpeg Service for Video Processing
 *
 * Handles video transcoding, thumbnail generation, and HLS streaming
 * for the Signage Digital System
 */

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface VideoInfo {
  duration: number; // in seconds
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
  size: number; // file size in bytes
}

export interface HLSOutput {
  masterPlaylistUrl: string; // URL to master.m3u8
  qualities: {
    resolution: string;
    playlistUrl: string;
  }[];
}

export interface TranscodeProgress {
  percent: number;
  currentFps: number;
  targetSize: string;
  timemark: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const HLS_QUALITIES = [
  { name: '360p', width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
];

const HLS_SEGMENT_DURATION = 10; // seconds per segment
const THUMBNAIL_TIME = '00:00:01'; // timestamp for thumbnail generation

// ============================================================================
// FFMPEG INSTALLATION CHECK
// ============================================================================

/**
 * Checks if FFmpeg is installed and accessible in the system
 * @returns Promise<boolean> - true if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    console.log('✅ FFmpeg installed:', stdout.split('\n')[0]);
    return true;
  } catch (error) {
    console.error('❌ FFmpeg not found:', error);
    return false;
  }
}

// ============================================================================
// VIDEO METADATA
// ============================================================================

/**
 * Extracts video metadata using ffprobe
 * @param videoPath - Absolute path to video file
 * @returns Promise<VideoInfo> - Video metadata
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('❌ Failed to get video info:', err);
        return reject(err);
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');

      if (!videoStream) {
        return reject(new Error('No video stream found'));
      }

      // Parse frame rate (e.g., "30/1" -> 30)
      const fpsString = videoStream.r_frame_rate || '0/1';
      const fpsParts = fpsString.split('/').map(Number);
      const num = fpsParts[0] || 0;
      const den = fpsParts[1] || 1;
      const fps = den !== 0 ? num / den : 0;

      const info: VideoInfo = {
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        codec: videoStream.codec_name || 'unknown',
        bitrate: Number(metadata.format.bit_rate) || 0,
        fps,
        size: Number(metadata.format.size) || 0,
      };

      console.log('📊 Video info:', {
        duration: `${info.duration.toFixed(2)}s`,
        resolution: `${info.width}x${info.height}`,
        codec: info.codec,
        bitrate: `${(info.bitrate / 1000000).toFixed(2)} Mbps`,
      });

      resolve(info);
    });
  });
}

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

/**
 * Generates a thumbnail from a video at specified timestamp
 * @param videoPath - Absolute path to video file
 * @param outputPath - Absolute path for output thumbnail (e.g., /path/to/thumbnail.jpg)
 * @param timestamp - Time to capture (default: 00:00:01)
 * @returns Promise<string> - Path to generated thumbnail
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: string = THUMBNAIL_TIME
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);

    fs.mkdir(outputDir, { recursive: true })
      .then(() => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(outputPath),
            folder: outputDir,
            size: '1280x720',
          })
          .on('end', () => {
            console.log('✅ Thumbnail generated:', outputPath);
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('❌ Thumbnail generation failed:', err);
            reject(err);
          });
      })
      .catch(reject);
  });
}

// ============================================================================
// HLS TRANSCODING
// ============================================================================

/**
 * Transcodes a video to HLS format with multiple quality levels
 *
 * Creates adaptive bitrate streaming with 360p, 720p, and 1080p variants.
 * Output structure:
 *
 * outputDir/
 *   ├── master.m3u8          (master playlist)
 *   ├── 360p/
 *   │   ├── playlist.m3u8
 *   │   ├── segment_0.ts
 *   │   ├── segment_1.ts
 *   │   └── ...
 *   ├── 720p/
 *   │   └── ...
 *   └── 1080p/
 *       └── ...
 *
 * @param inputPath - Absolute path to input video file
 * @param outputDir - Absolute path to output directory (e.g., /storage/hls/{contentId})
 * @param contentId - Unique content ID for logging
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<HLSOutput> - URLs to generated playlists
 */
export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  contentId: string,
  onProgress?: (progress: TranscodeProgress) => void
): Promise<HLSOutput> {
  console.log(`🎬 Starting HLS transcoding for content ${contentId}`);
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputDir}`);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Get video metadata first
  const videoInfo = await getVideoInfo(inputPath);
  console.log(`📐 Source resolution: ${videoInfo.width}x${videoInfo.height}`);

  // Filter qualities based on source resolution
  // Don't upscale - only include qualities smaller or equal to source
  let applicableQualities = HLS_QUALITIES.filter(
    q => q.height <= videoInfo.height
  );

  if (applicableQualities.length === 0) {
    // Source is smaller than 360p, use source resolution
    applicableQualities = [{
      name: `${videoInfo.height}p`,
      width: videoInfo.width,
      height: videoInfo.height,
      bitrate: '800k',
      audioBitrate: '96k',
    }];
  }

  console.log(`🎯 Generating ${applicableQualities.length} quality levels:`,
    applicableQualities.map(q => q.name).join(', ')
  );

  // Transcode each quality level
  const qualities: HLSOutput['qualities'] = [];

  for (const quality of applicableQualities) {
    const qualityDir = path.join(outputDir, quality.name);
    await fs.mkdir(qualityDir, { recursive: true });

    await transcodeQuality(
      inputPath,
      qualityDir,
      quality,
      onProgress
    );

    qualities.push({
      resolution: quality.name,
      playlistUrl: `${quality.name}/playlist.m3u8`,
    });
  }

  // Create master playlist
  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  await createMasterPlaylist(masterPlaylistPath, qualities, applicableQualities);

  console.log(`✅ HLS transcoding complete for content ${contentId}`);
  console.log(`   Master playlist: ${masterPlaylistPath}`);

  return {
    masterPlaylistUrl: 'master.m3u8',
    qualities,
  };
}

/**
 * Transcodes a single quality variant
 */
async function transcodeQuality(
  inputPath: string,
  outputDir: string,
  quality: typeof HLS_QUALITIES[0],
  onProgress?: (progress: TranscodeProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`   🔄 Transcoding ${quality.name}...`);

    const outputPattern = path.join(outputDir, 'segment_%03d.ts');
    const playlistPath = path.join(outputDir, 'playlist.m3u8');

    ffmpeg(inputPath)
      // Video codec
      .videoCodec('libx264')
      .outputOptions([
        // H.264 profile
        '-profile:v', 'main',
        '-level', '4.0',

        // Resolution
        `-vf`, `scale=${quality.width}:${quality.height}`,

        // Bitrate
        `-b:v`, quality.bitrate,
        `-maxrate`, quality.bitrate,
        `-bufsize`, `${parseInt(quality.bitrate) * 2}`,

        // GOP size (2 seconds)
        '-g', '60',
        '-keyint_min', '60',
        '-sc_threshold', '0',

        // Audio
        '-c:a', 'aac',
        `-b:a`, quality.audioBitrate,
        '-ar', '48000',

        // HLS specific
        '-f', 'hls',
        '-hls_time', HLS_SEGMENT_DURATION.toString(),
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', outputPattern,
      ])
      .output(playlistPath)
      .on('start', (commandLine) => {
        console.log(`   ⚙️  FFmpeg command: ${commandLine.substring(0, 100)}...`);
      })
      .on('progress', (progress) => {
        if (onProgress) {
          onProgress({
            percent: Number(progress.percent) || 0,
            currentFps: Number(progress.currentFps) || 0,
            targetSize: String(progress.targetSize || '0kB'),
            timemark: String(progress.timemark || '00:00:00'),
          });
        }

        // Log every 10%
        if (progress.percent && Math.floor(progress.percent) % 10 === 0) {
          console.log(`   📊 ${quality.name} - ${Math.floor(progress.percent)}% | ${progress.timemark}`);
        }
      })
      .on('end', () => {
        console.log(`   ✅ ${quality.name} complete`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`   ❌ ${quality.name} failed:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * Creates HLS master playlist that references all quality variants
 */
async function createMasterPlaylist(
  outputPath: string,
  qualities: HLSOutput['qualities'],
  qualityConfigs: Array<typeof HLS_QUALITIES[0]>
): Promise<void> {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', ''];

  // Add each quality variant
  for (let i = 0; i < qualities.length; i++) {
    const quality = qualities[i];
    const config = qualityConfigs[i];

    if (!quality || !config) continue;

    // Parse bitrate (e.g., "2500k" -> 2500000)
    const bitrateValue = parseInt(config.bitrate, 10);
    const bandwidth = bitrateValue * 1000;

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${config.width}x${config.height}`,
      quality.playlistUrl,
      ''
    );
  }

  await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
  console.log('📝 Master playlist created:', outputPath);
}
