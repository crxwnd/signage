/**
 * Test Utilities
 * Provides wrapped render function with all necessary providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Don't retry in tests
                gcTime: 0,    // Don't cache in tests
            },
        },
    });

interface WrapperProps {
    children: React.ReactNode;
}

/**
 * All Providers Wrapper for tests
 */
function AllTheProviders({ children }: WrapperProps) {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

/**
 * Custom render that includes providers
 */
function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
