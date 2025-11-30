/**
 * ContentCard Component
 * Card component for displaying individual content information
 */

'use client';

import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Content, ContentType, ContentStatus } from '@/lib/api/content';
import { Video, Image as ImageIcon, FileCode, Clock, HardDrive } from 'lucide-react';
import Image from 'next/image';

interface ContentCardProps {
  content: Content;
}

/**
 * Get icon based on content type
 */
function getContentTypeIcon(type: ContentType) {
  switch (type) {
    case 'VIDEO':
      return <Video className="h-5 w-5 text-primary" />;
    case 'IMAGE':
      return <ImageIcon className="h-5 w-5 text-primary" />;
    case 'HTML':
      return <FileCode className="h-5 w-5 text-primary" />;
    default:
      return <FileCode className="h-5 w-5 text-primary" />;
  }
}

/**
 * Get badge for content type
 */
function getTypeBadge(type: ContentType) {
  switch (type) {
    case 'VIDEO':
      return (
        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
          Video
        </Badge>
      );
    case 'IMAGE':
      return (
        <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
          Image
        </Badge>
      );
    case 'HTML':
      return (
        <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
          HTML
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/10 text-gray-600">Unknown</Badge>
      );
  }
}

/**
 * Get badge color based on content status
 */
function getStatusBadge(status: ContentStatus) {
  switch (status) {
    case 'READY':
      return (
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
          Ready
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500" />
          Pending
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Processing
        </Badge>
      );
    case 'ERROR':
      return (
        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/10 text-gray-600">Unknown</Badge>
      );
  }
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: string | null): string {
  if (!bytes) return '-';

  const size = parseInt(bytes, 10);
  if (isNaN(size)) return '-';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));

  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ContentCard({ content }: ContentCardProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {content.thumbnailUrl ? (
          <Image
            src={`${API_URL}${content.thumbnailUrl}`}
            alt={content.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            {getContentTypeIcon(content.type)}
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-2 left-2">
          {getTypeBadge(content.type)}
        </div>

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          {getStatusBadge(content.status)}
        </div>
      </div>

      {/* Content info */}
      <div className="p-4">
        {/* Name */}
        <h3 className="mb-2 font-semibold text-foreground line-clamp-1">
          {content.name}
        </h3>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Duration (for videos) */}
          {content.type === 'VIDEO' && content.duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(content.duration)}</span>
            </div>
          )}

          {/* Resolution (for videos) */}
          {content.resolution && (
            <div className="text-xs text-muted-foreground">
              Resolution: <span className="font-medium">{content.resolution}</span>
            </div>
          )}

          {/* File size */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>{formatFileSize(content.fileSize)}</span>
          </div>
        </div>

        {/* Hotel info (if available) */}
        {content.hotel && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Hotel: <span className="font-medium">{content.hotel.name}</span>
            </span>
          </div>
        )}

        {/* Hover effect overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Card>
  );
}
