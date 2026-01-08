'use client';

/**
 * Login History Page
 * Track all login attempts (successful and failed)
 */

import { useLoginHistory } from '@/hooks/useUserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function LoginHistoryPage() {
    const { data: logins, isLoading } = useLoginHistory(200);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="h-6 w-6 text-primary" />
                    Login History
                </h1>
                <p className="text-muted-foreground">
                    Track all login attempts across the system
                </p>
            </div>

            {/* Login List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Logins</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logins && logins.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">IP Address</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logins.map((login) => (
                                        <tr key={login.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                {login.success ? (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Success
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Failed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm font-medium">{login.userName}</p>
                                                    <p className="text-xs text-muted-foreground">{login.userEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="text-xs">
                                                    {login.userRole?.replace(/_/g, ' ') || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                                                {login.ipAddress || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm">{formatDistanceToNow(new Date(login.timestamp), { addSuffix: true })}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(login.timestamp), 'MMM d, HH:mm')}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No login history yet</p>
                            <p className="text-sm">Login attempts will be recorded here</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
