'use client';

/**
 * Create User Modal
 * Form to create a new user
 * Supports SUPER_ADMIN (with hotel selector) and HOTEL_ADMIN
 */

import { useState, useEffect, type FormEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateUser } from '@/hooks/useUsers';
import { useHotels } from '@/hooks/useHotels';
import { useAuth } from '@/contexts/AuthContext';
import { getAreas, type Area } from '@/lib/api/areas';
import { toast } from 'sonner';

interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
    const { user: currentUser } = useAuth();
    const createUser = useCreateUser();
    const { data: hotels, isLoading: isLoadingHotels } = useHotels();

    const [areas, setAreas] = useState<Area[]>([]);
    const [isLoadingAreas, setIsLoadingAreas] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER'>('HOTEL_ADMIN');
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [areaId, setAreaId] = useState('');
    const [error, setError] = useState('');

    // Effective hotel ID: for SUPER_ADMIN use selected, for others use their hotelId
    const effectiveHotelId = currentUser?.role === 'SUPER_ADMIN'
        ? selectedHotelId
        : currentUser?.hotelId;

    // Load areas when hotel changes and role is AREA_MANAGER
    useEffect(() => {
        if (role === 'AREA_MANAGER' && effectiveHotelId) {
            setIsLoadingAreas(true);
            getAreas({ hotelId: effectiveHotelId })
                .then(setAreas)
                .catch((err) => {
                    console.error('Failed to load areas:', err);
                    toast.error('Failed to load areas');
                })
                .finally(() => setIsLoadingAreas(false));
        } else {
            setAreas([]);
        }
    }, [role, effectiveHotelId]);

    // Reset area when hotel changes
    useEffect(() => {
        setAreaId('');
    }, [selectedHotelId]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('HOTEL_ADMIN');
        setSelectedHotelId('');
        setAreaId('');
        setError('');
        setAreas([]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setError('Valid email is required');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        // Hotel required for non-SUPER_ADMIN roles
        if (role !== 'SUPER_ADMIN' && !effectiveHotelId) {
            setError('Hotel is required for this role');
            return;
        }
        if (role === 'AREA_MANAGER' && !areaId) {
            setError('Area is required for Area Manager');
            return;
        }

        try {
            await createUser.mutateAsync({
                name,
                email,
                password,
                role,
                hotelId: role === 'SUPER_ADMIN' ? undefined : (effectiveHotelId || undefined),
                areaId: role === 'AREA_MANAGER' ? areaId : undefined,
            });
            toast.success('User created successfully');
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
            onClose();
        }
    };

    // Filter available roles based on current user's role
    const availableRoles = currentUser?.role === 'SUPER_ADMIN'
        ? ['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER'] as const
        : ['HOTEL_ADMIN', 'AREA_MANAGER'] as const;

    // Show hotel selector for SUPER_ADMIN when creating non-SUPER_ADMIN users
    const showHotelSelector = currentUser?.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hotel Selector - for SUPER_ADMIN creating non-SUPER_ADMIN users */}
                    {showHotelSelector && (
                        <div className="space-y-2">
                            <Label htmlFor="hotel">Hotel</Label>
                            <Select
                                value={selectedHotelId}
                                onValueChange={(v) => {
                                    setSelectedHotelId(v);
                                    setAreaId(''); // Reset area when hotel changes
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingHotels ? 'Loading...' : 'Select hotel'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {hotels?.map((hotel) => (
                                        <SelectItem key={hotel.id} value={hotel.id}>
                                            {hotel.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Area Selector - for AREA_MANAGER role */}
                    {role === 'AREA_MANAGER' && effectiveHotelId && (
                        <div className="space-y-2">
                            <Label htmlFor="area">Area</Label>
                            <Select value={areaId} onValueChange={setAreaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingAreas ? 'Loading...' : 'Select area'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {areas.length === 0 && !isLoadingAreas && (
                                <p className="text-xs text-muted-foreground">
                                    No areas found for this hotel
                                </p>
                            )}
                        </div>
                    )}

                    {/* Message if hotel not selected but needed */}
                    {role === 'AREA_MANAGER' && !effectiveHotelId && showHotelSelector && (
                        <p className="text-xs text-muted-foreground">
                            Please select a hotel first to see available areas
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createUser.isPending}>
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
