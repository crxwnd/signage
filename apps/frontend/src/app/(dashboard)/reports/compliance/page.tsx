'use client';

/**
 * Compliance Reports Page
 * Security and compliance metrics (SUPER_ADMIN only)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ShieldCheck,
    Loader2,
    Filter,
    AlertTriangle,
    Users,
    KeyRound,
    Activity,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: '#EF4444',
    HOTEL_ADMIN: '#3B82F6',
    AREA_MANAGER: '#6B7280',
};

interface ComplianceData {
    securityMetrics: {
        usersWithout2FA: number;
        failedLoginsLast24h: number;
        activeSessionsCount: number;
    };
    auditSummary: {
        totalAuditLogs: number;
        criticalEvents: number;
        warningEvents: number;
        byCategory: Array<{ category: string; count: number }>;
    };
    accessControl: {
        roleDistribution: Array<{ role: string; count: number }>;
        hotelAdminCount: number;
        areaManagerCount: number;
    };
}

export default function CompliancePage() {
    const { user } = useAuth();
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: report, isLoading, refetch } = useQuery({
        queryKey: ['complianceReport', dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/compliance?${params}`);
            if (!response.ok) throw new Error('Failed to fetch compliance report');
            const result = await response.json();
            return result.data as ComplianceData;
        },
        enabled: !!user && user.role === 'SUPER_ADMIN',
    });

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground">
                            Compliance reports are only available to Super Administrators.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    Compliance Reports
                </h1>
                <p className="text-muted-foreground">
                    Security metrics, access control analysis, and compliance overview
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
                                className="w-[150px]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">To</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>

                        <Button variant="secondary" onClick={() => refetch()}>
                            <Filter className="h-4 w-4 mr-2" />
                            Apply
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : report ? (
                <>
                    {/* Security Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Users Without 2FA</p>
                                        <p className="text-3xl font-bold text-amber-600">
                                            {report.securityMetrics.usersWithout2FA}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-500/20">
                                        <KeyRound className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            {report.securityMetrics.failedLoginsLast24h}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-500/20">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Active Sessions</p>
                                        <p className="text-3xl font-bold">
                                            {report.securityMetrics.activeSessionsCount}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <Activity className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Critical Events</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            {report.auditSummary.criticalEvents}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {report.auditSummary.warningEvents} warnings
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-500/10">
                                        <ShieldCheck className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Role Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Role Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={report.accessControl.roleDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                dataKey="count"
                                                nameKey="role"
                                                label={({ role, count }) => `${role.replace('_', ' ')}: ${count}`}
                                            >
                                                {report.accessControl.roleDistribution.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={ROLE_COLORS[entry.role] || '#6B7280'}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Events by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.auditSummary.byCategory.map((cat) => (
                                        <div key={cat.category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">{cat.category}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, (cat.count / report.auditSummary.totalAuditLogs) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium w-12 text-right">{cat.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Audit Events</span>
                                        <span className="font-bold">{report.auditSummary.totalAuditLogs}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Access Control Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Control Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="text-center p-6 rounded-lg bg-muted/50">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-3xl font-bold">
                                        {report.accessControl.roleDistribution.reduce((sum, r) => sum + r.count, 0)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                </div>
                                <div className="text-center p-6 rounded-lg bg-blue-500/10">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                    <p className="text-3xl font-bold text-blue-600">
                                        {report.accessControl.hotelAdminCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Hotel Admins</p>
                                </div>
                                <div className="text-center p-6 rounded-lg bg-gray-500/10">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                                    <p className="text-3xl font-bold text-gray-600">
                                        {report.accessControl.areaManagerCount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Area Managers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Unable to load compliance data.</p>
                </div>
            )}
        </div>
    );
}
