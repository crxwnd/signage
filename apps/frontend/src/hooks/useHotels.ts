/**
 * Hotels Hook
 * React Query hook for fetching hotels
 */

import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Hotel {
    id: string;
    name: string;
    address: string;
    createdAt: string;
}

export function useHotels() {
    return useQuery({
        queryKey: ['hotels'],
        queryFn: async (): Promise<Hotel[]> => {
            const response = await authenticatedFetch(`${API_URL}/api/hotels`);
            const data = await response.json();
            return data.data?.hotels || data.hotels || [];
        },
        staleTime: 60 * 1000, // 1 minute
    });
}
