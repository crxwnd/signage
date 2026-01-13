'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Building } from 'lucide-react';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { DisplayStatus } from '@shared-types';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Hotel {
  id: string;
  name: string;
}

interface DisplaysFiltersProps {
  totalDisplays?: number;
  filteredCount?: number;
}

export function DisplaysFilters({ totalDisplays = 0, filteredCount = 0 }: DisplaysFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { areas, isLoading: areasLoading, refetch: refetchAreas } = useAreas();

  // Role-based visibility
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAreaManager = user?.role === 'AREA_MANAGER';

  // ESTADO: Solo para el texto (search)
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(initialSearch);

  // FUENTE DE LA VERDAD: URL
  const currentStatus = searchParams.get('status') || 'all';
  const currentAreaId = searchParams.get('areaId') || 'all';
  const currentHotelId = searchParams.get('hotelId') || 'all';

  // Fetch hotels (SUPER_ADMIN only)
  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const res = await authenticatedFetch(`${API_URL}/api/hotels`);
      if (!res.ok) return { data: { hotels: [] } };
      return res.json();
    },
    enabled: isSuperAdmin,
  });

  const hotels: Hotel[] = Array.isArray(hotelsData?.data?.hotels)
    ? hotelsData.data.hotels
    : Array.isArray(hotelsData?.data)
      ? hotelsData.data
      : [];

  // Filter areas by selected hotel (for SUPER_ADMIN)
  const filteredAreas = isSuperAdmin && currentHotelId !== 'all'
    ? areas.filter((area: { hotelId?: string }) => area.hotelId === currentHotelId)
    : areas;

  // Helper para actualizar URL sin bucles
  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // Debounce manual
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== initialSearch) {
        updateUrl({ search: searchValue });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, initialSearch, updateUrl]);

  // Handlers
  const handleStatusChange = (val: string) => updateUrl({ status: val });
  const handleAreaChange = (val: string) => updateUrl({ areaId: val });
  const handleHotelChange = (val: string) => {
    // When hotel changes, reset area filter
    updateUrl({ hotelId: val, areaId: null });
    // Refetch areas for the new hotel
    if (val !== 'all') {
      refetchAreas();
    }
  };

  const handleClearFilters = () => {
    setSearchValue('');
    router.push('/displays');
  };

  const hasActiveFilters = searchValue !== '' ||
    currentStatus !== 'all' ||
    currentAreaId !== 'all' ||
    currentHotelId !== 'all';

  return (
    <div className="rounded-lg p-4 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-slate-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">

          {/* SEARCH */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search displays..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-800"
            />
          </div>

          {/* HOTEL SELECT (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <Select
              value={currentHotelId}
              onValueChange={handleHotelChange}
              disabled={hotelsLoading}
            >
              <SelectTrigger className="w-full md:w-[200px] bg-white dark:bg-slate-800">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={hotelsLoading ? "Loading..." : "All Hotels"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hotels</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* AREA SELECT (Hidden for AREA_MANAGER) */}
          {!isAreaManager && (
            <Select
              value={currentAreaId}
              onValueChange={handleAreaChange}
              disabled={areasLoading}
            >
              <SelectTrigger className="w-full md:w-[200px] bg-white dark:bg-slate-800">
                <SelectValue placeholder={areasLoading ? "Loading..." : "All Areas"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {filteredAreas.map((area: { id: string; name: string }) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
                {filteredAreas.length === 0 && !areasLoading && (
                  <SelectItem value="__no_areas__" disabled>No areas found</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          {/* STATUS SELECT (Visible for all) */}
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-slate-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={DisplayStatus.ONLINE}>Online</SelectItem>
              <SelectItem value={DisplayStatus.OFFLINE}>Offline</SelectItem>
              <SelectItem value={DisplayStatus.ERROR}>Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CLEAR BUTTON & COUNT */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold">{filteredCount}</span> of{' '}
            <span className="font-semibold">{totalDisplays}</span>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}