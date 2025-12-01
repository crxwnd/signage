/**
 * ContentCardSkeleton
 * Loading skeleton for content cards
 */

import { Card } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export function ContentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Thumbnail skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Content info skeleton */}
      <div className="p-4 space-y-3">
        {/* Name skeleton */}
        <Skeleton className="h-5 w-3/4" />

        {/* Metadata skeletons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </Card>
  );
}
