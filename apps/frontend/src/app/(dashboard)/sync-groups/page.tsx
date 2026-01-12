'use client';

/**
 * Sync Groups Management Page
 * List and manage synchronized display groups
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Radio,
    Plus,
    Search,
    Play,
    Pause,
    Square,
    Monitor,
    MoreVertical,
    Trash2,
    Edit,
    RefreshCw,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SyncGroup {
    id: string;
    name: string;
    status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'STOPPED';
    hotelId: string;
    hotel?: { name: string };
    displays?: Array<{ id: string; name: string; status: string }>;
    content?: { id: string; name: string; type: string };
    playlistItems?: Array<{ id: string; content: { name: string } }>;
    createdAt: string;
}

export default function SyncGroupsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // Fetch sync groups
    const { data: groupsData, isLoading } = useQuery({
        queryKey: ['syncGroups', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await authenticatedFetch(`${API_URL}/api/sync/groups?${params}`);
            if (!res.ok) throw new Error('Failed to fetch sync groups');
            return res.json();
        },
        enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HOTEL_ADMIN',
    });

    // Playback controls
    const startMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/start`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to start playback');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Playback started');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
        },
        onError: () => toast.error('Failed to start playback'),
    });

    const pauseMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/pause`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to pause');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Playback paused');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
        },
        onError: () => toast.error('Failed to pause'),
    });

    const stopMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/stop`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to stop');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Playback stopped');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
        },
        onError: () => toast.error('Failed to stop'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Sync group deleted');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
        },
        onError: () => toast.error('Failed to delete sync group'),
    });

    // Check permissions
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'HOTEL_ADMIN') {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground">Only admins can manage sync groups.</p>
                </div>
            </div>
        );
    }

    // Extract groups array
    const groups: SyncGroup[] = Array.isArray(groupsData?.data)
        ? groupsData.data
        : Array.isArray(groupsData?.data?.groups)
            ? groupsData.data.groups
            : [];

    const STATUS_CONFIG = {
        IDLE: { color: 'bg-gray-500/10 text-gray-600', label: 'Idle' },
        PLAYING: { color: 'bg-green-500/10 text-green-600', label: 'Playing' },
        PAUSED: { color: 'bg-yellow-500/10 text-yellow-600', label: 'Paused' },
        STOPPED: { color: 'bg-red-500/10 text-red-600', label: 'Stopped' },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Radio className="h-8 w-8" />
                        Sync Groups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage synchronized display groups for coordinated playback
                    </p>
                </div>
                <Button onClick={() => toast.info('Create sync group dialog coming soon')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sync Group
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sync groups..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Groups Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                                <div className="h-4 bg-muted rounded w-full mb-2" />
                                <div className="h-4 bg-muted rounded w-2/3" />
                            </CardContent>
                        </Card>
                    ))
                ) : groups.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="text-center py-12">
                            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-1">No sync groups found</h3>
                            <p className="text-muted-foreground">
                                Create a sync group to synchronize content across multiple displays.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    groups.map((group) => {
                        const statusConfig = STATUS_CONFIG[group.status] || STATUS_CONFIG.IDLE;
                        return (
                            <Card key={group.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div>
                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {group.hotel?.name || 'Unknown Hotel'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={statusConfig.color}>
                                            {statusConfig.label}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toast.info('Edit coming soon')}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => deleteMutation.mutate(group.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Displays count */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Monitor className="h-4 w-4" />
                                        <span>{group.displays?.length || 0} displays</span>
                                        {group.content && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span>{group.content.name}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Playback Controls */}
                                    <div className="flex items-center gap-2">
                                        {group.status !== 'PLAYING' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startMutation.mutate(group.id)}
                                                disabled={startMutation.isPending}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Start
                                            </Button>
                                        )}
                                        {group.status === 'PLAYING' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => pauseMutation.mutate(group.id)}
                                                disabled={pauseMutation.isPending}
                                            >
                                                <Pause className="h-4 w-4 mr-1" />
                                                Pause
                                            </Button>
                                        )}
                                        {group.status === 'PAUSED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startMutation.mutate(group.id)}
                                                disabled={startMutation.isPending}
                                            >
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                Resume
                                            </Button>
                                        )}
                                        {(group.status === 'PLAYING' || group.status === 'PAUSED') && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => stopMutation.mutate(group.id)}
                                                disabled={stopMutation.isPending}
                                            >
                                                <Square className="h-4 w-4 mr-1" />
                                                Stop
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
