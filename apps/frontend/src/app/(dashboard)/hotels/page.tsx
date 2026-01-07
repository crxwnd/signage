'use client';

/**
 * Hotels Management Page
 * CRUD interface for hotel management (SUPER_ADMIN only)
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHotels, useHotelGlobalStats, useDeleteHotel } from '@/hooks/useHotels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Plus,
    Loader2,
    Monitor,
    Users,
    FileVideo,
    MapPin,
    MoreVertical,
    Pencil,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateHotelModal } from '@/components/hotels/CreateHotelModal';
import { EditHotelModal } from '@/components/hotels/EditHotelModal';
import type { Hotel } from '@/lib/api/hotels';

export default function HotelsPage() {
    const { user } = useAuth();
    const { data: hotels, isLoading, error } = useHotels(true);
    const { data: globalStats } = useHotelGlobalStats();
    const deleteHotel = useDeleteHotel();

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
    const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const handleDelete = async () => {
        if (!deletingHotel) return;
        await deleteHotel.mutateAsync(deletingHotel.id);
        setDeletingHotel(null);
    };

    if (!isSuperAdmin) {
        return (
            <div className="container mx-auto py-6">
                <Card className="glass">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground">
                            Only Super Admins can manage hotels.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Card className="glass">
                    <CardContent className="py-8 text-center text-destructive">
                        Failed to load hotels
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Hotels Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage hotels in the signage network
                    </p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hotel
                </Button>
            </div>

            {/* Global Stats */}
            {globalStats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="glass card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Hotels</p>
                                    <p className="text-2xl font-bold">{globalStats.totalHotels}</p>
                                </div>
                                <Building2 className="h-8 w-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Displays</p>
                                    <p className="text-2xl font-bold">{globalStats.totalDisplays}</p>
                                </div>
                                <Monitor className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Online Displays</p>
                                    <p className="text-2xl font-bold text-green-600">{globalStats.onlineDisplays}</p>
                                </div>
                                <Monitor className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold">{globalStats.totalUsers}</p>
                                </div>
                                <Users className="h-8 w-8 text-purple-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Hotels Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hotels?.map((hotel) => (
                    <Card key={hotel.id} className="glass card-hover">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{hotel.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {hotel.address}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingHotel(hotel)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setDeletingHotel(hotel)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Stats */}
                            {hotel.stats && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-center gap-1">
                                            <Monitor className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-semibold">{hotel.stats.displayCount}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Displays</p>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Badge variant="default" className="text-[10px] px-1 bg-green-500">
                                                {hotel.stats.onlineDisplays}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1">
                                                {hotel.stats.offlineDisplays}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-semibold">{hotel.stats.userCount}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Users</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-center gap-1">
                                            <FileVideo className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-semibold">{hotel.stats.contentCount}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Content</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State */}
                {hotels?.length === 0 && (
                    <Card className="glass col-span-full">
                        <CardContent className="py-12 text-center">
                            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No Hotels Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first hotel to get started
                            </p>
                            <Button onClick={() => setCreateModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Hotel
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modals */}
            <CreateHotelModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />

            {editingHotel && (
                <EditHotelModal
                    hotel={editingHotel}
                    open={!!editingHotel}
                    onOpenChange={(open) => !open && setEditingHotel(null)}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingHotel} onOpenChange={(open) => !open && setDeletingHotel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deletingHotel?.name}</strong>?
                            <br /><br />
                            <span className="text-destructive font-medium">
                                Warning: This will permanently delete all associated data including
                                displays, content, users, schedules, and alerts.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteHotel.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete Hotel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
