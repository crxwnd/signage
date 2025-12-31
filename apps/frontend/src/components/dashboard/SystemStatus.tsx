'use client';

/**
 * SystemStatus Component
 * Displays system health status indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Database, Cpu, HardDrive, Users } from 'lucide-react';
import type { DashboardStats } from '@/lib/api/dashboard';

interface SystemStatusProps {
    status: DashboardStats['systemStatus'] | undefined;
    isLoading?: boolean;
}

export function SystemStatus({ status, isLoading }: SystemStatusProps) {
    if (isLoading) {
        return (
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-16 animate-pulse bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    const storagePercent = status
        ? Math.round((status.storageUsed / status.storageTotal) * 100)
        : 0;

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4">
                    {/* Server Status */}
                    <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Server:</span>
                        <Badge variant={status?.server === 'online' ? 'online' : 'error'}>
                            {status?.server || 'Unknown'}
                        </Badge>
                    </div>

                    {/* Database */}
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Database:</span>
                        <Badge variant={status?.database ? 'online' : 'error'}>
                            {status?.database ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>

                    {/* Redis */}
                    <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Redis:</span>
                        <Badge variant={status?.redis ? 'online' : 'error'}>
                            {status?.redis ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>

                    {/* Socket Connections */}
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Connections:</span>
                        <Badge variant="secondary">
                            {status?.socketConnections ?? 0}
                        </Badge>
                    </div>

                    {/* Storage */}
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Storage:</span>
                        <Badge variant={storagePercent > 90 ? 'warning' : 'secondary'}>
                            {status?.storageUsed ?? 0}GB / {status?.storageTotal ?? 0}GB ({storagePercent}%)
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
