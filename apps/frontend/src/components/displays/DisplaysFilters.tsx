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
  totalDisplays?: number;
  filteredCount?: number;
}

export function DisplaysFilters({ totalDisplays = 0, filteredCount = 0 }: DisplaysFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { areas, isLoading: areasLoading } = useAreas();

  // ESTADO: Solo para el texto (search)
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(initialSearch);

  // FUENTE DE LA VERDAD: URL
  const currentStatus = searchParams.get('status') || 'all';
  const currentAreaId = searchParams.get('areaId') || 'all';

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

  // Handlers directos
  const handleStatusChange = (val: string) => updateUrl({ status: val });
  const handleAreaChange = (val: string) => updateUrl({ areaId: val });
  
  const handleClearFilters = () => {
    setSearchValue('');
    router.push('/displays');
  };

  const hasActiveFilters = searchValue !== '' || currentStatus !== 'all' || currentAreaId !== 'all';

  return (
    <div className="rounded-lg p-4 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          
          {/* SEARCH */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search displays..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          {/* STATUS SELECT */}
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={DisplayStatus.ONLINE}>Online</SelectItem>
              <SelectItem value={DisplayStatus.OFFLINE}>Offline</SelectItem>
              <SelectItem value={DisplayStatus.ERROR}>Error</SelectItem>
            </SelectContent>
          </Select>

          {/* AREA SELECT (NUEVO) */}
          <Select 
            value={currentAreaId} 
            onValueChange={handleAreaChange}
            disabled={areasLoading}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-white">
              <SelectValue placeholder={areasLoading ? "Loading..." : "All Areas"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
              {areas.length === 0 && !areasLoading && (
                <SelectItem value="none" disabled>No areas found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* CLEAR BUTTON */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
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