'use client';

/**
 * EditDisplayDialog
 * Modal for editing display configuration
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Monitor } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Display {
    id: string;
    name: string;
    location?: string | null;
    orientation?: string | null;
    resolution?: string | null;
    hotelId: string;
    areaId?: string | null;
    hotel?: { id: string; name: string };
    area?: { id: string; name: string } | null;
}

interface Area {
    id: string;
    name: string;
    hotelId: string;
}

interface Hotel {
    id: string;
    name: string;
}

interface EditDisplayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    display: Display;
    onSuccess?: () => void;
}

export function EditDisplayDialog({
    open,
    onOpenChange,
    display,
    onSuccess,
}: EditDisplayDialogProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const [formData, setFormData] = useState({
        name: display.name,
        location: display.location || '',
        orientation: display.orientation || 'horizontal',
        resolution: display.resolution || '1920x1080',
        hotelId: display.hotelId,
        areaId: display.areaId || '',
    });

    // Reset form when display changes
    useEffect(() => {
        setFormData({
            name: display.name,
            location: display.location || '',
            orientation: display.orientation || 'horizontal',
            resolution: display.resolution || '1920x1080',
            hotelId: display.hotelId,
            areaId: display.areaId || '',
        });
    }, [display]);

    // Fetch hotels (SUPER_ADMIN only)
    const { data: hotelsData } = useQuery({
        queryKey: ['hotels'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels`);
            if (!res.ok) return { data: { hotels: [] } };
            return res.json();
        },
        enabled: open && isSuperAdmin,
    });

    // Fetch areas for selected hotel
    const { data: areasData } = useQuery({
        queryKey: ['areas', formData.hotelId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (formData.hotelId) params.append('hotelId', formData.hotelId);
            const res = await authenticatedFetch(`${API_URL}/api/areas?${params}`);
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

    const areas: Area[] = Array.isArray(areasData?.data?.areas)
        ? areasData.data.areas
        : Array.isArray(areasData?.data)
            ? areasData.data
            : [];

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await authenticatedFetch(`${API_URL}/api/displays/${display.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: data.name,
                    location: data.location || null,
                    orientation: data.orientation,
                    resolution: data.resolution,
                    hotelId: data.hotelId,
                    areaId: data.areaId || null,
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error?.message || 'Failed to update display');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Display updated successfully');
            queryClient.invalidateQueries({ queryKey: ['displays'] });
            queryClient.invalidateQueries({ queryKey: ['display', display.id] });
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Display name is required');
            return;
        }
        updateMutation.mutate(formData);
    };

    const handleHotelChange = (hotelId: string) => {
        setFormData(prev => ({
            ...prev,
            hotelId,
            areaId: '', // Reset area when hotel changes
        }));
    };

    const ORIENTATIONS = [
        { value: 'horizontal', label: 'Horizontal (Landscape)' },
        { value: 'vertical', label: 'Vertical (Portrait)' },
    ];

    const RESOLUTIONS = [
        { value: '1920x1080', label: '1920x1080 (Full HD)' },
        { value: '3840x2160', label: '3840x2160 (4K)' },
        { value: '1280x720', label: '1280x720 (HD)' },
        { value: '1080x1920', label: '1080x1920 (Portrait FHD)' },
        { value: '2160x3840', label: '2160x3840 (Portrait 4K)' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Edit Display
                    </DialogTitle>
                    <DialogDescription>
                        Update the display configuration. Changes will take effect immediately.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Lobby Screen 1"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Main Lobby, North Wall"
                        />
                    </div>

                    {/* Orientation */}
                    <div className="grid gap-2">
                        <Label>Orientation</Label>
                        <Select
                            value={formData.orientation}
                            onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORIENTATIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Resolution */}
                    <div className="grid gap-2">
                        <Label>Resolution</Label>
                        <Select
                            value={formData.resolution}
                            onValueChange={(value) => setFormData({ ...formData, resolution: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RESOLUTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hotel (SUPER_ADMIN only) */}
                    {isSuperAdmin && (
                        <div className="grid gap-2">
                            <Label>Hotel</Label>
                            <Select
                                value={formData.hotelId}
                                onValueChange={handleHotelChange}
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

                    {/* Area */}
                    <div className="grid gap-2">
                        <Label>Area</Label>
                        <Select
                            value={formData.areaId || '__none__'}
                            onValueChange={(value) => setFormData({
                                ...formData,
                                areaId: value === '__none__' ? '' : value
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select area (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">No Area</SelectItem>
                                {areas.map((area) => (
                                    <SelectItem key={area.id} value={area.id}>
                                        {area.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
