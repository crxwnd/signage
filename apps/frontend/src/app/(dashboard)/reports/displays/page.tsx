'use client';

/**
 * Display Reports Page
 * Comprehensive display analytics with charts and export
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
    MonitorCheck,
    Loader2,
    Download,
    Filter,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import {
    LineChart,
    Line,
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

const COLORS = ['#4CAF50', '#9E9E9E', '#F44336'];
const STATUS_COLORS: Record<string, string> = {
    ONLINE: '#4CAF50',
    OFFLINE: '#9E9E9E',
    ERROR: '#F44336',
};

interface DisplayMetric {
    id: string;
    name: string;
    location: string;
    areaName: string;
    hotelName: string;
    status: string;
    uptimePercent: number;
    totalPlaybackHours: number;
    contentChanges: number;
    errorCount: number;
    lastSeen: string | null;
}

interface DailyActivity {
    date: string;
    onlineCount: number;
    offlineCount: number;
    errorCount: number;
    playbackHours: number;
}

interface ReportData {
    summary: {
        totalDisplays: number;
        activeDisplays: number;
        offlineDisplays: number;
        errorDisplays: number;
        avgUptimePercent: number;
        totalPlaybackHours: number;
    };
    displayMetrics: DisplayMetric[];
    dailyActivity: DailyActivity[];
}

export default function DisplayReportsPage() {
    const { user } = useAuth();
    const [selectedHotel, setSelectedHotel] = useState<string>('all');
    const [selectedArea, setSelectedArea] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isExporting, setIsExporting] = useState(false);

    const { data: report, isLoading, refetch } = useQuery({
        queryKey: ['displayReport', selectedHotel, selectedArea, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedHotel !== 'all') params.append('hotelId', selectedHotel);
            if (selectedArea !== 'all') params.append('areaId', selectedArea);
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/displays?${params}`);
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
            if (selectedHotel !== 'all') params.append('hotelId', selectedHotel);
            if (selectedArea !== 'all') params.append('areaId', selectedArea);
            params.append('from', new Date(dateFrom).toISOString());
            params.append('to', new Date(dateTo).toISOString());

            const response = await authenticatedFetch(`${API_URL}/api/reports/displays/export?${params}`);
            if (!response.ok) throw new Error('Failed to export');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `display-report-${dateFrom}-to-${dateTo}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    // Prepare chart data
    const statusPieData = report
        ? [
            { name: 'Online', value: report.summary.activeDisplays, color: COLORS[0] },
            { name: 'Offline', value: report.summary.offlineDisplays, color: COLORS[1] },
            { name: 'Error', value: report.summary.errorDisplays, color: COLORS[2] },
        ]
        : [];

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MonitorCheck className="h-6 w-6 text-primary" />
                        Display Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Comprehensive analytics and performance metrics for all displays
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

                        {user?.role === 'SUPER_ADMIN' && (
                            <div className="space-y-1">
                                <label className="text-sm text-muted-foreground">Hotel</label>
                                <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Hotels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Hotels</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Area</label>
                            <Select value={selectedArea} onValueChange={setSelectedArea}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Areas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Areas</SelectItem>
                                </SelectContent>
                            </Select>
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
                                        <p className="text-sm text-muted-foreground">Total Displays</p>
                                        <p className="text-3xl font-bold">{report.summary.totalDisplays}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <MonitorCheck className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Online Now</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {report.summary.activeDisplays}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {report.summary.totalDisplays > 0
                                                ? Math.round(
                                                    (report.summary.activeDisplays / report.summary.totalDisplays) * 100
                                                )
                                                : 0}
                                            % of total
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-500/10">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Uptime</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {report.summary.avgUptimePercent}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-500/10">
                                        <TrendingUp className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-hover">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Error Displays</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            {report.summary.errorDisplays}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-500/10">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Status Distribution Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {statusPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Daily Activity Line Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Activity Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={report.dailyActivity}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="onlineCount"
                                                stroke="#4CAF50"
                                                name="Online Events"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="offlineCount"
                                                stroke="#9E9E9E"
                                                name="Offline Events"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="errorCount"
                                                stroke="#F44336"
                                                name="Error Events"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Playback Hours Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Playback Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.dailyActivity}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="playbackHours" fill="#254D6E" name="Playback Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Display Details Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Performance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Display
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Location
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Area
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Uptime
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Playback (h)
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Changes
                                            </th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                                                Errors
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.displayMetrics.map((display) => (
                                            <tr key={display.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">{display.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{display.location}</td>
                                                <td className="py-3 px-4">{display.areaName}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            backgroundColor: `${STATUS_COLORS[display.status]}20`,
                                                            color: STATUS_COLORS[display.status],
                                                            borderColor: `${STATUS_COLORS[display.status]}50`,
                                                        }}
                                                    >
                                                        {display.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={
                                                            display.uptimePercent >= 95
                                                                ? 'text-green-600'
                                                                : display.uptimePercent >= 80
                                                                    ? 'text-amber-600'
                                                                    : 'text-red-600'
                                                        }
                                                    >
                                                        {display.uptimePercent}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">{display.totalPlaybackHours}</td>
                                                <td className="py-3 px-4 text-center">{display.contentChanges}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {display.errorCount > 0 ? (
                                                        <Badge variant="destructive">{display.errorCount}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">0</span>
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
                    <MonitorCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available. Adjust your filters and try again.</p>
                </div>
            )}
        </div>
    );
}
