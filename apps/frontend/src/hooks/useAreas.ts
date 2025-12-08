/**
 * useAreas Hook
 * Custom hook for fetching areas with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { getAreas } from '@/lib/api/areas';
import type { Area, AreaFilter } from '@/lib/api/areas';

interface UseAreasOptions {
  filter?: AreaFilter;
  enabled?: boolean; // Allow conditional fetching
}

interface UseAreasReturn {
  areas: Area[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch areas (automatically filtered by user role via RBAC)
 *
 * RBAC Behavior:
 * - SUPER_ADMIN: Returns all areas
 * - HOTEL_ADMIN: Returns only areas in their hotel
 * - AREA_MANAGER: Returns only their specific area
 *
 * @param options - Options including optional filter and enabled flag
 * @returns Areas data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all areas (filtered by user role)
 * const { areas, isLoading, error } = useAreas();
 *
 * // With conditional fetching
 * const { areas, isLoading } = useAreas({ enabled: isOpen });
 * ```
 */
export function useAreas(options: UseAreasOptions = {}): UseAreasReturn {
  const { filter, enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['areas', filter],
    queryFn: () => getAreas(filter),
    staleTime: 30 * 1000, // 30 seconds - areas don't change frequently
    enabled,
  });

  return {
    areas: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
