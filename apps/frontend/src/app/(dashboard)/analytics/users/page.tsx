'use client';

/**
 * User Analytics Page
 * User activity tracking and analysis
 */

import { useUserAnalyticsOverview, useUserActivityStats, useRecentUserActivity } from '@/hooks/useUserAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Activity,
    LogIn,
    UserPlus,
    Loader2,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionLabels: Record<string, string> = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    CONTENT_UPLOAD: 'Uploaded content',
    CONTENT_DELETE: 'Deleted content',
    SCHEDULE_CREATE: 'Created schedule',
    ALERT_CREATE: 'Created alert',
    DISPLAY_CREATE: 'Added display',
    USER_CREATE: 'Created user',
    HOTEL_CREATE: 'Created hotel',
};

export default function UserAnalyticsPage() {
    const { user } = useAuth();
    const { data: overview, isLoading: overviewLoading } = useUserAnalyticsOverview();
    const { data: userStats, isLoading: statsLoading } = useUserActivityStats();
    const { data: recentActivity, isLoading: activityLoading } = useRecentUserActivity(20);

    const isLoading = overviewLoading || statsLoading || activityLoading;
    const canAccess = user?.role === 'SUPER_ADMIN' || user?.role === 'HOTEL_ADMIN';

    if (!canAccess) {
        return (
            <div className="container mx-auto py-6">
                <Card className="glass">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground">
                            Only Super Admins and Hotel Admins can view user analytics.
                        </p>
                    </CardContent>
                </Card>
            </div >
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    User Analytics
                </h1>
                <p className="text-muted-foreground">
                    Monitor user activity and engagement
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <p className="text-3xl font-bold">{overview?.totalUsers ?? 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Users (30d)</p>
                                <p className="text-3xl font-bold text-green-600">{overview?.activeUsers ?? 0}</p>
                            </div>
                            <Activity className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">New Users (30d)</p>
                                <p className="text-3xl font-bold text-blue-600">{overview?.newUsers ?? 0}</p>
                            </div>
                            <UserPlus className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Logins (30d)</p>
                                <p className="text-3xl font-bold text-amber-600">{overview?.totalLogins ?? 0}</p>
                            </div>
                            <LogIn className="h-8 w-8 text-amber-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* User Stats Table */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>User Activity Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {userStats?.slice(0, 10).map((userStat) => (
                                <div key={userStat.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">{userStat.userName}</p>
                                        <p className="text-sm text-muted-foreground">{userStat.userEmail}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary">{userStat.totalActions} actions</Badge>
                                        {userStat.lastActivity && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last: {formatDistanceToNow(new Date(userStat.lastActivity), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!userStats || userStats.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">No user data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">
                                            <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
                                            {' '}
                                            <span className="text-muted-foreground">
                                                {actionLabels[activity.action] || activity.action.toLowerCase().replace(/_/g, ' ')}
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!recentActivity || recentActivity.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Breakdown */}
            {overview?.actionBreakdown && overview.actionBreakdown.length > 0 && (
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Activity Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {overview.actionBreakdown.map(({ action, count }) => (
                                <Badge key={action} variant="outline" className="text-sm py-1 px-3">
                                    {action.replace(/_/g, ' ')}: {count}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
