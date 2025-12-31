/**
 * ContentCard Component
 * Premium card for displaying content with status badges and RBAC delete
 */

'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import type { Content, ContentType, ContentStatus } from '@/lib/api/content';
import { Video, Image as ImageIcon, FileCode, Clock, HardDrive, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { DeleteContentModal } from './DeleteContentModal';
import { useAuth } from '@/contexts/AuthContext';

interface ContentCardProps {
  content: Content;
  onRefetch?: () => void;
}

/**
 * Get icon based on content type
 */
function getContentTypeIcon(type: ContentType) {
  switch (type) {
    case 'VIDEO':
      return <Video className="h-8 w-8 text-brand-primary" />;
    case 'IMAGE':
      return <ImageIcon className="h-8 w-8 text-brand-primary" />;
    case 'HTML':
      return <FileCode className="h-8 w-8 text-brand-primary" />;
    default:
      return <FileCode className="h-8 w-8 text-brand-primary" />;
  }
}

/**
 * Get badge variant for content type
 */
function getTypeBadgeVariant(type: ContentType): 'processing' | 'secondary' | 'warning' {
  switch (type) {
    case 'VIDEO':
      return 'processing'; // Blue
    case 'IMAGE':
      return 'secondary';
    case 'HTML':
      return 'warning';
    default:
      return 'secondary';
  }
}

/**
 * Get badge variant for content status
 */
function getStatusBadgeVariant(status: ContentStatus): 'ready' | 'pending' | 'processing' | 'error' {
  switch (status) {
    case 'READY':
      return 'ready';
    case 'PENDING':
      return 'pending';
    case 'PROCESSING':
      return 'processing';
    case 'ERROR':
      return 'error';
    default:
      return 'pending';
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

export function ContentCard({ content, onRefetch }: ContentCardProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();

  // Check if user can delete this content (RBAC)
  const canDelete = (): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'HOTEL_ADMIN' && content.hotelId === user.hotelId) return true;
    if (user.role === 'AREA_MANAGER' && content.hotelId === user.hotelId) return true;
    return false;
  };

  const handleDeleted = () => {
    onRefetch?.();
  };

  return (
    <>
      <Card className="group relative overflow-hidden card-hover">
        {/* Thumbnail */}
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {content.thumbnailUrl ? (
            <Image
              src={`${API_URL}${content.thumbnailUrl}`}
              alt={content.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
              {getContentTypeIcon(content.type)}
            </div>
          )}

          {/* Type badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge variant={getTypeBadgeVariant(content.type)} className="shadow-sm">
              {content.type}
            </Badge>
          </div>

          {/* Status badge overlay */}
          <div className="absolute top-3 right-3">
            <Badge variant={getStatusBadgeVariant(content.status)} className="shadow-sm">
              {content.status === 'PROCESSING' && (
                <div className="mr-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              )}
              {content.status}
            </Badge>
          </div>

          {/* Delete button overlay */}
          {canDelete() && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                title="Delete content"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content info */}
        <div className="p-4">
          {/* Name */}
          <h3 className="mb-2 font-semibold text-foreground line-clamp-1">
            {content.name}
          </h3>

          {/* Metadata */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* Duration (for videos) */}
            {content.type === 'VIDEO' && content.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(content.duration)}</span>
                {content.resolution && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                    {content.resolution}
                  </span>
                )}
              </div>
            )}

            {/* File size */}
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>{formatFileSize(content.fileSize)}</span>
            </div>
          </div>

          {/* Hotel info (if available) */}
          {content.hotel && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Hotel: <span className="font-medium">{content.hotel.name}</span>
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteContentModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        contentId={content.id}
        contentName={content.name}
        onDeleted={handleDeleted}
      />
    </>
  );
}
