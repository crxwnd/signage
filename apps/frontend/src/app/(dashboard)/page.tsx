'use client';

/**
 * Home Dashboard
 * Main dashboard with real metrics and modern design
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
    Monitor,
    Wifi,
    WifiOff,
    AlertTriangle,
    Film,
    Calendar,
    Bell,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowRight,
    Clock,
    Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const COLORS = {
    online: '#22c55e',
    offline: '#9ca3af',
    error: '#ef4444',
    primary: '#254D6E',
    secondary: '#B88F69',
};

export default function HomePage() {
    const { user } = useAuth();

    // Fetch display stats
    const { data: displayStats, isLoading: statsLoading } = useQuery({
        queryKey: ['displayStats'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/displays/stats`);
            if (!res.ok) return { total: 0, online: 0, offline: 0, error: 0 };
            return res.json();
        },
        staleTime: 30000,
    });

    // Fetch content stats  
    const { data: contentStats } = useQuery({
        queryKey: ['contentStats'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/content?limit=1`);
            if (!res.ok) return { meta: { total: 0 } };
            return res.json();
        },
        staleTime: 30000,
    });

    // Fetch recent displays
    const { data: recentDisplays } = useQuery({
        queryKey: ['recentDisplays'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/displays?limit=5&sortBy=updatedAt&sortOrder=desc`);
            if (!res.ok) return { items: [] };
            return res.json();
        },
    });

    // Fetch alerts
    const { data: alertsData } = useQuery({
        queryKey: ['activeAlerts'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/alerts?limit=5`);
            if (!res.ok) return { items: [] };
            return res.json();
        },
    });

    const stats = displayStats || { total: 0, online: 0, offline: 0, error: 0 };
    const contentTotal = contentStats?.meta?.total || 0;
    const displays = recentDisplays?.items || [];
    const alerts = alertsData?.items || [];

    if (statsLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your signage network today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(), 'PPp')}
                    </Badge>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Displays"
                    value={stats.total}
                    icon={Monitor}
                    color="primary"
                />
                <KPICard
                    title="Online Now"
                    value={stats.online}
                    icon={Wifi}
                    subtitle={`${stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% of total`}
                    color="success"
                />
                <KPICard
                    title="Offline"
                    value={stats.offline}
                    icon={WifiOff}
                    color="tertiary"
                />
                <KPICard
                    title="Content Items"
                    value={contentTotal}
                    icon={Film}
                    color="secondary"
                />
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Display Status Overview */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Display Status Overview</CardTitle>
                        <Link href="/displays">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Status Distribution */}
                            <div className="space-y-4">
                                {[
                                    { name: 'Online', value: stats.online, color: COLORS.online },
                                    { name: 'Offline', value: stats.offline, color: COLORS.offline },
                                    { name: 'Error', value: stats.error, color: COLORS.error },
                                ].map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Progress bars */}
                            <div className="space-y-4">
                                {[
                                    { name: 'Online', value: stats.online, total: stats.total, color: 'bg-green-500' },
                                    { name: 'Offline', value: stats.offline, total: stats.total, color: 'bg-gray-400' },
                                    { name: 'Error', value: stats.error, total: stats.total, color: 'bg-red-500' },
                                ].map((item) => (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span>{item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} transition-all duration-500`}
                                                style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/content" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <Film className="h-5 w-5 text-[#B88F69]" />
                                Upload Content
                            </Button>
                        </Link>
                        <Link href="/displays" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <Monitor className="h-5 w-5 text-[#254D6E]" />
                                Manage Displays
                            </Button>
                        </Link>
                        <Link href="/alerts" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <Bell className="h-5 w-5 text-amber-500" />
                                Create Alert
                            </Button>
                        </Link>
                        <Link href="/schedules" className="block">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <Calendar className="h-5 w-5 text-green-600" />
                                New Schedule
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Displays */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Displays
                        </CardTitle>
                        <Link href="/displays">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {displays.length > 0 ? (
                                displays.map((display: { id: string; name: string; location: string; status: string; lastSeen: string | null }) => (
                                    <Link key={display.id} href={`/displays/${display.id}`} className="block">
                                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${display.status === 'ONLINE' ? 'bg-green-500' :
                                                    display.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                                                    }`} />
                                                <div>
                                                    <p className="font-medium">{display.name}</p>
                                                    <p className="text-xs text-muted-foreground">{display.location}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-xs">
                                                    {display.status}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {display.lastSeen ? formatDistanceToNow(new Date(display.lastSeen), { addSuffix: true }) : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No displays found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Recent Alerts
                        </CardTitle>
                        <Link href="/alerts">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.length > 0 ? (
                                alerts.map((alert: { id: string; name?: string; title?: string; message?: string; type?: string; priority?: string }) => (
                                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <AlertTriangle className={`h-5 w-5 ${alert.type === 'EMERGENCY' || alert.priority === 'HIGH' ? 'text-red-500' :
                                            alert.type === 'WARNING' || alert.priority === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{alert.name || alert.title || 'Alert'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                                        </div>
                                        <Badge variant={alert.type === 'EMERGENCY' || alert.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                                            {alert.type || alert.priority || 'INFO'}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No alerts found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Overview (for admins) */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOTEL_ADMIN') && (
                <Card>
                    <CardHeader>
                        <CardTitle>System Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-6">
                            <SystemStat icon={Monitor} label="Total Displays" value={stats.total} />
                            <SystemStat icon={Film} label="Content Items" value={contentTotal} />
                            <SystemStat icon={Bell} label="Alerts" value={alerts.length} />
                            <SystemStat icon={Zap} label="Online Rate" value={`${stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%`} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Sub-components
function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    color = 'primary'
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    trend?: number;
    subtitle?: string;
    color?: 'primary' | 'secondary' | 'success' | 'tertiary';
}) {
    const colorClasses = {
        primary: 'bg-[#254D6E]/10 text-[#254D6E]',
        secondary: 'bg-[#B88F69]/10 text-[#B88F69]',
        success: 'bg-green-500/10 text-green-600',
        tertiary: 'bg-gray-500/10 text-gray-600',
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend !== undefined && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                <span>{Math.abs(trend)}% vs last week</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SystemStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
    return (
        <div className="text-center p-4 rounded-lg bg-muted/50">
            <Icon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-[300px] lg:col-span-2" />
                <Skeleton className="h-[300px]" />
            </div>
        </div>
    );
}
