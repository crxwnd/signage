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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Video,
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
import { QuickUrlDialog } from '@/components/displays/QuickUrlDialog';

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

interface Display {
    id: string;
    name: string;
    status: string;
    hotelId?: string;
}

interface Content {
    id: string;
    name: string;
    type: string;
}

interface Hotel {
    id: string;
    name: string;
}

export default function SyncGroupsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<SyncGroup | null>(null);
    const [quickUrlGroup, setQuickUrlGroup] = useState<SyncGroup | null>(null);

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

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: { name: string; hotelId: string; displayIds: string[]; contentId?: string }) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error?.message || 'Failed to create sync group');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Sync group created successfully');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
            setIsCreateOpen(false);
        },
        onError: (error: Error) => toast.error(error.message),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; displayIds?: string[]; contentId?: string } }) => {
            const res = await authenticatedFetch(`${API_URL}/api/sync/groups/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update sync group');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Sync group updated');
            queryClient.invalidateQueries({ queryKey: ['syncGroups'] });
            setEditingGroup(null);
        },
        onError: () => toast.error('Failed to update sync group'),
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
                <Button onClick={() => setIsCreateOpen(true)}>
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
                            <p className="text-muted-foreground mb-4">
                                Create a sync group to synchronize content across multiple displays.
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Sync Group
                            </Button>
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
                                                <DropdownMenuItem onClick={() => setQuickUrlGroup(group)}>
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Quick Play URL
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingGroup(group)}>
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

            {/* Create Sync Group Dialog */}
            <CreateSyncGroupDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                userHotelId={user?.hotelId}
                isSuperAdmin={user?.role === 'SUPER_ADMIN'}
            />

            {/* Edit Sync Group Dialog */}
            {editingGroup && (
                <EditSyncGroupDialog
                    open={!!editingGroup}
                    onOpenChange={() => setEditingGroup(null)}
                    group={editingGroup}
                    onSubmit={(data) => updateMutation.mutate({ id: editingGroup.id, data })}
                    isLoading={updateMutation.isPending}
                />
            )}

            {/* Quick URL Dialog */}
            {quickUrlGroup && (
                <QuickUrlDialog
                    isOpen={!!quickUrlGroup}
                    onClose={() => setQuickUrlGroup(null)}
                    targetType="syncGroup"
                    targetId={quickUrlGroup.id}
                    targetName={quickUrlGroup.name}
                />
            )}
        </div>
    );
}

// Create Sync Group Dialog
function CreateSyncGroupDialog({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    userHotelId,
    isSuperAdmin,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; hotelId: string; displayIds: string[]; contentId?: string }) => void;
    isLoading: boolean;
    userHotelId?: string | null;
    isSuperAdmin: boolean;
}) {
    const [formData, setFormData] = useState({
        name: '',
        hotelId: userHotelId || '',
        displayIds: [] as string[],
        contentId: '',
    });

    // Fetch hotels (for super admin)
    const { data: hotelsData } = useQuery({
        queryKey: ['hotels'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels`);
            if (!res.ok) return { data: { hotels: [] } };
            return res.json();
        },
        enabled: open && isSuperAdmin,
    });

    // Fetch displays
    const { data: displaysData } = useQuery({
        queryKey: ['displays', formData.hotelId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (formData.hotelId) params.append('hotelId', formData.hotelId);
            const res = await authenticatedFetch(`${API_URL}/api/displays?${params}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: open && !!formData.hotelId,
    });

    // Fetch content
    const { data: contentData } = useQuery({
        queryKey: ['content', formData.hotelId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (formData.hotelId) params.append('hotelId', formData.hotelId);
            const res = await authenticatedFetch(`${API_URL}/api/content?${params}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: open && !!formData.hotelId,
    });

    const hotels: Hotel[] = Array.isArray(hotelsData?.data?.hotels)
        ? hotelsData.data.hotels
        : Array.isArray(hotelsData?.data)
            ? hotelsData.data
            : [];

    const displays: Display[] = Array.isArray(displaysData?.data?.displays)
        ? displaysData.data.displays
        : Array.isArray(displaysData?.data)
            ? displaysData.data
            : [];

    const contents: Content[] = Array.isArray(contentData?.data?.contents)
        ? contentData.data.contents
        : Array.isArray(contentData?.data)
            ? contentData.data
            : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.hotelId || formData.displayIds.length === 0) {
            toast.error('Please fill all required fields');
            return;
        }
        onSubmit({
            name: formData.name,
            hotelId: formData.hotelId,
            displayIds: formData.displayIds,
            contentId: formData.contentId && formData.contentId !== '__none__' ? formData.contentId : undefined,
        });
    };

    const toggleDisplay = (displayId: string) => {
        setFormData(prev => ({
            ...prev,
            displayIds: prev.displayIds.includes(displayId)
                ? prev.displayIds.filter(id => id !== displayId)
                : [...prev.displayIds, displayId],
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Sync Group</DialogTitle>
                    <DialogDescription>
                        Create a group of displays that will play synchronized content.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Group Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Lobby Sync Group"
                                required
                            />
                        </div>

                        {/* Hotel (Super Admin only) */}
                        {isSuperAdmin && (
                            <div className="grid gap-2">
                                <Label>Hotel *</Label>
                                <Select
                                    value={formData.hotelId}
                                    onValueChange={(value) => setFormData({ ...formData, hotelId: value, displayIds: [] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hotel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hotels.map((hotel) => (
                                            <SelectItem key={hotel.id} value={hotel.id}>
                                                {hotel.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Displays */}
                        <div className="grid gap-2">
                            <Label>Select Displays * ({formData.displayIds.length} selected)</Label>
                            <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                                {displays.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        {formData.hotelId ? 'No displays found' : 'Select a hotel first'}
                                    </p>
                                ) : (
                                    displays.map((display) => (
                                        <div key={display.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={display.id}
                                                checked={formData.displayIds.includes(display.id)}
                                                onCheckedChange={() => toggleDisplay(display.id)}
                                            />
                                            <label
                                                htmlFor={display.id}
                                                className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                                            >
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                <span>{display.name}</span>
                                                <Badge variant="outline" className="ml-auto text-xs">
                                                    {display.status}
                                                </Badge>
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid gap-2">
                            <Label>Content (optional)</Label>
                            <Select
                                value={formData.contentId}
                                onValueChange={(value) => setFormData({ ...formData, contentId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select content to sync" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {contents.map((content) => (
                                        <SelectItem key={content.id} value={content.id}>
                                            <div className="flex items-center gap-2">
                                                <Video className="h-4 w-4" />
                                                {content.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Sync Group'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Edit Sync Group Dialog
function EditSyncGroupDialog({
    open,
    onOpenChange,
    group,
    onSubmit,
    isLoading,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: SyncGroup;
    onSubmit: (data: { name?: string; displayIds?: string[]; contentId?: string }) => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState({
        name: group.name,
        displayIds: group.displays?.map(d => d.id) || [],
        contentId: group.content?.id || '',
    });

    // Fetch displays
    const { data: displaysData } = useQuery({
        queryKey: ['displays', group.hotelId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (group.hotelId) params.append('hotelId', group.hotelId);
            const res = await authenticatedFetch(`${API_URL}/api/displays?${params}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: open,
    });

    // Fetch content
    const { data: contentData } = useQuery({
        queryKey: ['content', group.hotelId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (group.hotelId) params.append('hotelId', group.hotelId);
            const res = await authenticatedFetch(`${API_URL}/api/content?${params}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: open,
    });

    const displays: Display[] = Array.isArray(displaysData?.data?.displays)
        ? displaysData.data.displays
        : Array.isArray(displaysData?.data)
            ? displaysData.data
            : [];

    const contents: Content[] = Array.isArray(contentData?.data?.contents)
        ? contentData.data.contents
        : Array.isArray(contentData?.data)
            ? contentData.data
            : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name: formData.name,
            displayIds: formData.displayIds,
            contentId: formData.contentId && formData.contentId !== '__none__' ? formData.contentId : undefined,
        });
    };

    const toggleDisplay = (displayId: string) => {
        setFormData(prev => ({
            ...prev,
            displayIds: prev.displayIds.includes(displayId)
                ? prev.displayIds.filter(id => id !== displayId)
                : [...prev.displayIds, displayId],
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Sync Group</DialogTitle>
                    <DialogDescription>
                        Update the sync group configuration.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Group Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Lobby Sync Group"
                            />
                        </div>

                        {/* Displays */}
                        <div className="grid gap-2">
                            <Label>Displays ({formData.displayIds.length} selected)</Label>
                            <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                                {displays.map((display) => (
                                    <div key={display.id} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`edit-${display.id}`}
                                            checked={formData.displayIds.includes(display.id)}
                                            onCheckedChange={() => toggleDisplay(display.id)}
                                        />
                                        <label
                                            htmlFor={`edit-${display.id}`}
                                            className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                                        >
                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                            <span>{display.name}</span>
                                            <Badge variant="outline" className="ml-auto text-xs">
                                                {display.status}
                                            </Badge>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid gap-2">
                            <Label>Content</Label>
                            <Select
                                value={formData.contentId}
                                onValueChange={(value) => setFormData({ ...formData, contentId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select content" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {contents.map((content) => (
                                        <SelectItem key={content.id} value={content.id}>
                                            <div className="flex items-center gap-2">
                                                <Video className="h-4 w-4" />
                                                {content.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
