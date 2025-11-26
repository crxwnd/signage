/**
 * useDisplays Hook
 * Custom hook for fetching displays and stats with React Query
 */

import { useQueries } from '@tanstack/react-query';
import { getDisplays, getDisplayStats } from '@/lib/api/displays';
import type { Display, DisplayFilter } from '@shared-types';

interface UseDisplaysOptions {
  filter?: DisplayFilter;
}

interface UseDisplaysReturn {
  displays: Display[];
  stats: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch displays and statistics
 *
 * @param options - Options including filter for displays
 * @returns Displays data, stats, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { displays, stats, isLoading, error, refetch } = useDisplays({
 *   filter: { status: 'ONLINE' }
 * });
 * ```
 */
export function useDisplays(
  options: UseDisplaysOptions = {}
): UseDisplaysReturn {
  const { filter } = options;

  // Use useQueries to fetch displays and stats in parallel
  const [displaysQuery, statsQuery] = useQueries({
    queries: [
      {
        queryKey: ['displays', filter],
        queryFn: async () => {
          const result = await getDisplays(filter, {
            page: 1,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc' as const,
          });
          return result;
        },
        staleTime: 5 * 1000, // 5 seconds
      },
      {
        queryKey: ['displays-stats'],
        queryFn: () => getDisplayStats(),
        staleTime: 10 * 1000, // 10 seconds
      },
    ],
  });

  // Extract displays from paginated response
  const displays = displaysQuery.data?.items ?? [];
  const stats = statsQuery.data ?? {
    total: 0,
    online: 0,
    offline: 0,
    error: 0,
  };

  // Combine loading states
  const isLoading = displaysQuery.isLoading || statsQuery.isLoading;

  // Get first error if any
  const error =
    (displaysQuery.error as Error) || (statsQuery.error as Error) || null;

  // Refetch function for both queries
  const refetch = () => {
    void displaysQuery.refetch();
    void statsQuery.refetch();
  };

  return {
    displays,
    stats,
    isLoading,
    error,
    refetch,
  };
}
