'use client';

/**
 * Active Sessions Page
 * Monitor and manage active user sessions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Laptop, Loader2, LogOut, Smartphone, Monitor, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Laptop,
};

interface Session {
    id: string;
    sessionToken: string;
    status: string;
    ipAddress: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    startedAt: string;
    lastActiveAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export default function ActiveSessionsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['activeSessions'],
        queryFn: async () => {
            const response = await authenticatedFetch(`${API_URL}/api/audit/sessions`);
            if (!response.ok) throw new Error('Failed to fetch sessions');
            const result = await response.json();
            return result.data.sessions as Session[];
        },
        enabled: !!user && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
        refetchInterval: 30000,
    });

    const revokeMutation = useMutation({
        mutationFn: async (sessionToken: string) => {
            const response = await authenticatedFetch(
                `${API_URL}/api/audit/sessions/${sessionToken}/revoke`,
                { method: 'POST' }
            );
            if (!response.ok) throw new Error('Failed to revoke session');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
            toast.success('Session revoked successfully');
        },
        onError: () => {
            toast.error('Failed to revoke session');
        },
    });

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Laptop className="h-6 w-6 text-primary" />
                    Active Sessions
                </h1>
                <p className="text-muted-foreground">
                    Monitor and manage currently active user sessions
                </p>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Active Sessions</p>
                        <p className="text-3xl font-bold text-green-600">{data?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Desktop</p>
                        <p className="text-3xl font-bold">
                            {data?.filter((s) => s.deviceType === 'desktop').length || 0}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Mobile</p>
                        <p className="text-3xl font-bold">
                            {data?.filter((s) => s.deviceType === 'mobile').length || 0}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : data && data.length > 0 ? (
                        <div className="space-y-3">
                            {data.map((session) => {
                                const DeviceIcon = deviceIcons[session.deviceType || 'desktop'] || Globe;

                                return (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <DeviceIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{session.user.name}</p>
                                                <p className="text-sm text-muted-foreground">{session.user.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {session.user.role.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {session.browser} on {session.os}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-mono text-muted-foreground">
                                                {session.ipAddress || 'Unknown IP'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Active {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Started {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-red-600">
                                                    <LogOut className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will force logout {session.user.name} from their current session.
                                                        They will need to login again.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={() => revokeMutation.mutate(session.sessionToken)}
                                                    >
                                                        Revoke Session
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Laptop className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No active sessions</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
