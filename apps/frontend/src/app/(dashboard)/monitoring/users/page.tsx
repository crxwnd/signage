'use client';

/**
 * User Monitoring Overview
 * Dashboard principal de monitoreo de usuarios
 */

import { useUserAnalyticsOverview, useSecurityOverview } from '@/hooks/useUserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Activity,
    LogIn,
    UserPlus,
    Shield,
    Loader2,
    TrendingUp,
} from 'lucide-react';

export default function UserMonitoringOverviewPage() {
    const { data: overview, isLoading: overviewLoading } = useUserAnalyticsOverview();
    const { data: security, isLoading: securityLoading } = useSecurityOverview();

    const isLoading = overviewLoading || securityLoading;

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const engagementRate = overview?.totalUsers
        ? Math.round((overview.activeUsers / overview.totalUsers) * 100)
        : 0;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    User Monitoring
                </h1>
                <p className="text-muted-foreground">
                    Overview of user activity and security across the system
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <p className="text-3xl font-bold">{overview?.totalUsers ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Users (30d)</p>
                                <p className="text-3xl font-bold text-green-600">{overview?.activeUsers ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {engagementRate}% engagement
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Logins (30d)</p>
                                <p className="text-3xl font-bold text-blue-600">{overview?.totalLogins ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <LogIn className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">New Users (30d)</p>
                                <p className="text-3xl font-bold text-amber-600">{overview?.newUsers ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <UserPlus className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Security Overview */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5" />
                            Security Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Active Sessions</span>
                            <Badge variant="secondary">{security?.activeSessions ?? 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Failed Logins (24h)</span>
                            <Badge variant={security?.failedLogins24h ? 'destructive' : 'secondary'}>
                                {security?.failedLogins24h ?? 0}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Users without 2FA</span>
                            <Badge variant={security?.usersWithout2FA ? 'outline' : 'secondary'}>
                                {security?.usersWithout2FA ?? 0}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Users */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5" />
                            Most Active Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {overview?.topUsers?.slice(0, 5).map((user, index) => (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </div>
                                    <Badge variant="secondary">{user.actions} actions</Badge>
                                </div>
                            ))}
                            {(!overview?.topUsers || overview.topUsers.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No activity data yet. Activity will appear after users perform actions.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Breakdown */}
            {overview?.actionBreakdown && overview.actionBreakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {overview.actionBreakdown.map((item) => (
                                <Badge key={item.action} variant="outline" className="px-3 py-1">
                                    {item.action.replace(/_/g, ' ')}: {item.count}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
