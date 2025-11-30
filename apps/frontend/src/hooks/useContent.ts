/**
 * useContent Hook
 * Custom hook for fetching content and stats with React Query
 */

import { useQueries } from '@tanstack/react-query';
import { getContents, getContentStats } from '@/lib/api/content';
import type {
  Content,
  ContentFilter,
  ContentStats,
} from '@/lib/api/content';

interface UseContentOptions {
  filter?: ContentFilter;
}

interface UseContentReturn {
  contents: Content[];
  stats: ContentStats;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch content and statistics
 *
 * @param options - Options including filter for content
 * @returns Content data, stats, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { contents, stats, isLoading, error, refetch } = useContent({
 *   filter: { type: 'VIDEO', status: 'READY' }
 * });
 * ```
 */
export function useContent(
  options: UseContentOptions = {}
): UseContentReturn {
  const { filter } = options;

  // Use useQueries to fetch contents and stats in parallel
  const [contentsQuery, statsQuery] = useQueries({
    queries: [
      {
        queryKey: ['contents', filter],
        queryFn: async () => {
          const result = await getContents(filter, {
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
        queryKey: ['content-stats'],
        queryFn: () => getContentStats(),
        staleTime: 10 * 1000, // 10 seconds
      },
    ],
  });

  // Extract contents from paginated response
  const contents = contentsQuery.data?.items ?? [];
  const stats = statsQuery.data ?? {
    total: 0,
    byType: {
      videos: 0,
      images: 0,
      html: 0,
    },
    byStatus: {
      pending: 0,
      processing: 0,
      ready: 0,
      error: 0,
    },
  };

  // Combine loading states
  const isLoading = contentsQuery.isLoading || statsQuery.isLoading;

  // Get first error if any
  const error =
    (contentsQuery.error as Error) || (statsQuery.error as Error) || null;

  // Refetch function for both queries
  const refetch = () => {
    void contentsQuery.refetch();
    void statsQuery.refetch();
  };

  return {
    contents,
    stats,
    isLoading,
    error,
    refetch,
  };
}
