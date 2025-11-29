# Video Processing Services

## Overview

This module provides video transcoding and HLS streaming capabilities for the Signage Digital System.

## Components

### 1. ffmpegService.ts

Core FFmpeg operations for video processing.

#### Functions

##### `checkFFmpegInstalled(): Promise<boolean>`
Verifies FFmpeg installation.

```typescript
import { checkFFmpegInstalled } from './services/ffmpegService';

const isInstalled = await checkFFmpegInstalled();
if (!isInstalled) {
  console.error('FFmpeg is not installed!');
}
```

##### `getVideoInfo(videoPath: string): Promise<VideoInfo>`
Extracts video metadata.

```typescript
const info = await getVideoInfo('/path/to/video.mp4');
console.log(`Duration: ${info.duration}s`);
console.log(`Resolution: ${info.width}x${info.height}`);
```

##### `generateThumbnail(videoPath: string, outputPath: string): Promise<string>`
Generates a thumbnail from video.

```typescript
const thumbnailPath = await generateThumbnail(
  '/path/to/video.mp4',
  '/storage/thumbnails/video-123.jpg'
);
```

##### `transcodeToHLS(inputPath, outputDir, contentId, onProgress?): Promise<HLSOutput>`
Transcodes video to HLS format with multiple quality levels (360p, 720p, 1080p).

```typescript
const result = await transcodeToHLS(
  '/path/to/input.mp4',
  '/storage/hls/content-123',
  'content-123',
  (progress) => {
    console.log(`Progress: ${progress.percent}%`);
  }
);

// result.masterPlaylistUrl = 'master.m3u8'
// result.qualities = [
//   { resolution: '360p', playlistUrl: '360p/playlist.m3u8' },
//   { resolution: '720p', playlistUrl: '720p/playlist.m3u8' },
//   { resolution: '1080p', playlistUrl: '1080p/playlist.m3u8' }
// ]
```

### 2. videoQueue.ts

BullMQ-based asynchronous job queue for video processing.

#### Usage

##### Add a transcoding job

```typescript
import { addVideoTranscodeJob } from './queue/videoQueue';

const jobId = await addVideoTranscodeJob({
  contentId: 'content-123',
  inputPath: '/uploads/video.mp4',
  outputDir: '/storage/hls/content-123',
  thumbnailPath: '/storage/thumbnails/content-123.jpg',
});

console.log(`Job queued: ${jobId}`);
```

##### Check job status

```typescript
import { getJobStatus } from './queue/videoQueue';

const status = await getJobStatus(jobId);
console.log(`State: ${status.state}`);
console.log(`Progress: ${status.progress}%`);
```

##### Get queue statistics

```typescript
import { getQueueStats } from './queue/videoQueue';

const stats = await getQueueStats();
console.log(`Waiting: ${stats.waiting}`);
console.log(`Active: ${stats.active}`);
console.log(`Completed: ${stats.completed}`);
console.log(`Failed: ${stats.failed}`);
```

## Database Schema

The `Content` model has been updated with HLS-specific fields:

```prisma
model Content {
  // ... existing fields

  status       ContentStatus @default(PENDING)
  hlsUrl       String?
  thumbnailUrl String?
}

enum ContentStatus {
  PENDING      // Uploaded, waiting for processing
  PROCESSING   // Currently being transcoded
  READY        // Transcoding complete, ready to stream
  ERROR        // Transcoding failed
}
```

## Workflow

1. **Upload Video**: User uploads video file
2. **Create Content Record**: Database record created with `status = PENDING`
3. **Queue Job**: Transcoding job added to BullMQ queue
4. **Process Video**:
   - Status updated to `PROCESSING`
   - Thumbnail generated
   - Video transcoded to HLS (multiple qualities)
   - Playlists created
5. **Update Database**:
   - Status updated to `READY` (or `ERROR` on failure)
   - `hlsUrl` and `thumbnailUrl` populated
6. **Serve Content**: Frontend streams video via HLS.js

## Storage Structure

```
storage/
├── uploads/           # Original uploaded videos
│   └── video-123.mp4
├── hls/               # HLS transcoded videos
│   └── content-123/
│       ├── master.m3u8
│       ├── 360p/
│       │   ├── playlist.m3u8
│       │   ├── segment_000.ts
│       │   ├── segment_001.ts
│       │   └── ...
│       ├── 720p/
│       │   └── ...
│       └── 1080p/
│           └── ...
└── thumbnails/        # Video thumbnails
    └── content-123.jpg
```

## Requirements

### System Dependencies

- **FFmpeg 4.0+** with libx264 and aac codec support
- **Redis** for BullMQ job queue

### Installation (Ubuntu/Debian)

```bash
# Install FFmpeg
sudo apt update
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version

# Install Redis (if not using Docker)
sudo apt install -y redis-server
sudo systemctl start redis
```

### Docker Setup

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
```

## Environment Variables

```bash
# .env
REDIS_URL=redis://localhost:6379
```

## Performance Considerations

- **Concurrency**: Worker processes 2 videos simultaneously (configurable)
- **Retries**: Failed jobs retry up to 3 times with exponential backoff
- **Cleanup**: Completed jobs kept for 24 hours, failed jobs for 7 days
- **Segment Duration**: 10 seconds per HLS segment
- **Quality Selection**: Only generates qualities ≤ source resolution (no upscaling)

## Monitoring

Worker and queue events are logged with Winston:

```typescript
videoWorker.on('completed', (job) => {
  log.info(`✅ Job ${job.id} completed`);
});

videoWorker.on('failed', (job, error) => {
  log.error(`❌ Job ${job?.id} failed`, error);
});
```

## Error Handling

All errors update the Content status to `ERROR` and are logged:

```typescript
try {
  await transcodeToHLS(...);
} catch (error) {
  await prisma.content.update({
    where: { id: contentId },
    data: { status: 'ERROR' }
  });
  throw error;
}
```

## Next Steps

1. Create API endpoint for uploading videos
2. Add file upload middleware (multer)
3. Integrate with frontend VideoPlayer component
4. Add progress tracking UI
5. Implement cleanup job for old files
