/**
 * Content Page
 * List and manage digital signage content
 */

'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileBox, Upload, AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { ContentList } from '@/components/content/ContentList';
import { ContentFilters } from '@/components/content/ContentFilters';
import { ContentCardSkeleton } from '@/components/content/ContentCardSkeleton';
import { UploadContentModal } from '@/components/content/UploadContentModal';
import { StatsCardSkeleton } from '@/components/displays/StatsCardSkeleton';
import { useContent } from '@/hooks/useContent';
import type { ContentFilter } from '@/lib/api/content';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build filter from URL params
  const filter = useMemo<ContentFilter>(() => {
    const contentFilter: ContentFilter = {};
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    if (search) contentFilter.search = search;
    if (type) contentFilter.type = type as any;
    if (status) contentFilter.status = status as any;

    return contentFilter;
  }, [searchParams]);

  // Fetch content and stats using custom hook
  const { contents, stats, isLoading, error, refetch } = useContent({
    filter,
  });

  // Derived values
  const totalContent = stats.total;
  const filteredCount = contents.length;
  const hasContent = totalContent > 0;

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSuccess = () => {
    // Refresh content list after successful upload
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">
            Manage your videos, images, and HTML content
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load content</p>
                <p className="text-sm text-red-600/80">{error.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure the backend is running on http://localhost:3001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <StatsCardSkeleton />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <FileBox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total === 0 ? 'No content uploaded yet' : 'Total content items'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.byType.videos}</div>
                <p className="text-xs text-muted-foreground">Video files</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Images</CardTitle>
                <div className="h-2 w-2 rounded-full bg-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.byType.images}</div>
                <p className="text-xs text-muted-foreground">Image files</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">HTML</CardTitle>
                <div className="h-2 w-2 rounded-full bg-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.byType.html}</div>
                <p className="text-xs text-muted-foreground">HTML content</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary Stats - Status */}
      <div className="grid gap-4 md:grid-cols-4">
        {!isLoading && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.byStatus.ready}</div>
                <p className="text-xs text-muted-foreground">Available for use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.byStatus.processing}</div>
                <p className="text-xs text-muted-foreground">Being processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error</CardTitle>
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.byStatus.error}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      {hasContent && (
        <ContentFilters
          totalContent={totalContent}
          filteredCount={filteredCount}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ContentCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {!hasContent && !error ? (
            <Card>
              <CardHeader>
                <CardTitle>All Content</CardTitle>
                <CardDescription>
                  View and manage all your content library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileBox className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No content yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get started by uploading your first video or image
                  </p>
                  <Button onClick={handleOpenModal}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Your First Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCount > 0 ? (
              <ContentList
                contents={contents}
                total={filteredCount}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <FileBox className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">No content found</h3>
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

      {/* Upload Content Modal */}
      <UploadContentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
