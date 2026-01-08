'use client';

/**
 * User Activity Feed
 * Real-time feed of all user actions
 */

import { useRecentUserActivity } from '@/hooks/useUserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const actionColors: Record<string, string> = {
    LOGIN: 'bg-green-500/10 text-green-600 border-green-500/30',
    LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    LOGIN_FAILED: 'bg-red-500/10 text-red-600 border-red-500/30',
    CONTENT_UPLOAD: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    CONTENT_DELETE: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    SCHEDULE_CREATE: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    ALERT_CREATE: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    DISPLAY_CREATE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    DISPLAY_UPDATE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    DISPLAY_DELETE: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function ActivityFeedPage() {
    const { data: activities, isLoading, refetch, isFetching } = useRecentUserActivity(100);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        Activity Feed
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time feed of all user actions across the system
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Activity List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : activities && activities.length > 0 ? (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            className={actionColors[activity.action] || 'bg-gray-500/10'}
                                        >
                                            {activity.action.replace(/_/g, ' ')}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{activity.user?.name || 'Unknown User'}</p>
                                            <p className="text-xs text-muted-foreground">{activity.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                        {activity.resource && (
                                            <p className="text-xs text-muted-foreground">
                                                {activity.resource}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activity recorded yet</p>
                            <p className="text-sm">Activity will appear here as users perform actions</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
