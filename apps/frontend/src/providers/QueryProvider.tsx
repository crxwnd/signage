'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryProvider
 * Provides React Query client to the application
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create query client with stable reference
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 seconds
            staleTime: 5 * 1000,
            // Cache time: 10 minutes
            gcTime: 10 * 60 * 1000,
            // Refetch on window focus for real-time updates
            refetchOnWindowFocus: true,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
