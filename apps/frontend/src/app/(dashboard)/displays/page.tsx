/**
 * Displays Page
 * List and manage digital signage displays
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Monitor, Plus, AlertCircle, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { DisplaysList } from '@/components/displays/DisplaysList';
import { DisplaysFilters } from '@/components/displays/DisplaysFilters';
import { CreateDisplayModal } from '@/components/displays/CreateDisplayModal';
import { getDisplays, getDisplayStats } from '@/lib/api/displays';
import type { Display, DisplayFilter } from '@shared-types';

export default function DisplaysPage() {
  const searchParams = useSearchParams();

  const [displays, setDisplays] = useState<Display[]>([]);
  const [totalDisplays, setTotalDisplays] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch displays and stats
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build filter from URL params
      const filter: DisplayFilter = {};
      const search = searchParams.get('search');
      const status = searchParams.get('status');

      if (search) filter.search = search;
      if (status) filter.status = status as any;

      // Fetch data
      const [displaysData, statsData] = await Promise.all([
        getDisplays(filter, { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
        getDisplayStats(),
      ]);

      setDisplays(displaysData.items);
      setFilteredCount(displaysData.meta.total);
      setStats(statsData);
      setTotalDisplays(statsData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load displays');
      setDisplays([]);
      setFilteredCount(0);
      setStats({ total: 0, online: 0, offline: 0, error: 0 });
      setTotalDisplays(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSuccess = () => {
    // Refresh displays list after successful creation
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasDisplays = totalDisplays > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Displays</h2>
          <p className="text-muted-foreground">
            Manage your digital signage displays
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Display
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load displays</p>
                <p className="text-sm text-red-600/80">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure the backend is running on http://localhost:3001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? 'No displays configured yet' : 'Total configured displays'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="h-2 w-2 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
            <p className="text-xs text-muted-foreground">Disconnected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {hasDisplays && (
        <DisplaysFilters
          totalDisplays={totalDisplays}
          filteredCount={filteredCount}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading displays...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {!hasDisplays && !error ? (
            <Card>
              <CardHeader>
                <CardTitle>All Displays</CardTitle>
                <CardDescription>
                  View and manage all your digital signage displays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Monitor className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No displays yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get started by adding your first display
                  </p>
                  <Button onClick={handleOpenModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Display
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCount > 0 ? (
              <DisplaysList
                initialDisplays={displays}
                initialTotal={filteredCount}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <Monitor className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">No displays found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters to see more results
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {/* Create Display Modal */}
      <CreateDisplayModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
