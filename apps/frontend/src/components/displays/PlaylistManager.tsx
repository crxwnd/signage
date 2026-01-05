/**
 * PlaylistManager Component
 * Dialog for managing content assigned to a display
 */

'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Skeleton,
} from '@/components/ui';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useContent } from '@/hooks/useContent';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Video,
  Image as ImageIcon,
  Code,
  ListVideo,
  X,
} from 'lucide-react';
import type { Content } from '@/lib/api/content';

interface PlaylistManagerProps {
  displayId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Get icon for content type
 */
function ContentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'VIDEO':
      return <Video className="h-4 w-4" />;
    case 'IMAGE':
      return <ImageIcon className="h-4 w-4" />;
    case 'HTML':
      return <Code className="h-4 w-4" />;
    default:
      return <ListVideo className="h-4 w-4" />;
  }
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaylistManager({
  displayId,
  displayName,
  open,
  onOpenChange,
}: PlaylistManagerProps) {
  const [showAddContent, setShowAddContent] = useState(false);

  const {
    playlist,
    isLoading,
    addContent,
    removeContent,
    moveUp,
    moveDown,
    isAdding,
    isRemoving,
    isReordering,
  } = usePlaylist(displayId);

  const { contents, isLoading: contentsLoading } = useContent({
    filter: { status: 'READY' },
  });

  // Filter out content already in playlist
  const availableContents = contents.filter(
    (content) => !playlist.some((item) => item.contentId === content.id)
  );

  const handleAddContent = async (content: Content) => {
    await addContent({ contentId: content.id });
    setShowAddContent(false);
  };

  const isProcessing = isAdding || isRemoving || isReordering;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="h-5 w-5" />
            Playlist: {displayName}
          </DialogTitle>
          <DialogDescription>
            Manage the content assigned to this display. Content plays in order from top to bottom.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Playlist Items */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListVideo className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No content assigned yet</p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Add Content&quot; to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Order number */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="h-12 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {item.content.thumbnailUrl ? (
                      <img
                        src={`${API_URL}${item.content.thumbnailUrl}`}
                        alt={item.content.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ContentTypeIcon type={item.content.type} />
                    )}
                  </div>

                  {/* Content info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.content.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ContentTypeIcon type={item.content.type} />
                      <span>{item.content.type}</span>
                      <span>•</span>
                      <span>{formatDuration(item.content.duration)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0 || isProcessing}
                      onClick={() => moveUp(item.id)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === playlist.length - 1 || isProcessing}
                      onClick={() => moveDown(item.id)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={isProcessing}
                      onClick={() => removeContent(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Content Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => setShowAddContent(true)}
            disabled={isProcessing}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Add Content Dialog */}
        <Dialog open={showAddContent} onOpenChange={setShowAddContent}>
          <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Content</DialogTitle>
              <DialogDescription>
                Choose content to add to the playlist
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {contentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : availableContents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Video className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No available content</p>
                  <p className="text-sm text-muted-foreground">
                    All content is already in the playlist or none is ready
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableContents.map((content) => (
                    <button
                      key={content.id}
                      onClick={() => handleAddContent(content)}
                      disabled={isAdding}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left disabled:opacity-50"
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {content.thumbnailUrl ? (
                          <img
                            src={`${API_URL}${content.thumbnailUrl}`}
                            alt={content.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ContentTypeIcon type={content.type} />
                        )}
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{content.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ContentTypeIcon type={content.type} />
                          <span>{content.type}</span>
                          {content.duration && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(content.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAddContent(false)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
