'use client';

/**
 * Home Dashboard
 * Complete dashboard with real metrics, charts, and action items
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Monitor,
    Wifi,
    AlertTriangle,
    Film,
    Calendar,
    Bell,
    Activity,
    Users,
    ArrowRight,
    Clock,
    Plus,
    Upload,
    Layers,
    Radio,
    Server,
    Database,
    HardDrive,
    CheckCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_COLORS = {
    online: '#22c55e',
    offline: '#9ca3af',
    error: '#ef4444',
};

interface DashboardStats {
    displays: { total: number; online: number; offline: number; error: number };
    content: { total: number; videos: number; images: number; html: number };
    alerts: { active: number };
    schedules: { active: number };
    syncGroups: number;
    areas: number;
    users: { total: number };
    storage: { used: string; total: string; percentage: number };
}

interface DisplayAttention {
    id: string;
    name: string;
    location: string;
    status: string;
    lastSeen: string;
    lastError: string | null;
}

interface Alert {
    id: string;
    name: string;
    message: string;
    type: string;
}

interface ActivityItem {
    id: string;
    action: string;
    description: string;
    userName: string;
    createdAt: string;
}

export default function HomePage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    // Show error toast if user was redirected due to unauthorized access
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'unauthorized') {
            toast.error('No tienes permisos para acceder a esa sección');
            // Clean the URL without refresh
            window.history.replaceState({}, '', '/');
        }
    }, [searchParams]);

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/dashboard/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const json = await res.json();
            return json.data as DashboardStats;
        },
    });

    // Fetch displays needing attention
    const { data: displaysAttention } = useQuery({
        queryKey: ['displaysAttention'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/dashboard/displays-attention`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data || []) as DisplayAttention[];
        },
    });

    // Fetch active alerts
    const { data: activeAlerts } = useQuery({
        queryKey: ['activeAlerts'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/alerts?active=true&limit=5`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data || json.items || []) as Alert[];
        },
    });

    // Fetch recent activity
    const { data: recentActivity } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/analytics/activity?limit=8`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data || []) as ActivityItem[];
        },
    });

    if (statsLoading) {
        return <HomeSkeleton />;
    }

    // Data for pie chart
    const pieData = [
        { name: 'Online', value: stats?.displays?.online || 0, color: STATUS_COLORS.online },
        { name: 'Offline', value: stats?.displays?.offline || 0, color: STATUS_COLORS.offline },
        { name: 'Error', value: stats?.displays?.error || 0, color: STATUS_COLORS.error },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your signage network
                    </p>
                </div>
                <Badge variant="outline" className="w-fit text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(), 'PPp', { locale: es })}
                </Badge>
            </div>

            {/* Primary KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Displays"
                    value={stats?.displays?.total || 0}
                    subtitle={`${stats?.displays?.offline || 0} offline`}
                    icon={Monitor}
                    href="/displays"
                />
                <KPICard
                    title="Online Now"
                    value={stats?.displays?.online || 0}
                    subtitle={`${stats?.displays?.total ? Math.round((stats.displays.online / stats.displays.total) * 100) : 0}% active`}
                    icon={Wifi}
                    iconColor="text-green-500"
                    href="/displays?status=ONLINE"
                />
                <KPICard
                    title="Content Items"
                    value={stats?.content?.total || 0}
                    subtitle={`${stats?.content?.videos || 0} videos, ${stats?.content?.images || 0} images`}
                    icon={Film}
                    href="/content"
                />
                <KPICard
                    title="Active Alerts"
                    value={stats?.alerts?.active || 0}
                    subtitle={(stats?.alerts?.active || 0) > 0 ? 'Action required' : 'All clear'}
                    icon={Bell}
                    iconColor={(stats?.alerts?.active || 0) > 0 ? 'text-amber-500' : 'text-green-500'}
                    href="/alerts"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <MiniStat icon={Calendar} label="Active Schedules" value={stats?.schedules?.active || 0} href="/schedules" />
                <MiniStat icon={Radio} label="Sync Groups" value={stats?.syncGroups || 0} href="/sync-groups" />
                <MiniStat icon={Layers} label="Areas" value={stats?.areas || 0} href="/areas" />
                <MiniStat icon={Users} label="Users" value={stats?.users?.total || 0} href="/settings/users" />
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Display Status Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Display Status</CardTitle>
                        <Link href="/displays">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-col justify-center space-y-4">
                                {pieData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <QuickAction href="/displays" icon={Plus} label="Add Display" />
                        <QuickAction href="/content" icon={Upload} label="Upload Content" />
                        <QuickAction href="/displays" icon={Monitor} label="View All Displays" />
                        <QuickAction href="/alerts" icon={Bell} label="Create Alert" />
                        <QuickAction href="/schedules" icon={Calendar} label="New Schedule" />
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Displays Needing Attention */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Displays Requiring Attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {displaysAttention && displaysAttention.length > 0 ? (
                                displaysAttention.slice(0, 5).map((display) => (
                                    <Link href={`/displays/${display.id}`} key={display.id}>
                                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    display.status === 'ERROR' && "bg-red-500 animate-pulse",
                                                    display.status === 'OFFLINE' && "bg-gray-400"
                                                )} />
                                                <div>
                                                    <p className="font-medium text-sm">{display.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {display.lastError || `Last seen ${formatDistanceToNow(new Date(display.lastSeen || Date.now()), { addSuffix: true })}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={display.status === 'ERROR' ? 'destructive' : 'secondary'}>
                                                {display.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                    <p className="text-sm text-muted-foreground">All displays are operational!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Active Alerts
                        </CardTitle>
                        <Link href="/alerts">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeAlerts && activeAlerts.length > 0 ? (
                                activeAlerts.slice(0, 5).map((alert) => (
                                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <AlertTriangle className={cn(
                                            "h-5 w-5",
                                            alert.type === 'EMERGENCY' && "text-red-500",
                                            alert.type === 'WARNING' && "text-amber-500",
                                            alert.type === 'INFO' && "text-blue-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{alert.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                                        </div>
                                        <Badge variant={alert.type === 'EMERGENCY' ? 'destructive' : 'secondary'}>
                                            {alert.type}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                    <p className="text-sm text-muted-foreground">No active alerts</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Third Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent User Activity
                        </CardTitle>
                        <Link href="/monitoring/users/activity">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity && recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="font-medium">{activity.userName}</span>
                                                {' '}{activity.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Content Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Film className="h-5 w-5" />
                            Content Summary
                        </CardTitle>
                        <Link href="/content">
                            <Button variant="ghost" size="sm">
                                Manage <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <p className="text-3xl font-bold">{stats?.content?.videos || 0}</p>
                                    <p className="text-sm text-muted-foreground">Videos</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <p className="text-3xl font-bold">{stats?.content?.images || 0}</p>
                                    <p className="text-sm text-muted-foreground">Images</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Storage Used</span>
                                    <span className="font-medium">{stats?.storage?.used || '0GB'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-6">
                        <StatusIndicator label="Server" status="online" icon={Server} />
                        <StatusIndicator label="Database" status="connected" icon={Database} />
                        <StatusIndicator label="Redis" status="connected" icon={Server} />
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Storage:</span>
                            <span className="text-sm font-medium">
                                {stats?.storage?.used || '0GB'} / {stats?.storage?.total || '100GB'}
                            </span>
                            <Progress value={stats?.storage?.percentage || 0} className="w-24 h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Sub-components
function KPICard({ title, value, subtitle, icon: Icon, iconColor, href }: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    iconColor?: string;
    href: string;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold mt-1">{value}</p>
                            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                        </div>
                        <div className={cn("p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform", iconColor)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function MiniStat({ icon: Icon, label, value, href }: {
    icon: React.ElementType;
    label: string;
    value: number;
    href: string;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function QuickAction({ href, icon: Icon, label }: {
    href: string;
    icon: React.ElementType;
    label: string;
}) {
    return (
        <Link href={href}>
            <Button variant="outline" className="w-full justify-start gap-3 h-11">
                <Icon className="h-4 w-4" />
                {label}
            </Button>
        </Link>
    );
}

function StatusIndicator({ label, status, icon: Icon }: {
    label: string;
    status: string;
    icon: React.ElementType;
}) {
    const isOnline = status === 'online' || status === 'connected';
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{label}:</span>
            <Badge variant={isOnline ? 'default' : 'destructive'} className={cn(isOnline && "bg-green-500")}>
                {status}
            </Badge>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 w-64 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );
}
