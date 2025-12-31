'use client';

/**
 * Home Dashboard Page
 * Main dashboard with stats, activity feed, quick actions, and system status
 */

import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SystemStatus } from '@/components/dashboard/SystemStatus';

export default function HomePage() {
    const { user } = useAuth();
    const { data: stats, isLoading, error } = useDashboardStats();

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Welcome Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                    Welcome back{user?.name ? `, ${user.name}` : ''}
                </h1>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your signage network
                </p>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} isLoading={isLoading} />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Activity Feed - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <ActivityFeed
                        activities={stats?.recentActivity}
                        isLoading={isLoading}
                    />
                </div>

                {/* Quick Actions - Takes 1 column */}
                <div>
                    <QuickActions />
                </div>
            </div>

            {/* System Status */}
            <SystemStatus
                status={stats?.systemStatus}
                isLoading={isLoading}
            />

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    Failed to load dashboard data. Please try refreshing the page.
                </div>
            )}
        </div>
    );
}
