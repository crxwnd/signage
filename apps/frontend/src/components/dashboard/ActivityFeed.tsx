'use client';

/**
 * ActivityFeed Component
 * Displays recent system activity in a timeline format
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Film, Radio, User, AlertCircle } from 'lucide-react';
import type { ActivityItem } from '@/lib/api/dashboard';

interface ActivityFeedProps {
    activities: ActivityItem[] | undefined;
    isLoading?: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
    display_connected: <Monitor className="h-4 w-4 text-green-600" />,
    display_disconnected: <Monitor className="h-4 w-4 text-gray-400" />,
    content_uploaded: <Film className="h-4 w-4 text-blue-600" />,
    content_deleted: <Film className="h-4 w-4 text-red-600" />,
    sync_started: <Radio className="h-4 w-4 text-primary" />,
    user_action: <User className="h-4 w-4 text-amber-600" />,
};

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
    if (isLoading) {
        return (
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-start">
                            <div className="p-2 rounded-full bg-muted/50">
                                {activityIcons[activity.type] || <AlertCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{activity.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatTimeAgo(activity.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
