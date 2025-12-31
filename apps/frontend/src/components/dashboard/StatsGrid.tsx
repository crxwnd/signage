'use client';

/**
 * StatsGrid Component
 * Grid of 4 stats cards for dashboard overview
 */

import { Monitor, Wifi, Film, Radio } from 'lucide-react';
import { StatsCard } from './StatsCard';
import type { DashboardStats } from '@/lib/api/dashboard';

interface StatsGridProps {
    stats: DashboardStats | undefined;
    isLoading?: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-[120px] rounded-2xl bg-muted/50 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Total Displays"
                value={stats?.displays.total ?? 0}
                icon={<Monitor className="h-6 w-6" />}
                description={`${stats?.displays.offline ?? 0} offline`}
            />
            <StatsCard
                title="Online Now"
                value={stats?.displays.online ?? 0}
                icon={<Wifi className="h-6 w-6" />}
                variant="success"
                description="Active connections"
            />
            <StatsCard
                title="Content Items"
                value={stats?.content.total ?? 0}
                icon={<Film className="h-6 w-6" />}
                description={`${stats?.content.videos ?? 0} videos, ${stats?.content.images ?? 0} images`}
            />
            <StatsCard
                title="Sync Groups"
                value={stats?.syncGroups.total ?? 0}
                icon={<Radio className="h-6 w-6" />}
                description={`${stats?.syncGroups.active ?? 0} active`}
            />
        </div>
    );
}
