'use client';

/**
 * Users Management Page
 * CRUD for system users with role management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Shield,
    Eye,
    Building,
    MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/10 text-red-600 border-red-500/30',
    HOTEL_ADMIN: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    AREA_MANAGER: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    HOTEL_ADMIN: 'Hotel Admin',
    AREA_MANAGER: 'Area Manager',
};

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    hotelId: string | null;
    areaId: string | null;
    twoFactorEnabled: boolean;
    createdAt: string;
    hotel?: { id: string; name: string };
    area?: { id: string; name: string };
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);

    // Fetch users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users', search, roleFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (roleFilter !== 'all') params.append('role', roleFilter);

            const res = await authenticatedFetch(`${API_URL}/api/users?${params}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });

    // Fetch hotels for dropdown
    const { data: hotelsData } = useQuery({
        queryKey: ['hotels'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/hotels`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
    });

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) => {
            const res = await authenticatedFetch(`${API_URL}/api/users`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error?.message || 'Failed to create user');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await authenticatedFetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete user');
            return res.json();
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteUser(null);
        },
        onError: () => {
            toast.error('Failed to delete user');
        },
    });

    const users = usersData?.data || [];
    // Handle different API response structures
    const hotels = Array.isArray(hotelsData?.data)
        ? hotelsData.data
        : Array.isArray(hotelsData?.hotels)
            ? hotelsData.hotels
            : Array.isArray(hotelsData)
                ? hotelsData
                : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8" />
                        Users Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage system users and their permissions
                    </p>
                </div>
                {currentUser?.role !== 'AREA_MANAGER' && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                <SelectItem value="HOTEL_ADMIN">Hotel Admin</SelectItem>
                                <SelectItem value="AREA_MANAGER">Area Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Hotel</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead>2FA</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (users || []).map((user: User) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                                                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={ROLE_COLORS[user.role] || ''}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                {user.hotel?.name || 'All Hotels'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {user.area?.name || 'All Areas'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {user.twoFactorEnabled ? (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Enabled
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    Disabled
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(user.createdAt), 'PP')}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/users/${user.id}`}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {user.id !== currentUser?.id && (
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteUser(user)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateUserDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                hotels={hotels || []}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deleteUser?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Create User Dialog Component
function CreateUserDialog({
    open,
    onOpenChange,
    hotels = [],
    onSubmit,
    isLoading
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hotels?: Array<{ id: string; name: string }>;
    onSubmit: (data: Record<string, unknown>) => void;
    isLoading: boolean;
}) {
    // Ensure hotels is always an array
    const hotelsList = Array.isArray(hotels) ? hotels : [];
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'AREA_MANAGER',
        hotelId: '',
        areaId: '',
    });

    // Fetch areas based on selected hotel
    const { data: areasData } = useQuery({
        queryKey: ['areas', formData.hotelId],
        queryFn: async () => {
            if (!formData.hotelId) return { data: [] };
            const res = await authenticatedFetch(`${API_URL}/api/areas?hotelId=${formData.hotelId}`);
            if (!res.ok) return { data: [] };
            return res.json();
        },
        enabled: !!formData.hotelId,
    });

    const areas = areasData?.data || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            hotelId: formData.hotelId || null,
            areaId: formData.areaId || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system with appropriate permissions.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@hotel.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Min 8 characters"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    <SelectItem value="HOTEL_ADMIN">Hotel Admin</SelectItem>
                                    <SelectItem value="AREA_MANAGER">Area Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.role !== 'SUPER_ADMIN' && (
                            <div className="grid gap-2">
                                <Label htmlFor="hotel">Hotel</Label>
                                <Select
                                    value={formData.hotelId}
                                    onValueChange={(value) => setFormData({ ...formData, hotelId: value, areaId: '' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hotel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hotelsList.map((hotel) => (
                                            <SelectItem key={hotel.id} value={hotel.id}>
                                                {hotel.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {formData.role === 'AREA_MANAGER' && formData.hotelId && (
                            <div className="grid gap-2">
                                <Label htmlFor="area">Area</Label>
                                <Select
                                    value={formData.areaId}
                                    onValueChange={(value) => setFormData({ ...formData, areaId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(areas || []).map((area: { id: string; name: string }) => (
                                            <SelectItem key={area.id} value={area.id}>
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
