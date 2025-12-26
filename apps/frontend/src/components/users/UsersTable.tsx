'use client';

/**
 * Users Table Component
 * Displays users in a card-based layout
 */

import { useState } from 'react';
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Building2,
    MapPin,
    ShieldCheck,
    ShieldOff,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/lib/api/users';
import { EditUserModal } from './EditUserModal';
import { DeleteUserDialog } from './DeleteUserDialog';

function getRoleBadge(role: string) {
    switch (role) {
        case 'SUPER_ADMIN':
            return <Badge variant="destructive">Super Admin</Badge>;
        case 'HOTEL_ADMIN':
            return <Badge variant="default">Hotel Admin</Badge>;
        case 'AREA_MANAGER':
            return <Badge variant="secondary">Area Manager</Badge>;
        default:
            return <Badge variant="outline">{role}</Badge>;
    }
}

export function UsersTable() {
    const { data: users, isLoading, error } = useUsers();
    const { user: currentUser } = useAuth();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="py-6 text-center">
                    <p className="text-destructive">Error loading users: {(error as Error).message}</p>
                </CardContent>
            </Card>
        );
    }

    if (!users || users.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No users found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-2">
                {/* Header */}
                <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Hotel</div>
                    <div>Area</div>
                    <div>2FA</div>
                    <div>Actions</div>
                </div>

                {/* Users */}
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="py-3">
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                <div>{getRoleBadge(user.role)}</div>
                                <div>
                                    {user.hotel ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Building2 className="h-3 w-3 text-muted-foreground" />
                                            {user.hotel.name}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                                <div>
                                    {user.area ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            {user.area.name}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                                <div>
                                    {user.twoFactorEnabled ? (
                                        <Badge variant="outline" className="text-green-600">
                                            <ShieldCheck className="mr-1 h-3 w-3" />
                                            On
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            <ShieldOff className="mr-1 h-3 w-3" />
                                            Off
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {currentUser?.id !== user.id && (
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeletingUser(user)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Modal */}
            <EditUserModal
                user={editingUser}
                open={!!editingUser}
                onClose={() => setEditingUser(null)}
            />

            {/* Delete Dialog */}
            <DeleteUserDialog
                user={deletingUser}
                open={!!deletingUser}
                onClose={() => setDeletingUser(null)}
            />
        </>
    );
}
