'use client';

/**
 * Report Builder Page
 * Custom report generator (placeholder for future expansion)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileBarChart, Download, Settings, Sparkles } from 'lucide-react';

interface ReportConfig {
    name: string;
    type: 'displays' | 'users' | 'content';
    dateFrom: string;
    dateTo: string;
    metrics: string[];
    includeCharts: boolean;
}

const AVAILABLE_METRICS = {
    displays: [
        { key: 'status', label: 'Current Status' },
        { key: 'uptime', label: 'Uptime Percentage' },
        { key: 'playbackHours', label: 'Playback Hours' },
        { key: 'contentChanges', label: 'Content Changes' },
        { key: 'errorCount', label: 'Error Count' },
    ],
    users: [
        { key: 'loginCount', label: 'Login Count' },
        { key: 'totalActions', label: 'Total Actions' },
        { key: 'contentUploads', label: 'Content Uploads' },
        { key: 'schedulesCreated', label: 'Schedules Created' },
        { key: 'twoFactorEnabled', label: '2FA Status' },
    ],
    content: [
        { key: 'playCount', label: 'Play Count' },
        { key: 'totalDuration', label: 'Total Duration' },
        { key: 'assignedDisplays', label: 'Assigned Displays' },
    ],
};

export default function ReportBuilderPage() {
    const [config, setConfig] = useState<ReportConfig>({
        name: 'Custom Report',
        type: 'displays',
        dateFrom: '',
        dateTo: '',
        metrics: [],
        includeCharts: true,
    });

    const handleMetricToggle = (metric: string) => {
        setConfig((prev) => ({
            ...prev,
            metrics: prev.metrics.includes(metric)
                ? prev.metrics.filter((m) => m !== metric)
                : [...prev.metrics, metric],
        }));
    };

    const handleGenerateReport = () => {
        // Navigate to the appropriate report page based on type
        if (config.type === 'displays') {
            window.location.href = `/reports/displays?from=${config.dateFrom}&to=${config.dateTo}`;
        } else if (config.type === 'users') {
            window.location.href = `/reports/users?from=${config.dateFrom}&to=${config.dateTo}`;
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileBarChart className="h-6 w-6 text-primary" />
                    Report Builder
                </h1>
                <p className="text-muted-foreground">
                    Create custom reports with the metrics and filters you need
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Report Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Report Type</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {(['displays', 'users', 'content'] as const).map((type) => (
                                    <Button
                                        key={type}
                                        variant={config.type === type ? 'default' : 'outline'}
                                        onClick={() => setConfig((prev) => ({ ...prev, type, metrics: [] }))}
                                        className="capitalize"
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Range */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Date Range</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">From Date</label>
                                    <Input
                                        type="date"
                                        value={config.dateFrom}
                                        onChange={(e) =>
                                            setConfig((prev) => ({ ...prev, dateFrom: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">To Date</label>
                                    <Input
                                        type="date"
                                        value={config.dateTo}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, dateTo: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metrics Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Select Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {AVAILABLE_METRICS[config.type]?.map((metric) => (
                                    <div key={metric.key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={metric.key}
                                            checked={config.metrics.includes(metric.key)}
                                            onCheckedChange={() => handleMetricToggle(metric.key)}
                                        />
                                        <label htmlFor={metric.key} className="text-sm cursor-pointer">
                                            {metric.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeCharts"
                                    checked={config.includeCharts}
                                    onCheckedChange={(checked) =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            includeCharts: checked as boolean,
                                        }))
                                    }
                                />
                                <label htmlFor="includeCharts" className="text-sm cursor-pointer">
                                    Include charts in export
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Panel */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Report Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Report Name</p>
                                <Input
                                    value={config.name}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter report name"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{config.type}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Selected Metrics</p>
                                <p className="font-medium">{config.metrics.length} metrics</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Date Range</p>
                                <p className="font-medium">
                                    {config.dateFrom && config.dateTo
                                        ? `${config.dateFrom} to ${config.dateTo}`
                                        : 'Not specified'}
                                </p>
                            </div>

                            <div className="pt-4 space-y-2">
                                <Button
                                    className="w-full"
                                    onClick={handleGenerateReport}
                                    disabled={!config.dateFrom || !config.dateTo}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Report
                                </Button>
                                <Button variant="outline" className="w-full" disabled>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Save as Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Reports</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => (window.location.href = '/reports/displays')}
                            >
                                Display Performance (30 days)
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => (window.location.href = '/reports/users')}
                            >
                                User Activity (30 days)
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => (window.location.href = '/reports/audit')}
                            >
                                Recent Audit Events
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
