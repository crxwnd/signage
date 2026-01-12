'use client';

/**
 * Display Profile Page
 * Shows complete display history, status, and configuration
 */

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Monitor,
    Wifi,
    WifiOff,
    AlertTriangle,
    Calendar,
    Activity,
    Settings,
    Play,
    RefreshCw,
    MapPin,
    Building,
    Layers,
    History,
    FileText,
    Zap,
    TrendingUp,
    ArrowLeft,
    Link2,
    QrCode,
    Copy,
    Edit,
    ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { authenticatedFetch } from '@/lib/api/auth';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
    ONLINE: { color: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-600', icon: Wifi },
    OFFLINE: { color: '#9ca3af', bg: 'bg-gray-500/10', text: 'text-gray-600', icon: WifiOff },
    ERROR: { color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-600', icon: AlertTriangle },
};

export default function DisplayProfilePage() {
    const params = useParams();
    const router = useRouter();
    const displayId = params.id as string;

    // Fetch display details
    const { data: displayData, isLoading: displayLoading } = useQuery({
        queryKey: ['display', displayId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/displays/${displayId}`);
            if (!res.ok) throw new Error('Failed to fetch display');
            return res.json();
        },
    });

    // Fetch display playlist
    const { data: playlistData } = useQuery({
        queryKey: ['displayPlaylist', displayId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/playlists/${displayId}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
    });

    // Fetch display timeline
    const { data: timelineData } = useQuery({
        queryKey: ['displayTimeline', displayId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/audit/displays/${displayId}/timeline`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
    });

    if (displayLoading) {
        return <DisplayProfileSkeleton />;
    }

    const display = displayData?.data || displayData;

    if (!display) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Display not found</h2>
                    <p className="text-muted-foreground">The display you&apos;re looking for doesn&apos;t exist.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const StatusIcon = STATUS_CONFIG[display.status as keyof typeof STATUS_CONFIG]?.icon || Monitor;
    const statusConfig = STATUS_CONFIG[display.status as keyof typeof STATUS_CONFIG];
    // Handle different API response structures
    const playlist = Array.isArray(playlistData?.data)
        ? playlistData.data
        : Array.isArray(playlistData)
            ? playlistData
            : [];
    const timeline = Array.isArray(timelineData?.data)
        ? timelineData.data
        : Array.isArray(timelineData)
            ? timelineData
            : [];

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Displays
            </Button>

            {/* Header Card */}
            <Card className="overflow-hidden">
                <div className={`h-24 bg-gradient-to-r ${display.status === 'ONLINE' ? 'from-green-500 to-emerald-600' :
                    display.status === 'ERROR' ? 'from-red-500 to-rose-600' :
                        'from-gray-400 to-gray-500'
                    }`} />
                <CardContent className="relative pt-0">
                    <div className="flex flex-col md:flex-row gap-6 -mt-12">
                        {/* Status Icon */}
                        <div className={`h-24 w-24 rounded-2xl border-4 border-background shadow-lg flex items-center justify-center ${statusConfig?.bg}`}>
                            <StatusIcon className={`h-12 w-12 ${statusConfig?.text}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2 md:pt-12">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">{display.name}</h1>
                                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {display.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Monitor className="h-4 w-4" />
                                            {display.orientation || 'horizontal'} • {display.resolution || '1920x1080'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`${statusConfig?.bg} ${statusConfig?.text}`}>
                                        {display.status}
                                    </Badge>
                                    {display.status === 'ERROR' && (
                                        <Button size="sm" onClick={() => toast.info('Retry command sent')}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Retry
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                <StatBox label="Content Items" value={playlist.length} />
                                <StatBox label="Errors (24h)" value={display.errorCount || 0} />
                                <StatBox
                                    label="Last Seen"
                                    value={display.lastSeen ? formatDistanceToNow(new Date(display.lastSeen), { addSuffix: true }) : 'Never'}
                                />
                                <StatBox
                                    label="Created"
                                    value={format(new Date(display.createdAt), 'PP')}
                                />
                                <StatBox
                                    label="Paired"
                                    value={display.pairedAt ? format(new Date(display.pairedAt), 'PP') : 'Not paired'}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Details (if ERROR status) */}
            {display.status === 'ERROR' && display.lastError && (
                <Card className="border-red-500/50 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Current Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Error Code</p>
                                <p className="font-mono font-bold text-red-600">{display.lastErrorCode || 'UNKNOWN'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Error Message</p>
                                <p className="font-medium">{display.lastError}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Occurred At</p>
                                <p className="font-medium">
                                    {display.lastErrorAt ? format(new Date(display.lastErrorAt), 'PPpp') : 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Error Count</p>
                                <p className="font-medium">{display.errorCount || 0} occurrences</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Display Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Building} label="Hotel" value={display.hotel?.name} />
                        <InfoRow icon={Layers} label="Area" value={display.area?.name || 'Unassigned'} />
                        <InfoRow icon={Monitor} label="Orientation" value={display.orientation || 'horizontal'} />
                        <InfoRow icon={Zap} label="Resolution" value={display.resolution || '1920x1080'} />
                        <InfoRow icon={Calendar} label="Created" value={format(new Date(display.createdAt), 'PPP')} />
                    </CardContent>
                </Card>

                {/* Stats Chart Placeholder */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Status History (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Status history data will appear here</p>
                                <p className="text-sm">Charts require playback data</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vinculación y Edición */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Vinculación y Configuración
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Link Directo */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Link Directo del Player</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs p-2 rounded bg-background border truncate">
                                    {`${typeof window !== 'undefined' ? window.location.origin.replace('3000', '3002') : 'http://localhost:3002'}/?displayId=${displayId}`}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const url = `${window.location.origin.replace('3000', '3002')}/?displayId=${displayId}`;
                                        navigator.clipboard.writeText(url);
                                        toast.success('Link copiado al portapapeles');
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Usa este link para acceder directamente al player de esta pantalla
                            </p>
                        </div>

                        {/* QR y Vinculación */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 mb-2">
                                <QrCode className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">Sistema de Vinculación</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Para vincular una nueva pantalla, accede a:
                            </p>
                            <code className="block text-xs p-2 rounded bg-background border mb-2">
                                {typeof window !== 'undefined' ? window.location.origin.replace('3000', '3002') : 'http://localhost:3002'}/vinculacion
                            </code>
                            <p className="text-xs text-muted-foreground">
                                Muestra código QR, código único y link para vincular
                            </p>
                        </div>

                        {/* Editar Configuración */}
                        <div className="p-4 rounded-lg border bg-muted/30 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Edit className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">Editar Configuración</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toast.info('Función de edición próximamente')}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Display
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Nombre:</span>
                                    <p className="font-medium">{display.name}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Ubicación:</span>
                                    <p className="font-medium">{display.location || 'Sin definir'}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Orientación:</span>
                                    <p className="font-medium">{display.orientation || 'horizontal'}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Resolución:</span>
                                    <p className="font-medium">{display.resolution || '1920x1080'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for History */}
            <Card>
                <Tabs defaultValue="playlist" className="w-full">
                    <CardHeader className="pb-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="playlist">Current Playlist</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="config">Config Changes</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TabsContent value="playlist" className="mt-0">
                            <PlaylistView playlist={playlist} />
                        </TabsContent>
                        <TabsContent value="timeline" className="mt-0">
                            <TimelineView timeline={timeline} />
                        </TabsContent>
                        <TabsContent value="config" className="mt-0">
                            <ConfigHistory displayId={displayId} />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}

// Helper components
function StatBox({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold truncate">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | undefined }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

function PlaylistView({ playlist }: { playlist: Array<{ id: string; content?: { name?: string; type?: string; duration?: number; thumbnailUrl?: string } }> }) {
    if (!playlist.length) {
        return (
            <div className="text-center py-12">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No content assigned to this display</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {playlist.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                    </div>
                    <div className="w-16 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                        {item.content?.thumbnailUrl ? (
                            <img src={item.content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{item.content?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                            {item.content?.type} • {item.content?.duration ? `${item.content.duration}s` : 'N/A'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TimelineView({ timeline }: { timeline: Array<{ type?: string; fromStatus?: string; toStatus?: string; reason?: string; timestamp: string }> }) {
    if (!timeline.length) {
        return (
            <div className="text-center py-12">
                <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No timeline events recorded</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {timeline.slice(0, 50).map((event, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'STATE_CHANGE' ? 'bg-blue-500/10' :
                        event.type === 'PLAYBACK' ? 'bg-green-500/10' : 'bg-gray-500/10'
                        }`}>
                        {event.type === 'STATE_CHANGE' && <Activity className="h-5 w-5 text-blue-600" />}
                        {event.type === 'PLAYBACK' && <Play className="h-5 w-5 text-green-600" />}
                        {event.type === 'SOURCE_CHANGE' && <RefreshCw className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">
                            {event.type === 'STATE_CHANGE' && `Status: ${event.fromStatus || '?'} → ${event.toStatus}`}
                            {event.type === 'PLAYBACK' && `Played content`}
                            {event.type === 'SOURCE_CHANGE' && `Source changed: ${event.reason}`}
                            {!event.type && 'Event recorded'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ConfigHistory({ displayId }: { displayId: string }) {
    const { data: historyData, isLoading } = useQuery({
        queryKey: ['configHistory', displayId],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/audit/displays/${displayId}/config-history`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
    });

    // Handle different API response structures
    const history = Array.isArray(historyData?.data)
        ? historyData.data
        : Array.isArray(historyData)
            ? historyData
            : [];

    if (isLoading) return <Skeleton className="h-32" />;
    if (!history.length) {
        return (
            <div className="text-center py-12">
                <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No configuration changes recorded</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((change: { id: string; field: string; oldValue: string; newValue: string; createdAt: string; changedByName?: string }) => (
                <div key={change.id} className="p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline">{change.field}</Badge>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="mt-2 text-sm">
                        <span className="text-red-500 line-through">{change.oldValue || 'null'}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600">{change.newValue || 'null'}</span>
                    </div>
                    {change.changedByName && (
                        <p className="text-xs text-muted-foreground mt-1">by {change.changedByName}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function DisplayProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-32" />
            <Card>
                <Skeleton className="h-24 w-full" />
                <CardContent className="pt-6">
                    <div className="flex gap-6">
                        <Skeleton className="h-24 w-24 rounded-2xl" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-16" />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
