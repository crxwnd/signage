'use client';

/**
 * Bandwidth Analytics Page
 * Bandwidth usage statistics and trends
 */

import { useBandwidthAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Loader2, TrendingUp, Calendar, HardDrive } from 'lucide-react';

export default function BandwidthPage() {
    const { data, isLoading, error } = useBandwidthAnalytics();

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
                        Failed to load bandwidth data
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
                    <Wifi className="h-6 w-6 text-primary" />
                    Bandwidth Usage
                </h1>
                <p className="text-muted-foreground">
                    Network bandwidth consumption analysis
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total (30 days)</p>
                                <p className="text-3xl font-bold text-primary">
                                    {data?.summary.totalGB ?? 0} GB
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <HardDrive className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Daily Average</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {Math.round((data?.summary.avgDailyMB ?? 0) / 1024 * 10) / 10} GB
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Projection</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {data?.summary.projectedMonthlyGB ?? 0} GB
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Chart */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Daily Usage (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-end gap-1">
                        {data?.daily.map((day, i) => {
                            const maxMB = Math.max(...(data?.daily.map(d => d.totalMB) || [1]));
                            const height = (day.totalMB / maxMB) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className="w-full bg-primary/30 rounded-t transition-all group-hover:bg-primary/50"
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{data?.daily[0]?.date.slice(5)}</span>
                        <span>{data?.daily[Math.floor((data?.daily.length || 0) / 2)]?.date.slice(5)}</span>
                        <span>{data?.daily[data?.daily.length - 1]?.date.slice(5)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Top Consumers */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Top Consumers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data?.byDisplay.slice(0, 10).map((display, i) => (
                            <div key={display.displayId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center">
                                        {i + 1}
                                    </Badge>
                                    <span className="font-medium">{display.name}</span>
                                </div>
                                <span className="text-muted-foreground">
                                    {Math.round(display.totalMB / 1024 * 10) / 10} GB
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
