'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryProvider
 * Optimized React Query client for fast navigation and caching
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // CRITICAL: Keep data fresh for 60 seconds
            staleTime: 60 * 1000,

            // CRITICAL: Cache data for 10 minutes before GC
            gcTime: 10 * 60 * 1000,

            // NO automatic refetch on window focus (prevents unnecessary requests)
            refetchOnWindowFocus: false,

            // NO refetch on reconnect (we handle via sockets)
            refetchOnReconnect: false,

            // Don't refetch on mount if data exists
            refetchOnMount: false,

            // Only 1 retry on error
            retry: 1,
            retryDelay: 1000,

            // Use previous data while loading new (instant render)
            placeholderData: (previousData: unknown) => previousData,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
