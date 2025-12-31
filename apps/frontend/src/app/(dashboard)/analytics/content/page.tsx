'use client';

/**
 * Content Performance Analytics Page
 * Content playback statistics and rankings
 */

import { useContentAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film, Loader2, Play, Clock, Monitor, Image, Code } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
    VIDEO: <Film className="h-4 w-4" />,
    IMAGE: <Image className="h-4 w-4" />,
    HTML: <Code className="h-4 w-4" />,
};

export default function ContentPerformancePage() {
    const { data, isLoading, error } = useContentAnalytics();

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
                        Failed to load content analytics
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Summary stats
    const totalPlays = data?.content.reduce((sum, c) => sum + c.plays, 0) ?? 0;
    const avgCompletion = Math.round(
        (data?.content.reduce((sum, c) => sum + c.completionRate, 0) ?? 0) /
        (data?.content.length || 1)
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Film className="h-6 w-6 text-primary" />
                    Content Performance
                </h1>
                <p className="text-muted-foreground">
                    Analyze how your content is performing
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Content</p>
                                <p className="text-3xl font-bold text-primary">
                                    {data?.content.length ?? 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Film className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Plays</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {totalPlays}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Play className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Completion</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {avgCompletion}%
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Ranking Table */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Content Ranking by Plays</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rank</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Content</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Plays</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Completion</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Avg Duration</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Displays</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.content.map((content, i) => (
                                    <tr key={content.id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-3">
                                            <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center">
                                                {i + 1}
                                            </Badge>
                                        </td>
                                        <td className="p-3 font-medium">{content.name}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                {typeIcons[content.type]}
                                                <span className="text-sm">{content.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-medium">{content.plays}</td>
                                        <td className="p-3 text-right">
                                            <span className={content.completionRate >= 80 ? 'text-green-600' : content.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                                                {content.completionRate}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground">{content.avgDuration}s</td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                {content.displaysCount}
                                            </div>
                                        </td>
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
