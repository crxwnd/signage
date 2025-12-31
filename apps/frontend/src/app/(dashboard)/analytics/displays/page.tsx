'use client';

/**
 * Display Activity Analytics Page
 * Detailed metrics for each display
 */

import { useDisplayAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Loader2, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

type SortField = 'name' | 'uptimePercent' | 'hoursOnline' | 'disconnections' | 'bandwidthMB';
type SortOrder = 'asc' | 'desc';

export default function DisplayActivityPage() {
    const { data, isLoading, error } = useDisplayAnalytics();
    const [sortField, setSortField] = useState<SortField>('uptimePercent');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const sortedDisplays = data?.displays.slice().sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const modifier = sortOrder === 'asc' ? 1 : -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * modifier;
        }
        return ((aVal as number) - (bVal as number)) * modifier;
    });

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
                        Failed to load display analytics
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
                    <Monitor className="h-6 w-6 text-primary" />
                    Display Activity
                </h1>
                <p className="text-muted-foreground">
                    Detailed performance metrics for each display
                </p>
            </div>

            {/* Table */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">
                        All Displays ({data?.displays.length ?? 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground">
                                            Display <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Location</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                                        <button onClick={() => handleSort('uptimePercent')} className="flex items-center gap-1 hover:text-foreground ml-auto">
                                            Uptime <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                                        <button onClick={() => handleSort('hoursOnline')} className="flex items-center gap-1 hover:text-foreground ml-auto">
                                            Hours <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                                        <button onClick={() => handleSort('disconnections')} className="flex items-center gap-1 hover:text-foreground ml-auto">
                                            Disconnects <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                                        <button onClick={() => handleSort('bandwidthMB')} className="flex items-center gap-1 hover:text-foreground ml-auto">
                                            Bandwidth <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedDisplays?.map((display) => (
                                    <tr key={display.id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-3 font-medium">{display.name}</td>
                                        <td className="p-3 text-muted-foreground">{display.location}</td>
                                        <td className="p-3">
                                            <Badge variant={display.status === 'ONLINE' ? 'online' : 'offline'}>
                                                {display.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={display.uptimePercent >= 95 ? 'text-green-600' : display.uptimePercent >= 80 ? 'text-amber-600' : 'text-red-600'}>
                                                {display.uptimePercent}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground">{display.hoursOnline}h</td>
                                        <td className="p-3 text-right text-muted-foreground">{display.disconnections}</td>
                                        <td className="p-3 text-right text-muted-foreground">{Math.round(display.bandwidthMB / 1024 * 10) / 10} GB</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
