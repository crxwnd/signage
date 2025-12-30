'use client';

/**
 * SyncGroupCard Component
 * Card displaying sync group information and controls
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    Square,
    Trash2,
    Users,
    Radio,
    Crown,
} from 'lucide-react';
import { useSyncGroupControls, useDeleteSyncGroup } from '@/hooks/useSyncGroups';
import type { SyncGroup } from '@/lib/api/sync';

interface SyncGroupCardProps {
    group: SyncGroup;
    onSelectContent?: (groupId: string) => void;
}

const stateColors: Record<string, string> = {
    playing: 'bg-green-500',
    paused: 'bg-yellow-500',
    stopped: 'bg-gray-500',
};

const stateLabels: Record<string, string> = {
    playing: 'Playing',
    paused: 'Paused',
    stopped: 'Stopped',
};

export function SyncGroupCard({ group, onSelectContent }: SyncGroupCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const controls = useSyncGroupControls(group.id);
    const deleteMutation = useDeleteSyncGroup();

    const handleDelete = async () => {
        if (!confirm(`Delete sync group "${group.name}"?`)) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(group.id);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePlay = () => {
        if (group.playbackState === 'paused') {
            controls.resume.mutate();
        } else if (onSelectContent) {
            onSelectContent(group.id);
        }
    };

    const handlePause = () => {
        controls.pause.mutate();
    };

    const handleStop = () => {
        controls.stop.mutate();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="relative">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Radio className="h-4 w-4 text-primary" />
                        {group.name}
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${stateColors[group.playbackState]}`} />
                        {stateLabels[group.playbackState]}
                    </Badge>
                </div>
                <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.displayIds.length} displays
                        </span>
                        {group.conductorId && (
                            <span className="flex items-center gap-1 text-amber-600">
                                <Crown className="h-3 w-3" />
                                Conductor: {group.conductorId.slice(0, 8)}...
                            </span>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Current playback info */}
                {group.currentContentId && (
                    <div className="mb-4 p-2 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                            Content: {group.currentContentId.slice(0, 12)}...
                        </p>
                        <p className="text-sm font-mono">
                            Position: {formatTime(group.currentTime)}
                        </p>
                    </div>
                )}

                {/* Playback controls */}
                <div className="flex gap-2">
                    {group.playbackState === 'playing' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePause}
                            disabled={controls.isLoading}
                        >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={handlePlay}
                            disabled={controls.isLoading}
                        >
                            <Play className="h-4 w-4 mr-1" />
                            {group.playbackState === 'paused' ? 'Resume' : 'Start'}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStop}
                        disabled={controls.isLoading || group.playbackState === 'stopped'}
                    >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                    </Button>

                    <div className="flex-1" />

                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
