/**
 * DisplayCardSkeleton
 * Loading skeleton for display cards
 */

import { Card, CardContent, CardHeader } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export function DisplayCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-2 flex-1">
          {/* Display name skeleton */}
          <Skeleton className="h-5 w-3/4" />
          {/* Location skeleton */}
          <Skeleton className="h-4 w-1/2" />
        </div>
        {/* Status badge skeleton */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Content info skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* Last seen skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          {/* Actions skeleton */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
