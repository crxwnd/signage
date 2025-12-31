/**
 * DisplayCard Component
 * Premium card for displaying individual display information
 * Uses liquid glass effect and status badges
 */

'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import type { Display } from '@shared-types';
import { DisplayStatus } from '@shared-types';
import { Monitor, MapPin, Clock, ListVideo } from 'lucide-react';
import { PlaylistManager } from './PlaylistManager';

interface DisplayCardProps {
  display: Display;
}

/**
 * Get badge variant based on display status
 */
function getStatusVariant(status: DisplayStatus): 'online' | 'offline' | 'error' {
  switch (status) {
    case DisplayStatus.ONLINE:
      return 'online';
    case DisplayStatus.OFFLINE:
      return 'offline';
    case DisplayStatus.ERROR:
      return 'error';
    default:
      return 'offline';
  }
}

/**
 * Format last seen date
 */
function formatLastSeen(lastSeen: Date | null): string {
  if (!lastSeen) return 'Never';

  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function DisplayCard({ display }: DisplayCardProps) {
  const [playlistOpen, setPlaylistOpen] = useState(false);

  return (
    <>
      <Card className="group relative overflow-hidden card-hover">
        <div className="p-6">
          {/* Header with name and status */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                <Monitor className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{display.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{display.id.slice(0, 8)}</p>
              </div>
            </div>
            <Badge variant={getStatusVariant(display.status)}>
              <div className={`mr-1.5 h-2 w-2 rounded-full ${display.status === DisplayStatus.ONLINE ? 'bg-green-500 animate-pulse-soft' :
                  display.status === DisplayStatus.ERROR ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              {display.status}
            </Badge>
          </div>

          {/* Location */}
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{display.location}</span>
          </div>

          {/* Last seen */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last seen: {formatLastSeen(display.lastSeen)}</span>
          </div>

          {/* Area ID (if exists) */}
          {display.areaId && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Area: <span className="font-medium">{display.areaId}</span>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPlaylistOpen(true)}
            >
              <ListVideo className="h-4 w-4 mr-2" />
              Manage Content
            </Button>
          </div>
        </div>
      </Card>

      {/* Playlist Manager Dialog */}
      <PlaylistManager
        displayId={display.id}
        displayName={display.name}
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
      />
    </>
  );
}
