'use client';

/**
 * Audit Trail Page
 * Comprehensive audit log viewer with filtering
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FileText,
    Loader2,
    Search,
    Download,
    AlertTriangle,
    Info,
    AlertCircle,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const categories = [
    'ALL',
    'AUTHENTICATION',
    'CONTENT',
    'DISPLAY',
    'SCHEDULE',
    'ALERT',
    'USER',
    'SYSTEM',
];

const severityColors: Record<string, string> = {
    INFO: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    WARNING: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const severityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    INFO: Info,
    WARNING: AlertTriangle,
    CRITICAL: AlertCircle,
};

interface AuditLog {
    id: string;
    userId: string | null;
    actorType: string;
    action: string;
    category: string;
    severity: string;
    resource: string | null;
    resourceId: string | null;
    resourceName: string | null;
    description: string;
    oldData: unknown;
    newData: unknown;
    metadata: unknown;
    ipAddress: string | null;
    createdAt: string;
    user?: {
        name: string;
        email: string;
        role: string;
    };
}

export default function AuditTrailPage() {
    const { user } = useAuth();
    const [category, setCategory] = useState('ALL');
    const [severity, setSeverity] = useState('ALL');
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['auditLogs', category, severity],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (category !== 'ALL') params.append('category', category);
            if (severity !== 'ALL') params.append('severity', severity);
            params.append('limit', '200');

            const response = await authenticatedFetch(
                `${API_URL}/api/audit/logs?${params}`
            );
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const result = await response.json();
            return result.data;
        },
        enabled: !!user && ['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(user.role),
    });

    const filteredLogs = data?.logs?.filter((log: AuditLog) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            log.description.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.user?.name?.toLowerCase().includes(searchLower) ||
            log.resourceName?.toLowerCase().includes(searchLower)
        );
    });

    const exportLogs = () => {
        if (!filteredLogs) return;

        const csv = [
            ['Timestamp', 'User', 'Action', 'Category', 'Severity', 'Resource', 'Description', 'IP Address'].join(','),
            ...filteredLogs.map((log: AuditLog) => [
                format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                log.user?.name || 'System',
                log.action,
                log.category,
                log.severity,
                log.resourceName || log.resource || '',
                `"${log.description.replace(/"/g, '""')}"`,
                log.ipAddress || '',
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Audit Trail
                    </h1>
                    <p className="text-muted-foreground">
                        Complete audit log of all system activities
                    </p>
                </div>
                <Button variant="outline" onClick={exportLogs} disabled={!filteredLogs?.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat === 'ALL' ? 'All Categories' : cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Severities</SelectItem>
                                <SelectItem value="INFO">Info</SelectItem>
                                <SelectItem value="WARNING">Warning</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            {data && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total Logs</p>
                            <p className="text-2xl font-bold">{data.total}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Filtered</p>
                            <p className="text-2xl font-bold">{filteredLogs?.length || 0}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Audit Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            Failed to load audit logs
                        </div>
                    ) : filteredLogs && filteredLogs.length > 0 ? (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {filteredLogs.map((log: AuditLog) => {
                                const SeverityIcon = severityIcons[log.severity] || Info;
                                const isExpanded = expandedId === log.id;

                                return (
                                    <div
                                        key={log.id}
                                        className="border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div
                                            className="p-3 flex items-center gap-3 cursor-pointer"
                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}

                                            <Badge variant="outline" className={severityColors[log.severity]}>
                                                <SeverityIcon className="h-3 w-3 mr-1" />
                                                {log.severity}
                                            </Badge>

                                            <Badge variant="secondary">{log.category}</Badge>
                                            <Badge variant="outline">{log.action}</Badge>

                                            <div className="flex-1">
                                                <p className="text-sm">{log.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {log.user?.name || 'System'} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-10 pb-3 space-y-2 text-sm">
                                                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">User</p>
                                                        <p>{log.user?.name || 'System'}</p>
                                                        <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">IP Address</p>
                                                        <p className="font-mono">{log.ipAddress || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Resource</p>
                                                        <p>{log.resourceName || log.resource || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Timestamp</p>
                                                        <p>{format(new Date(log.createdAt), 'PPpp')}</p>
                                                    </div>
                                                </div>

                                                {(log.oldData || log.newData) && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {log.oldData && (
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">Previous State</p>
                                                                <pre className="text-xs bg-red-500/5 p-2 rounded overflow-auto max-h-32">
                                                                    {JSON.stringify(log.oldData, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {log.newData && (
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">New State</p>
                                                                <pre className="text-xs bg-green-500/5 p-2 rounded overflow-auto max-h-32">
                                                                    {JSON.stringify(log.newData, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
