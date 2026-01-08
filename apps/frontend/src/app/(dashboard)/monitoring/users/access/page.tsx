'use client';

/**
 * Access & Permissions Page
 * Security overview: 2FA status, roles distribution
 */

import { useSecurityOverview, useUserActivityStats } from '@/hooks/useUserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AccessPermissionsPage() {
    const { data: security, isLoading: securityLoading } = useSecurityOverview();
    const { data: users, isLoading: usersLoading } = useUserActivityStats();

    const isLoading = securityLoading || usersLoading;

    // Calculate role distribution
    const roleDistribution = users?.reduce((acc, user) => {
        const role = user.userRole || 'UNKNOWN';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Access & Permissions
                </h1>
                <p className="text-muted-foreground">
                    Security overview and user access management
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Security Alerts */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className={security?.failedLogins24h ? 'border-red-500/50' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
                                        <p className="text-3xl font-bold">{security?.failedLogins24h ?? 0}</p>
                                    </div>
                                    <AlertTriangle className={`h-8 w-8 ${security?.failedLogins24h ? 'text-red-500' : 'text-muted-foreground'}`} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Active Sessions</p>
                                        <p className="text-3xl font-bold text-green-600">{security?.activeSessions ?? 0}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={security?.usersWithout2FA ? 'border-amber-500/50' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Users without 2FA</p>
                                        <p className="text-3xl font-bold">{security?.usersWithout2FA ?? 0}</p>
                                    </div>
                                    <Shield className={`h-8 w-8 ${security?.usersWithout2FA ? 'text-amber-500' : 'text-green-500'}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Role Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(roleDistribution).map(([role, count]) => (
                                    <div key={role} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                        <Badge variant="secondary">{role.replace(/_/g, ' ')}</Badge>
                                        <span className="font-semibold">{count} users</span>
                                    </div>
                                ))}
                                {Object.keys(roleDistribution).length === 0 && (
                                    <p className="text-muted-foreground">No users found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Access Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {users?.map((user) => (
                                    <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                {user.userName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{user.userName}</p>
                                                <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {user.userRole?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {user.totalActions} actions
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!users || users.length === 0) && (
                                    <p className="text-center text-muted-foreground py-4">No users found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
