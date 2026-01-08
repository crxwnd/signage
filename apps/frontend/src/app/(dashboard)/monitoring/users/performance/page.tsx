'use client';

/**
 * User Performance Page
 * Stats per user: activity count, content uploads, etc.
 */

import { useUserActivityStats } from '@/hooks/useUserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Loader2, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function UserPerformancePage() {
    const { data: users, isLoading } = useUserActivityStats();

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-primary" />
                    User Performance
                </h1>
                <p className="text-muted-foreground">
                    Individual user activity statistics and performance metrics
                </p>
            </div>

            {/* User Stats Table */}
            <Card>
                <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : users && users.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Total Actions</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Logins</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Uploads</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Schedules</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.userId} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{user.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="text-xs">
                                                    {user.userRole?.replace(/_/g, ' ') || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-semibold">{user.totalActions}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">{user.loginCount}</td>
                                            <td className="py-3 px-4 text-center">{user.contentUploads}</td>
                                            <td className="py-3 px-4 text-center">{user.schedulesCreated}</td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {user.lastActivity
                                                    ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })
                                                    : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No user statistics available</p>
                            <p className="text-sm">Stats will appear as users perform actions</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
