'use client';

/**
 * Analytics Overview Page
 * Main analytics dashboard with KPIs and activity trends
 */

import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    Activity,
    Wifi,
    Monitor,
    Loader2,
    TrendingUp,
} from 'lucide-react';

export default function AnalyticsOverviewPage() {
    const { data, isLoading, error } = useAnalyticsOverview();

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Card className="glass">
                    <CardContent className="py-8 text-center text-destructive">
                        Failed to load analytics data
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Analytics Overview
                </h1>
                <p className="text-muted-foreground">
                    Monitor your signage network performance
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Uptime</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {data?.kpis.uptimePercent ?? 0}%
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Plays</p>
                                <p className="text-3xl font-bold text-primary">
                                    {data?.kpis.totalPlays ?? 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Activity className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Bandwidth</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {data?.kpis.bandwidthGB ?? 0} GB
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Wifi className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Displays</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {data?.kpis.activeDisplays ?? 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Monitor className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Chart Placeholder */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Activity Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-end gap-2">
                        {data?.activityTrend.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/30"
                                    style={{ height: `${(day.plays / 150) * 100}%`, minHeight: '20px' }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {day.date.slice(5)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Displays */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Top Displays by Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data?.topDisplays.map((display, i) => (
                            <div key={display.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center">
                                        {i + 1}
                                    </Badge>
                                    <span className="font-medium">{display.name}</span>
                                </div>
                                <span className="text-muted-foreground">{display.plays} plays</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
