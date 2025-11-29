# VideoPlayer Component

## Overview

React component for playing HLS (HTTP Live Streaming) videos with adaptive bitrate streaming support.

## Features

- ✅ **HLS.js Integration**: Automatic HLS playback for Chrome, Firefox, and other browsers
- ✅ **Native Safari Support**: Falls back to native HLS for Safari/iOS
- ✅ **Adaptive Bitrate**: Automatically switches between quality levels (360p, 720p, 1080p)
- ✅ **Error Recovery**: Automatic recovery from network and media errors
- ✅ **Loading States**: Shows loading indicator while video is buffering
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive**: Works on all screen sizes
- ✅ **TypeScript**: Full TypeScript support with strict typing
- ✅ **Accessible**: ARIA labels and semantic HTML

## Installation

The component requires `hls.js` as a dependency:

```bash
pnpm add hls.js
```

## Usage

### Basic Example

```tsx
import { VideoPlayer } from '@/components/video';

export default function MyPage() {
  return (
    <VideoPlayer
      src="https://example.com/video/master.m3u8"
      poster="https://example.com/thumbnail.jpg"
      title="My Video"
    />
  );
}
```

### With Event Handlers

```tsx
import { VideoPlayer } from '@/components/video';

export default function MyPage() {
  return (
    <VideoPlayer
      src="/hls/content-123/master.m3u8"
      poster="/thumbnails/content-123.jpg"
      title="Hotel Promotion Video"
      autoPlay={false}
      loop={false}
      controls={true}
      onPlay={() => console.log('Video started')}
      onPause={() => console.log('Video paused')}
      onEnded={() => console.log('Video ended')}
      onError={(error) => console.error('Video error:', error)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | *required* | Video source URL (`.m3u8` for HLS or direct video file) |
| `poster` | `string` | `undefined` | Thumbnail/poster image URL |
| `title` | `string` | `'Video player'` | Video title (for accessibility) |
| `className` | `string` | `''` | Additional CSS classes |
| `autoPlay` | `boolean` | `false` | Enable autoplay (muted) |
| `loop` | `boolean` | `false` | Enable looping |
| `controls` | `boolean` | `true` | Show native browser controls |
| `onPlay` | `() => void` | `undefined` | Callback when video starts playing |
| `onPause` | `() => void` | `undefined` | Callback when video pauses |
| `onEnded` | `() => void` | `undefined` | Callback when video ends |
| `onError` | `(error: Error) => void` | `undefined` | Callback on error |

## HLS Playback

The component automatically detects HLS sources (files ending with `.m3u8`) and uses:

- **HLS.js** for browsers without native HLS support (Chrome, Firefox, Edge)
- **Native playback** for Safari and iOS (which have built-in HLS support)

### HLS Configuration

The component uses optimized HLS.js settings:

```typescript
{
  enableWorker: true,        // Use Web Worker for better performance
  lowLatencyMode: false,     // Standard latency for better quality
  backBufferLength: 90       // Keep 90s of video in buffer
}
```

## Error Handling

The component handles three types of errors:

1. **Network Errors**: Automatically retries loading the stream
2. **Media Errors**: Attempts to recover from playback issues
3. **Fatal Errors**: Shows user-friendly error message

Example error display:

```
❌ HLS error: NETWORK_ERROR - manifestLoadError
HLS.js is not supported. Try Safari or update your browser.
```

## Browser Support

| Browser | HLS Support | Method |
|---------|-------------|--------|
| Chrome | ✅ | HLS.js |
| Firefox | ✅ | HLS.js |
| Edge | ✅ | HLS.js |
| Safari | ✅ | Native |
| iOS Safari | ✅ | Native |

## Testing

Visit `/video-demo` to see the component in action with example HLS streams.

## Integration with Backend

The VideoPlayer is designed to work seamlessly with the backend HLS transcoding system:

```typescript
// Backend generates HLS files at:
// /storage/hls/{contentId}/master.m3u8

// Frontend usage:
<VideoPlayer
  src={`http://localhost:3001/hls/${contentId}/master.m3u8`}
  poster={`http://localhost:3001/thumbnails/${contentId}.jpg`}
/>
```

## Troubleshooting

### Video won't play

1. Check that the HLS manifest URL is correct and accessible
2. Ensure CORS is configured on the backend
3. Check browser console for HLS.js errors

### Autoplay not working

Browsers require videos to be muted for autoplay to work:

```tsx
<VideoPlayer
  src={src}
  autoPlay={true}  // Automatically sets video to muted
/>
```

### Quality not switching

HLS.js automatically switches quality based on:
- Available bandwidth
- Screen size
- Buffering status

Check the HLS manifest includes multiple quality levels.

## Performance Tips

1. **Use poster images**: Improves perceived loading time
2. **Preload metadata**: Browser preloads video metadata
3. **Optimize segments**: 10-second segments balance quality and latency
4. **CDN delivery**: Serve HLS files from CDN for best performance

## Development

Debug mode (only in development):

```tsx
// Shows HLS.js support status and video source info
process.env.NODE_ENV === 'development'
```

Output:
```
HLS.js supported: ✅
Source: HLS
URL: https://example.com/video/master.m3u8
```

## Architecture

```
VideoPlayer
├── useEffect: HLS initialization
│   ├── Detect HLS source (.m3u8)
│   ├── Check HLS.js support
│   └── Initialize player
├── Event Handlers
│   ├── onPlay, onPause, onEnded
│   └── onError (with recovery)
└── Render
    ├── Loading overlay
    ├── <video> element
    └── Debug info (dev mode)
```

## Related Components

- **ContentLibrary**: Displays list of videos with thumbnails
- **VideoUpload**: Upload videos for HLS transcoding
- **VideoPlayer** (this component): Playback of HLS streams

## License

Part of the Signage Digital System - Hotel Signage Platform
