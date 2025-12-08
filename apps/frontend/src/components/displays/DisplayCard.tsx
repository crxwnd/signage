/**
 * DisplayCard Component
 * Card component for displaying individual display information
 */

'use client';

import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Display } from '@shared-types';
import { DisplayStatus } from '@shared-types';
import { Monitor, MapPin, Clock, Building2 } from 'lucide-react';

interface DisplayCardProps {
  display: Display;
}

/**
 * Get badge color based on display status
 */
function getStatusBadge(status: DisplayStatus) {
  switch (status) {
    case DisplayStatus.ONLINE:
      return (
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
          Online
        </Badge>
      );
    case DisplayStatus.OFFLINE:
      return (
        <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-gray-500" />
          Offline
        </Badge>
      );
    case DisplayStatus.ERROR:
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
  // Get area name from display.area relation if available
  // Otherwise fall back to displaying just the areaId
  const areaName = (display as any).area?.name || null;
  const hasArea = display.areaId || areaName;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6">
        {/* Header with name and status */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{display.name}</h3>
              <p className="text-sm text-muted-foreground">{display.id.slice(0, 8)}</p>
            </div>
          </div>
          {getStatusBadge(display.status)}
        </div>

        {/* Location */}
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{display.location}</span>
        </div>

        {/* Area Badge (if exists) - Positioned prominently */}
        {hasArea && (
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20"
            >
              {areaName || `Area: ${display.areaId?.slice(0, 8)}`}
            </Badge>
          </div>
        )}

        {/* Last seen */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last seen: {formatLastSeen(display.lastSeen)}</span>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Card>
  );
}
