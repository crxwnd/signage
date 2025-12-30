/**
 * Video Processing Queue with BullMQ
 *
 * Handles asynchronous video transcoding jobs
 * Updates Content status: PENDING -> PROCESSING -> READY/ERROR
 */

import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { log } from '../middleware/logger';
import {
  transcodeToHLS,
  generateThumbnail,
  type TranscodeProgress,
} from '../services/ffmpegService';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoTranscodeJobData {
  contentId: string;
  inputPath: string;
  outputDir: string;
  thumbnailPath: string;
}

export interface VideoTranscodeJobResult {
  contentId: string;
  hlsUrl: string;
  thumbnailUrl: string;
  duration: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const QUEUE_NAME = 'video-processing';

const REDIS_CONNECTION = {
  host: config.redisUrl.includes('://')
    ? new URL(config.redisUrl).hostname
    : config.redisUrl,
  port: config.redisUrl.includes('://')
    ? parseInt(new URL(config.redisUrl).port || '6379', 10)
    : 6379,
  maxRetriesPerRequest: null, // Required for BullMQ
};

const QUEUE_OPTIONS = {
  connection: REDIS_CONNECTION,
};

const WORKER_OPTIONS = {
  connection: REDIS_CONNECTION,
  concurrency: 2, // Process 2 videos at a time (adjust based on server resources)
};

const JOB_OPTIONS = {
  attempts: 3, // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // Start with 5 second delay
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 100, // Keep max 100 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
  },
};

// ============================================================================
// QUEUE INSTANCE
// ============================================================================

export const videoQueue = new Queue<VideoTranscodeJobData, VideoTranscodeJobResult>(
  QUEUE_NAME,
  QUEUE_OPTIONS
);

// ============================================================================
// QUEUE METHODS
// ============================================================================

/**
 * Add a video transcoding job to the queue
 *
 * @param data - Job data with content ID and file paths
 * @returns Job ID
 */
export async function addVideoTranscodeJob(
  data: VideoTranscodeJobData
): Promise<string> {
  log.info('📥 Adding video transcode job to queue', {
    contentId: data.contentId,
    inputPath: data.inputPath,
  });

  // Update content status to PENDING
  await prisma.content.update({
    where: { id: data.contentId },
    data: { status: 'PENDING' },
  });

  const job = await videoQueue.add(
    'transcode',
    data,
    JOB_OPTIONS
  );

  log.info(`✅ Job added to queue: ${job.id}`);
  return job.id || 'unknown';
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<{
  state: string;
  progress: number;
  result?: VideoTranscodeJobResult;
  error?: string;
}> {
  const job = await videoQueue.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const state = await job.getState();
  const progress = job.progress as number || 0;

  return {
    state,
    progress,
    result: job.returnvalue,
    error: job.failedReason,
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
    videoQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

// ============================================================================
// WORKER PROCESS
// ============================================================================

/**
 * Worker that processes video transcoding jobs
 *
 * DO NOT call this directly - it's automatically started when imported
 */
export const videoWorker = new Worker<VideoTranscodeJobData, VideoTranscodeJobResult>(
  QUEUE_NAME,
  async (job: Job<VideoTranscodeJobData, VideoTranscodeJobResult>) => {
    const { contentId, inputPath, outputDir, thumbnailPath } = job.data;

    log.info(`🎬 Processing video transcode job ${job.id}`, {
      contentId,
      inputPath,
    });

    try {
      // Update content status to PROCESSING
      await prisma.content.update({
        where: { id: contentId },
        data: { status: 'PROCESSING' },
      });

      // Step 1: Generate thumbnail (10% of progress)
      log.info('📸 Generating thumbnail...');
      await generateThumbnail(inputPath, thumbnailPath);
      await job.updateProgress(10);

      // Step 2: Transcode to HLS (10% -> 90%)
      log.info('🎬 Starting HLS transcoding...');
      const hlsOutput = await transcodeToHLS(
        inputPath,
        outputDir,
        contentId,
        (progress: TranscodeProgress) => {
          // Update job progress (10% to 90%)
          const totalProgress = 10 + (progress.percent * 0.8);
          job.updateProgress(Math.floor(totalProgress));

          log.info(`⏳ Transcoding progress: ${Math.floor(totalProgress)}%`, {
            contentId,
            timemark: progress.timemark,
          });
        }
      );

      // Step 3: Update database (90% -> 100%)
      await job.updateProgress(95);

      // masterPlaylistUrl already contains contentId/master.m3u8
      const hlsUrl = `/hls/${hlsOutput.masterPlaylistUrl}`;
      const thumbnailUrl = `/thumbnails/${contentId}.jpg`;

      await prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'READY',
          hlsUrl,
          thumbnailUrl,
        },
      });

      await job.updateProgress(100);

      log.info(`✅ Video transcoding complete for ${contentId}`, {
        hlsUrl,
        thumbnailUrl,
      });

      return {
        contentId,
        hlsUrl,
        thumbnailUrl,
        duration: 0, // TODO: Get from video info
      };
    } catch (error) {
      log.error(`❌ Video transcoding failed for ${contentId}`, error as Error);

      // Update content status to ERROR
      await prisma.content.update({
        where: { id: contentId },
        data: { status: 'ERROR' },
      });

      throw error;
    }
  },
  WORKER_OPTIONS
);

// ============================================================================
// WORKER EVENT HANDLERS
// ============================================================================

videoWorker.on('completed', (job) => {
  log.info(`✅ Job ${job.id} completed`);
});

videoWorker.on('failed', (job, error) => {
  log.error(`❌ Job ${job?.id} failed`, error);
});

videoWorker.on('progress', (job, progress) => {
  log.info(`⏳ Job ${job.id} progress: ${progress}%`);
});

videoWorker.on('error', (error) => {
  log.error('❌ Worker error', error);
});

videoWorker.on('ready', () => {
  log.info('✅ Video worker is READY and listening for jobs');
});

videoWorker.on('active', (job) => {
  log.info(`🎬 Job ${job.id} is now ACTIVE`, { contentId: job.data.contentId });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Gracefully close queue and worker connections
 */
export async function closeVideoQueue(): Promise<void> {
  log.info('Closing video queue and worker...');

  await Promise.all([
    videoWorker.close(),
    videoQueue.close(),
    prisma.$disconnect(),
  ]);

  log.info('✓ Video queue closed');
}

// Handle shutdown signals
process.on('SIGTERM', closeVideoQueue);
process.on('SIGINT', closeVideoQueue);

// ============================================================================
// QUEUE EVENTS (for monitoring)
// ============================================================================

videoQueue.on('waiting', (job) => {
  log.info(`⏸️  Job waiting: ${JSON.stringify(job)}`);
});

videoQueue.on('removed', (job) => {
  log.info(`🗑️  Job removed: ${JSON.stringify(job)}`);
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  queue: videoQueue,
  worker: videoWorker,
  addJob: addVideoTranscodeJob,
  getStatus: getJobStatus,
  getStats: getQueueStats,
  close: closeVideoQueue,
};
