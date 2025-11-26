/**
 * StatsCardSkeleton
 * Loading skeleton for stats cards
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCardSkeleton() {
  return (
    <>
      {/* Total Displays Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>

      {/* Online Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>

      {/* Offline Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline</CardTitle>
          <div className="h-2 w-2 rounded-full bg-gray-500" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>

      {/* Error Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error</CardTitle>
          <div className="h-2 w-2 rounded-full bg-red-500" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    </>
  );
}
