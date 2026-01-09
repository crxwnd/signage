'use client';

/**
 * System Audit Page
 * Audit logs viewer with filtering
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
import { ClipboardList, Loader2, Filter, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DEFAULT_SEVERITY_CONFIG = { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Info };

const SEVERITY_COLORS: Record<string, { bg: string; text: string; icon: typeof Info }> = {
    INFO: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Info },
    WARNING: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: AlertTriangle },
    CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-600', icon: AlertCircle },
};

const CATEGORY_OPTIONS = [
    'AUTHENTICATION',
    'CONTENT',
    'DISPLAY',
    'SCHEDULE',
    'ALERT',
    'USER',
    'SYSTEM',
];

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
    createdAt: string;
    user?: {
        name: string;
        email: string;
    };
}

export default function SystemAuditPage() {
    const { user } = useAuth();
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState<string>('all');
    const [severity, setSeverity] = useState<string>('all');
    const [page, setPage] = useState(0);
    const limit = 50;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['auditLogs', dateFrom, dateTo, category, severity, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());
            if (category !== 'all') params.append('category', category);
            if (severity !== 'all') params.append('severity', severity);
            params.append('limit', limit.toString());
            params.append('offset', (page * limit).toString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/audit?${params}`);
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const result = await response.json();
            return result.data as { logs: AuditLog[]; total: number };
        },
        enabled: !!user,
    });

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    System Audit
                </h1>
                <p className="text-muted-foreground">
                    Complete audit trail of all system activities
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">From</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">To</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {CATEGORY_OPTIONS.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Severity</label>
                            <Select value={severity} onValueChange={setSeverity}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="INFO">Info</SelectItem>
                                    <SelectItem value="WARNING">Warning</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="secondary" onClick={() => { setPage(0); refetch(); }}>
                            <Filter className="h-4 w-4 mr-2" />
                            Apply
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {data && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Info className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.total}</p>
                                <p className="text-sm text-muted-foreground">Total Events</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {data.logs.filter((l) => l.severity === 'WARNING').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Warnings (this page)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {data.logs.filter((l) => l.severity === 'CRITICAL').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Critical (this page)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : data && data.logs.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Time
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                User
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Category
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Action
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Severity
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.logs.map((log) => {
                                            const severityConfig = SEVERITY_COLORS[log.severity] ?? DEFAULT_SEVERITY_CONFIG;
                                            const SeverityIcon = severityConfig.icon;
                                            return (
                                                <tr key={log.id} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="font-medium">
                                                            {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {log.user ? (
                                                            <div>
                                                                <div className="font-medium">{log.user.name}</div>
                                                                <div className="text-xs text-muted-foreground">{log.user.email}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">{log.actorType}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant="outline">{log.category}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant="secondary">{log.action}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded ${severityConfig.bg} ${severityConfig.text}`}
                                                        >
                                                            <SeverityIcon className="h-3 w-3" />
                                                            <span className="text-xs font-medium">{log.severity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm max-w-xs truncate">{log.description}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {page * limit + 1}-{Math.min((page + 1) * limit, data.total)} of{' '}
                                    {data.total}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page + 1) * limit >= data.total}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found for the selected filters.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
