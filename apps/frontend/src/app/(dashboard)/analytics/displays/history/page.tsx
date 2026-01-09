'use client';

/**
 * Display History Timeline Page
 * Shows detailed timeline for a specific display including state changes,
 * configuration changes, and playback history
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    History,
    Loader2,
    Monitor,
    AlertTriangle,
    Settings,
    Play,
    ArrowRight,
    Wifi,
    WifiOff,
    AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplays } from '@/hooks/useDisplays';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TimelineEvent {
    type: 'STATE_CHANGE' | 'PLAYBACK' | 'SOURCE_CHANGE' | 'CONFIG_CHANGE';
    id: string;
    timestamp: string;
    fromStatus?: string | null;
    toStatus?: string;
    trigger?: string;
    errorCode?: string;
    errorMessage?: string;
    sourceType?: string;
    contentId?: string;
    reason?: string;
    field?: string;
    oldValue?: string | null;
    newValue?: string | null;
    changedByName?: string;
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    ONLINE: Wifi,
    OFFLINE: WifiOff,
    ERROR: AlertCircle,
};

const statusColors: Record<string, string> = {
    ONLINE: 'bg-green-500/10 text-green-600 border-green-500/30',
    OFFLINE: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    ERROR: 'bg-red-500/10 text-red-600 border-red-500/30',
};

function TimelineItem({ event }: { event: TimelineEvent }) {
    const getIcon = () => {
        switch (event.type) {
            case 'STATE_CHANGE': {
                const StatusIcon = statusIcons[event.toStatus || 'OFFLINE'] || Monitor;
                return <StatusIcon className="h-4 w-4" />;
            }
            case 'CONFIG_CHANGE':
                return <Settings className="h-4 w-4" />;
            case 'PLAYBACK':
            case 'SOURCE_CHANGE':
                return <Play className="h-4 w-4" />;
            default:
                return <History className="h-4 w-4" />;
        }
    };

    const getContent = () => {
        switch (event.type) {
            case 'STATE_CHANGE':
                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">Status changed</span>
                        {event.fromStatus && (
                            <>
                                <Badge variant="outline" className={statusColors[event.fromStatus] || ''}>
                                    {event.fromStatus}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                        )}
                        <Badge variant="outline" className={statusColors[event.toStatus || 'OFFLINE'] || ''}>
                            {event.toStatus}
                        </Badge>
                        {event.trigger && (
                            <span className="text-xs text-muted-foreground">
                                via {event.trigger}
                            </span>
                        )}
                        {event.errorMessage && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {event.errorMessage}
                            </span>
                        )}
                    </div>
                );
            case 'CONFIG_CHANGE':
                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">
                            <strong>{event.field}</strong> changed
                        </span>
                        {event.oldValue && (
                            <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded">
                                {event.oldValue}
                            </span>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                            {event.newValue || '(empty)'}
                        </span>
                        {event.changedByName && (
                            <span className="text-xs text-muted-foreground">
                                by {event.changedByName}
                            </span>
                        )}
                    </div>
                );
            case 'PLAYBACK':
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Playback started</span>
                        <Badge variant="secondary">{event.sourceType}</Badge>
                    </div>
                );
            case 'SOURCE_CHANGE':
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Content source changed</span>
                        {event.reason && (
                            <span className="text-xs text-muted-foreground">
                                - {event.reason}
                            </span>
                        )}
                    </div>
                );
            default:
                return <span className="text-sm text-muted-foreground">Unknown event</span>;
        }
    };

    const getTypeColor = () => {
        switch (event.type) {
            case 'STATE_CHANGE':
                return 'bg-blue-500';
            case 'CONFIG_CHANGE':
                return 'bg-purple-500';
            case 'PLAYBACK':
            case 'SOURCE_CHANGE':
                return 'bg-emerald-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="flex gap-4">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${getTypeColor()}`} />
                <div className="w-0.5 flex-1 bg-border" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded bg-muted">
                        {getIcon()}
                    </div>
                    {getContent()}
                </div>
                <p className="text-xs text-muted-foreground">
                    {format(new Date(event.timestamp), 'PPpp')} •{' '}
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}

export default function DisplayHistoryPage() {
    const { user } = useAuth();
    const { displays, isLoading: displaysLoading } = useDisplays();
    const [selectedDisplayId, setSelectedDisplayId] = useState<string>('');

    // Fetch timeline for selected display
    const { data: timelineData, isLoading: timelineLoading, refetch } = useQuery({
        queryKey: ['displayTimeline', selectedDisplayId],
        queryFn: async () => {
            if (!selectedDisplayId) return null;
            const response = await authenticatedFetch(
                `${API_URL}/api/audit/displays/${selectedDisplayId}/timeline`
            );
            if (!response.ok) throw new Error('Failed to fetch timeline');
            const result = await response.json();
            return result.data;
        },
        enabled: !!selectedDisplayId && !!user,
    });

    // Fetch config history for selected display
    const { data: configData } = useQuery({
        queryKey: ['displayConfigHistory', selectedDisplayId],
        queryFn: async () => {
            if (!selectedDisplayId) return null;
            const response = await authenticatedFetch(
                `${API_URL}/api/audit/displays/${selectedDisplayId}/config-history`
            );
            if (!response.ok) throw new Error('Failed to fetch config history');
            const result = await response.json();
            return result.data;
        },
        enabled: !!selectedDisplayId && !!user,
    });

    // Combine and sort all events chronologically
    const allEvents: TimelineEvent[] = [
        ...(timelineData?.timeline || []),
        ...(configData?.history?.map((h: TimelineEvent) => ({
            ...h,
            type: 'CONFIG_CHANGE' as const,
            timestamp: h.timestamp || (h as any).createdAt,
        })) || []),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const selectedDisplay = displays?.find(d => d.id === selectedDisplayId);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" />
                    Display History
                </h1>
                <p className="text-muted-foreground">
                    View complete timeline of events for a display
                </p>
            </div>

            {/* Display Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[250px]">
                            <Select
                                value={selectedDisplayId}
                                onValueChange={setSelectedDisplayId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a display..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {displaysLoading ? (
                                        <div className="p-2 text-center">
                                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                        </div>
                                    ) : displays && displays.length > 0 ? (
                                        displays.map((display) => (
                                            <SelectItem key={display.id} value={display.id}>
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="h-4 w-4" />
                                                    {display.name} - {display.location}
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-muted-foreground">
                                            No displays found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedDisplayId && (
                            <Button
                                variant="outline"
                                onClick={() => refetch()}
                                disabled={timelineLoading}
                            >
                                {timelineLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Display Info */}
            {selectedDisplay && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Monitor className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold">{selectedDisplay.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedDisplay.location}
                                </p>
                            </div>
                            <Badge
                                variant={selectedDisplay.status === 'ONLINE' ? 'online' : 'offline'}
                            >
                                {selectedDisplay.status}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Timeline
                        {allEvents.length > 0 && (
                            <Badge variant="secondary">{allEvents.length} events</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!selectedDisplayId ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Select a display to view its history</p>
                        </div>
                    ) : timelineLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : allEvents.length > 0 ? (
                        <div className="max-h-[600px] overflow-y-auto pr-2">
                            {allEvents.map((event, index) => (
                                <TimelineItem key={event.id || index} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No history found for this display</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
