'use client';

/**
 * Hotels Management Page
 * CRUD for hotels (SUPER_ADMIN only)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Building,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Monitor,
    Users,
    Layers,
    MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Hotel {
    id: string;
    name: string;
    address: string;
    createdAt: string;
    _count?: {
        displays: number;
        users: number;
        areas: number;
        contents: number;
    };
}

export default function HotelsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
    const [deleteHotel, setDeleteHotel] = useState<Hotel | null>(null);

    // Fetch hotels
    const { data: hotelsData, isLoading } = useQuery({
        queryKey: ['hotels', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('includeStats', 'true');

            const res = await authenticatedFetch(`${API_URL}/api/hotels?${params}`);
            if (!res.ok) throw new Error('Failed to fetch hotels');
            return res.json();
        },
        // Only run query if user is super admin
        enabled: user?.role === 'SUPER_ADMIN',
    });

    // Create hotel mutation
    const createMutation = useMutation({
        mutationFn: async (data: { name: string; address: string }) => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error?.message || 'Failed to create hotel');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Hotel created successfully');
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            setIsCreateOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Update hotel mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; address?: string } }) => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update hotel');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Hotel updated successfully');
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            setEditingHotel(null);
        },
        onError: () => {
            toast.error('Failed to update hotel');
        },
    });

    // Delete hotel mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete hotel');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Hotel deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['hotels'] });
            setDeleteHotel(null);
        },
        onError: () => {
            toast.error('Failed to delete hotel');
        },
    });

    // Only SUPER_ADMIN can access
    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground">Only Super Admins can manage hotels.</p>
                </div>
            </div>
        );
    }

    const hotels = hotelsData?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building className="h-8 w-8" />
                        Hotels Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage hotels in the signage network
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hotel
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search hotels..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Hotels Grid */}
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
                ) : hotels.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="text-center py-12">
                            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No hotels found</p>
                        </CardContent>
                    </Card>
                ) : (
                    hotels.map((hotel: Hotel) => (
                        <Card key={hotel.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-lg">{hotel.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {hotel.address}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/hotels/${hotel.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditingHotel(hotel)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleteHotel(hotel)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Monitor className="h-4 w-4 text-muted-foreground" />
                                        <span>{hotel._count?.displays || 0} displays</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{hotel._count?.users || 0} users</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        <span>{hotel._count?.areas || 0} areas</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Created {format(new Date(hotel.createdAt), 'PP')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Hotel Dialog */}
            <HotelFormDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                title="Create New Hotel"
            />

            {/* Edit Hotel Dialog */}
            <HotelFormDialog
                open={!!editingHotel}
                onOpenChange={() => setEditingHotel(null)}
                onSubmit={(data) => editingHotel && updateMutation.mutate({ id: editingHotel.id, data })}
                isLoading={updateMutation.isPending}
                title="Edit Hotel"
                initialData={editingHotel || undefined}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteHotel} onOpenChange={() => setDeleteHotel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Hotel</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deleteHotel?.name}&quot;? This will also delete all
                            associated areas, displays, content, and users. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteHotel(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteHotel && deleteMutation.mutate(deleteHotel.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Hotel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Hotel Form Dialog
function HotelFormDialog({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    title,
    initialData,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; address: string }) => void;
    isLoading: boolean;
    title: string;
    initialData?: { name: string; address: string };
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        address: initialData?.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update hotel information.' : 'Add a new hotel to the network.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Hotel Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Grand Hotel Plaza"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address *</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main Street, City, Country"
                                required
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : initialData ? 'Update Hotel' : 'Create Hotel'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
