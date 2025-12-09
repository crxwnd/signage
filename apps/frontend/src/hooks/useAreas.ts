import { useQuery } from '@tanstack/react-query';
import { getAreas, type AreaFilter } from '@/lib/api/areas';

interface UseAreasOptions {
  filter?: AreaFilter;
  enabled?: boolean;
}

export function useAreas(options: UseAreasOptions = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['areas', options.filter],
    queryFn: () => getAreas(options.filter),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  return {
    areas: data || [], // Siempre retorna array para evitar crashes
    isLoading,
    error,
    refetch,
  };
}