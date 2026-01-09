'use client';

/**
 * User Profile Page
 * Shows complete user history, activity, and statistics
 */

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    User,
    Calendar,
    Clock,
    Activity,
    Shield,
    LogIn,
    Mail,
    Building,
    MapPin,
    TrendingUp,
    AlertCircle,
    ArrowLeft,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROLE_COLORS = {
    SUPER_ADMIN: 'bg-red-500/10 text-red-600 border-red-500/30',
    HOTEL_ADMIN: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    AREA_MANAGER: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    HOTEL_ADMIN: 'Hotel Admin',
    AREA_MANAGER: 'Area Manager',
};

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    // Fetch user details
    const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/users/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        },
    });

    // Fetch user timeline/activity
    const { data: timelineData } = useQuery({
        queryKey: ['userTimeline', userId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/audit/users/${userId}/timeline`);
            if (!res.ok) return { data: { activityLogs: [], sessions: [], auditLogs: [] } };
            return res.json();
        },
    });

    if (userLoading) {
        return <UserProfileSkeleton />;
    }

    const user = userData?.data || userData;

    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">User not found</h2>
                    <p className="text-muted-foreground">The user you&apos;re looking for doesn&apos;t exist.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const timeline = timelineData?.data || { activityLogs: [], sessions: [], auditLogs: [] };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            {/* Header Card */}
            <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-[#254D6E] via-[#3a6d94] to-[#254D6E]" />
                <CardContent className="relative pt-0">
                    <div className="flex flex-col md:flex-row gap-6 -mt-16">
                        {/* Avatar */}
                        <div className="h-32 w-32 rounded-full border-4 border-background shadow-lg bg-gradient-to-br from-[#254D6E] to-[#B88F69] flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-4 md:pt-16">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">{user.name}</h1>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        <Mail className="h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}>
                                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                                    </Badge>
                                    {user.twoFactorEnabled && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                            <Shield className="h-3 w-3 mr-1" />
                                            2FA
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <StatBox label="Total Sessions" value={timeline.sessions?.length || 0} />
                                <StatBox label="Activity Count" value={timeline.activityLogs?.length || 0} />
                                <StatBox label="Audit Logs" value={timeline.auditLogs?.length || 0} />
                                <StatBox
                                    label="Member Since"
                                    value={format(new Date(user.createdAt), 'PP')}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Building} label="Hotel" value={user.hotel?.name || 'All Hotels (Super Admin)'} />
                        <InfoRow icon={MapPin} label="Area" value={user.area?.name || 'All Areas'} />
                        <InfoRow
                            icon={Calendar}
                            label="Member Since"
                            value={format(new Date(user.createdAt), 'PPP', { locale: es })}
                        />
                        <InfoRow
                            icon={Clock}
                            label="Last Updated"
                            value={formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                        />
                    </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Recent Activity Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>User activity chart</p>
                                <p className="text-sm">Activity tracking data will appear here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for History */}
            <Card>
                <Tabs defaultValue="activity" className="w-full">
                    <CardHeader className="pb-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                            <TabsTrigger value="sessions">Sessions</TabsTrigger>
                            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TabsContent value="activity" className="mt-0">
                            <ActivityTimeline activities={timeline.activityLogs || []} />
                        </TabsContent>
                        <TabsContent value="sessions" className="mt-0">
                            <SessionsHistory sessions={timeline.sessions || []} />
                        </TabsContent>
                        <TabsContent value="audit" className="mt-0">
                            <AuditHistory logs={timeline.auditLogs || []} />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}

// Helper Components
function StatBox({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

function ActivityTimeline({ activities }: { activities: Array<{ id?: string; action: string; resource?: string; resourceId?: string; createdAt: string }> }) {
    if (!activities.length) {
        return <EmptyState message="No activity recorded yet" />;
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {activities.slice(0, 50).map((activity, index) => (
                <div key={activity.id || index} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium">{formatActivityAction(activity.action)}</p>
                        <p className="text-sm text-muted-foreground">
                            {activity.resource && `${activity.resource} `}
                            {activity.resourceId && `(${activity.resourceId.slice(0, 8)}...)`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SessionsHistory({ sessions }: { sessions: Array<{ id: string; deviceType?: string; browser?: string; os?: string; ipAddress?: string; status: string; startedAt: string }> }) {
    if (!sessions.length) {
        return <EmptyState message="No sessions recorded" />;
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <LogIn className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{session.deviceType || 'Unknown Device'}</p>
                            <p className="text-xs text-muted-foreground">
                                {session.browser} on {session.os} • {session.ipAddress}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {session.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(session.startedAt), 'PPp')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function AuditHistory({ logs }: { logs: Array<{ id: string; action: string; description?: string; resource?: string; createdAt: string }> }) {
    if (!logs.length) {
        return <EmptyState message="No audit logs found" />;
    }

    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Badge variant="outline" className="mt-1">
                        {log.action}
                    </Badge>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.description || 'Action performed'}</p>
                        <p className="text-xs text-muted-foreground">
                            {log.resource} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function UserProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-24" />
            <Card>
                <Skeleton className="h-32 w-full" />
                <CardContent className="pt-6">
                    <div className="flex gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="grid grid-cols-4 gap-4 mt-6">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-20" />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function formatActivityAction(action: string): string {
    const actions: Record<string, string> = {
        LOGIN: 'Logged in',
        LOGOUT: 'Logged out',
        LOGIN_FAILED: 'Failed login attempt',
        CONTENT_UPLOAD: 'Uploaded content',
        CONTENT_DELETE: 'Deleted content',
        SCHEDULE_CREATE: 'Created schedule',
        SCHEDULE_UPDATE: 'Updated schedule',
        ALERT_CREATE: 'Created alert',
        DISPLAY_UPDATE: 'Updated display',
        USER_CREATE: 'Created user',
        USER_UPDATE: 'Updated user',
    };
    return actions[action] || action;
}
