'use client';

/**
 * User Reports Page
 * User activity analytics with charts and export
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    Loader2,
    Download,
    Filter,
    UserCheck,
    UserX,
    ShieldAlert,
    Activity,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: '#EF4444',
    HOTEL_ADMIN: '#3B82F6',
    AREA_MANAGER: '#6B7280',
};

interface UserMetric {
    id: string;
    name: string;
    email: string;
    role: string;
    hotelName: string | null;
    areaName: string | null;
    loginCount: number;
    totalActions: number;
    contentUploads: number;
    schedulesCreated: number;
    twoFactorEnabled: boolean;
}

interface ActionBreakdown {
    action: string;
    count: number;
}

interface ReportData {
    summary: {
        totalUsers: number;
        activeUsers: number;
        totalLogins: number;
        failedLogins: number;
        totalActions: number;
        usersWithout2FA: number;
    };
    userMetrics: UserMetric[];
    actionBreakdown: ActionBreakdown[];
}

export default function UserReportsPage() {
    const { user } = useAuth();
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isExporting, setIsExporting] = useState(false);

    const { data: report, isLoading, refetch } = useQuery({
        queryKey: ['userReport', dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/users?${params}`);
            if (!response.ok) throw new Error('Failed to fetch report');
            const data = await response.json();
            return data.data as ReportData;
        },
        enabled: !!user,
    });

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/users/export?${params}`);
            if (!response.ok) throw new Error('Failed to export');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-report-${dateFrom}-to-${dateTo}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        User Reports
                    </h1>
                    <p className="text-muted-foreground">
                        User activity analytics, login history, and action breakdown
                    </p>
                </div>
                <Button onClick={handleExport} disabled={!report || isExporting}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export Excel
                </Button>
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
                            Apply Filters
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
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Users</p>
                                        <p className="text-3xl font-bold">{report.summary.totalUsers}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {report.summary.activeUsers} active
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Logins</p>
                                        <p className="text-3xl font-bold text-green-600">{report.summary.totalLogins}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-500/10">
                                        <UserCheck className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Failed Logins</p>
                                        <p className="text-3xl font-bold text-red-600">{report.summary.failedLogins}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-500/10">
                                        <UserX className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Without 2FA</p>
                                        <p className="text-3xl font-bold text-amber-600">
                                            {report.summary.usersWithout2FA}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-500/10">
                                        <ShieldAlert className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Action Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Action Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={report.actionBreakdown.slice(0, 10)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="action" type="category" width={120} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#254D6E" name="Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="p-6 rounded-full bg-primary/10 inline-block">
                                            <Activity className="h-12 w-12 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-5xl font-bold">{report.summary.totalActions}</p>
                                            <p className="text-muted-foreground">Total Actions</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div>
                                                <p className="text-2xl font-semibold text-green-600">
                                                    {report.summary.totalLogins}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Logins</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-semibold text-red-600">
                                                    {report.summary.failedLogins}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Failed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* User Details Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Activity Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                User
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Email
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Role
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Logins
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Actions
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Uploads
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                2FA
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.userMetrics.map((u) => (
                                            <tr key={u.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">{u.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            backgroundColor: `${ROLE_COLORS[u.role] || '#6B7280'}20`,
                                                            color: ROLE_COLORS[u.role] || '#6B7280',
                                                            borderColor: `${ROLE_COLORS[u.role] || '#6B7280'}50`,
                                                        }}
                                                    >
                                                        {u.role.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-center">{u.loginCount}</td>
                                                <td className="py-3 px-4 text-center">{u.totalActions}</td>
                                                <td className="py-3 px-4 text-center">{u.contentUploads}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {u.twoFactorEnabled ? (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                                            Enabled
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                                                            Disabled
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available. Adjust your filters and try again.</p>
                </div>
            )}
        </div>
    );
}
