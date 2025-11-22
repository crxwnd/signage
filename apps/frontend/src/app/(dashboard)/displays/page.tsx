/**
 * Displays Page
 * List and manage digital signage displays
 */

import { Monitor, Plus, AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { DisplaysList } from '@/components/displays/DisplaysList';
import { getDisplays, getDisplayStats } from '@/lib/api/displays';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DisplaysPage() {
  // Fetch data server-side
  let displays;
  let stats;
  let error = null;

  try {
    [displays, stats] = await Promise.all([
      getDisplays({}, { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
      getDisplayStats(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load displays';
    displays = { items: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    stats = { total: 0, online: 0, offline: 0, error: 0 };
  }

  const hasDisplays = displays.items.length > 0;

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
        <Button>
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

      {/* Main Content */}
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Display
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DisplaysList
          initialDisplays={displays.items}
          initialTotal={displays.meta.total}
        />
      )}
    </div>
  );
}
