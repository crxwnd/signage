/**
 * DisplaysFilters Component
 * Filter and search displays
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
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

interface DisplaysFiltersProps {
  totalDisplays: number;
  filteredCount: number;
}

export function DisplaysFilters({ totalDisplays, filteredCount }: DisplaysFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { areas, isLoading: areasLoading } = useAreas();

  // Get initial values from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [areaId, setAreaId] = useState(searchParams.get('areaId') || 'all');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when filters change
  const updateFilters = useCallback(
    (newSearch: string, newStatus: string, newAreaId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newSearch) {
        params.set('search', newSearch);
      } else {
        params.delete('search');
      }

      if (newStatus && newStatus !== 'all') {
        params.set('status', newStatus);
      } else {
        params.delete('status');
      }

      if (newAreaId && newAreaId !== 'all') {
        params.set('areaId', newAreaId);
      } else {
        params.delete('areaId');
      }

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Update URL when debounced search or filters change
  useEffect(() => {
    updateFilters(debouncedSearch, status, areaId);
  }, [debouncedSearch, status, areaId, updateFilters]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setAreaId('all');
    router.push('/displays');
  };

  // Check if any filters are active
  const hasActiveFilters = debouncedSearch !== '' || status !== 'all' || areaId !== 'all';

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(237, 236, 228, 0.6) 0%, rgba(184, 143, 105, 0.3) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(37, 77, 110, 0.1)',
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search and filters */}
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          {/* Search input */}
          <div className="relative flex-1 md:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: '#254D6E' }}
            />
            <Input
              placeholder="Search displays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(37, 77, 110, 0.2)',
              }}
            />
          </div>

          {/* Status filter */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              className="w-full md:w-[180px]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(37, 77, 110, 0.2)',
              }}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={DisplayStatus.ONLINE}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </SelectItem>
              <SelectItem value={DisplayStatus.OFFLINE}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  Offline
                </span>
              </SelectItem>
              <SelectItem value={DisplayStatus.ERROR}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Error
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Area filter (NEW) */}
          <Select value={areaId} onValueChange={setAreaId} disabled={areasLoading}>
            <SelectTrigger
              className="w-full md:w-[200px]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(37, 77, 110, 0.2)',
              }}
            >
              <SelectValue placeholder={areasLoading ? 'Loading...' : 'All Areas'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                  {area._count && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({area._count.displays})
                    </span>
                  )}
                </SelectItem>
              ))}
              {areas.length === 0 && !areasLoading && (
                <SelectItem value="all" disabled>
                  No areas available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Results count and clear button */}
        <div className="flex items-center gap-4">
          {/* Results counter */}
          <div className="text-sm" style={{ color: '#254D6E' }}>
            Showing <span className="font-semibold">{filteredCount}</span> of{' '}
            <span className="font-semibold">{totalDisplays}</span> displays
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              style={{
                borderColor: '#254D6E',
                color: '#254D6E',
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
