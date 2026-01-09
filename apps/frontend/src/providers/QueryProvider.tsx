'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryProvider
 * Provides React Query client to the application with optimized settings
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create query client with stable reference
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Increased stale time to reduce network requests
            staleTime: 30 * 1000, // 30 seconds
            // Cache time before garbage collection
            gcTime: 5 * 60 * 1000, // 5 minutes
            // Only refetch on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Retry failed requests once with delay
            retry: 1,
            retryDelay: 1000,
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

