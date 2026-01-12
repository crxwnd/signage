'use client';

/**
 * Home Dashboard Page - Enhanced Version
 * Comprehensive dashboard with KPIs, charts, activity feed, and more
 */

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Monitor,
    Wifi,
    WifiOff,
    AlertTriangle,
    Film,
    Bell,
    Users,
    Radio,
    Plus,
    Upload,
    Eye,
    FolderOpen,
    Activity,
    Server,
    Database,
    HardDrive,
    CheckCircle,
    Image,
    Video,
    Layers,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function HomePage() {
    const { user } = useAuth();

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/dashboard/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 30000,
    });

    // Format bytes
    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Card className="border-red-500/50">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p className="text-red-500">Error loading dashboard</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayData = stats?.displays || { total: 0, online: 0, offline: 0, error: 0 };
    const contentData = stats?.content || { total: 0, videos: 0, images: 0 };
    const onlinePercentage = displayData.total > 0
        ? Math.round((displayData.online / displayData.total) * 100)
        : 0;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-muted-foreground">
                        Here&apos;s what&apos;s happening with your signage network
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Updates every 30s
                </Badge>
            </div>

            {/* Primary KPIs - 4 columns */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Displays"
                    value={displayData.total}
                    subtitle={`${displayData.offline} offline`}
                    icon={Monitor}
                    href="/displays"
                    color="blue"
                />
                <KPICard
                    title="Online Now"
                    value={displayData.online}
                    subtitle={`${onlinePercentage}% uptime`}
                    icon={Wifi}
                    href="/displays?status=ONLINE"
                    color="green"
                />
                <KPICard
                    title="Content Items"
                    value={contentData.total}
                    subtitle={stats?.storage?.used || '0GB'}
                    icon={Film}
                    href="/content"
                    color="purple"
                />
                <KPICard
                    title="Active Alerts"
                    value={stats?.alerts?.active || 0}
                    subtitle={stats?.alerts?.active > 0 ? 'Requires attention' : 'All clear'}
                    icon={Bell}
                    href="/alerts"
                    color={stats?.alerts?.active > 0 ? 'red' : 'green'}
                />
            </div>

            {/* Secondary KPIs - 4 columns */}
            <div className="grid gap-4 md:grid-cols-4">
                <MiniKPI title="Sync Groups" value={typeof stats?.syncGroups === 'number' ? stats.syncGroups : 0} icon={Radio} href="/sync-groups" />
                <MiniKPI title="Areas" value={typeof stats?.areas === 'number' ? stats.areas : 0} icon={Layers} href="/areas" />
                <MiniKPI title="Users" value={stats?.users?.total || 0} icon={Users} href="/settings/users" />
                <MiniKPI
                    title="Errors"
                    value={displayData.error}
                    icon={AlertTriangle}
                    href="/displays?status=ERROR"
                    alert={displayData.error > 0}
                />
            </div>

            {/* Main Grid - 3 columns */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Display Health */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Display Health</CardTitle>
                        <CardDescription>Current status overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StatusBar label="Online" value={displayData.online} total={displayData.total || 1} color="green" />
                        <StatusBar label="Offline" value={displayData.offline} total={displayData.total || 1} color="gray" />
                        <StatusBar label="Error" value={displayData.error} total={displayData.total || 1} color="red" />

                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Health</span>
                                <span className={`font-medium ${onlinePercentage >= 90 ? 'text-green-500' : onlinePercentage >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {onlinePercentage}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Content Distribution</CardTitle>
                        <CardDescription>By type</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ContentTypeRow
                            icon={Video}
                            label="Videos"
                            value={contentData.videos}
                            total={contentData.total || 1}
                            color="blue"
                        />
                        <ContentTypeRow
                            icon={Image}
                            label="Images"
                            value={contentData.images}
                            total={contentData.total || 1}
                            color="purple"
                        />

                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Storage Used</span>
                                <span className="font-medium">{stats?.storage?.used || '0GB'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <QuickAction href="/displays" icon={Plus} label="Add Display" />
                        <QuickAction href="/content" icon={Upload} label="Upload Content" />
                        <QuickAction href="/displays" icon={Eye} label="View All Displays" />
                        <QuickAction href="/content" icon={FolderOpen} label="Manage Content" />
                        <QuickAction href="/sync-groups" icon={Radio} label="Sync Groups" />
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Grid - 2 columns */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentActivity?.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {stats.recentActivity.slice(0, 8).map((activity: any, index: number) => (
                                    <div key={activity.id || index} className="flex items-start gap-3 py-2 border-b last:border-0">
                                        <div className="p-2 rounded-full bg-muted">
                                            <Activity className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{activity.description || activity.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.userName || 'System'} • {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : 'Recently'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requires Attention */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Requires Attention
                        </CardTitle>
                        <CardDescription>Displays with issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(displayData.error > 0 || displayData.offline > 0) ? (
                            <div className="space-y-2">
                                {displayData.error > 0 && (
                                    <Link
                                        href="/displays?status=ERROR"
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            <div>
                                                <p className="text-sm font-medium">{displayData.error} displays with errors</p>
                                                <p className="text-xs text-muted-foreground">Click to view</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                )}
                                {displayData.offline > 0 && (
                                    <Link
                                        href="/displays?status=OFFLINE"
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <WifiOff className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium">{displayData.offline} displays offline</p>
                                                <p className="text-xs text-muted-foreground">Click to view</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                <p className="text-sm">All displays healthy</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* System Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <StatusPill icon={Server} label="Server" status={stats?.systemStatus?.server || 'online'} />
                        <StatusPill icon={Database} label="Database" status={stats?.systemStatus?.database ? 'connected' : 'error'} />
                        <StatusPill icon={Wifi} label="Connections" value={displayData.online} />
                        <StatusPill icon={HardDrive} label="Storage" value={stats?.storage?.used || '0GB'} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Subcomponents

function KPICard({ title, value, subtitle, icon: Icon, href, color }: {
    title: string;
    value: number;
    subtitle: string;
    icon: any;
    href: string;
    color: 'blue' | 'green' | 'purple' | 'red' | 'gray';
}) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        purple: 'bg-purple-500/10 text-purple-500',
        red: 'bg-red-500/10 text-red-500',
        gray: 'bg-gray-500/10 text-gray-500',
    };

    return (
        <Link href={href}>
            <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold mt-1">{value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        </div>
                        <div className={`p-3 rounded-full ${colors[color]}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function MiniKPI({ title, value, icon: Icon, href, alert }: {
    title: string;
    value: number;
    icon: any;
    href: string;
    alert?: boolean;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${alert ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <div>
                        <p className="text-xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{title}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function StatusBar({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: 'green' | 'gray' | 'red';
}) {
    const percentage = Math.round((value / total) * 100);
    const colors = {
        green: 'bg-green-500',
        gray: 'bg-gray-400',
        red: 'bg-red-500',
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">{value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${colors[color]} transition-all`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function ContentTypeRow({ icon: Icon, label, value, total, color }: {
    icon: any;
    label: string;
    value: number;
    total: number;
    color: 'blue' | 'purple';
}) {
    const percentage = Math.round((value / total) * 100);
    const colors = { blue: 'text-blue-500', purple: 'text-purple-500' };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${colors[color]}`} />
                    <span>{label}</span>
                </div>
                <span className="font-medium">{value}</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
        </div>
    );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string; }) {
    return (
        <Button variant="outline" className="w-full justify-start" asChild>
            <Link href={href}>
                <Icon className="h-4 w-4 mr-2" />
                {label}
            </Link>
        </Button>
    );
}

function StatusPill({ icon: Icon, label, status, value }: {
    icon: any;
    label: string;
    status?: string;
    value?: string | number;
}) {
    const isHealthy = status === 'online' || status === 'connected';

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{label}:</span>
            {value !== undefined ? (
                <span className="font-medium">{value}</span>
            ) : (
                <Badge variant="outline" className={isHealthy ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}>
                    {status}
                </Badge>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
        </div>
    );
}
