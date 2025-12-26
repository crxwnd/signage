'use client';

/**
 * Edit User Modal
 * Form to edit an existing user
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
import { useUpdateUser } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/lib/api/users';
import { toast } from 'sonner';

interface EditUserModalProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
}

export function EditUserModal({ user, open, onClose }: EditUserModalProps) {
    const { user: currentUser } = useAuth();
    const updateUser = useUpdateUser();

    // Form state
    const [name, setName] = useState('');
    const [role, setRole] = useState<'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER'>('HOTEL_ADMIN');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Reset form when user changes
    useEffect(() => {
        if (user) {
            setName(user.name);
            setRole(user.role);
            setPassword('');
            setError('');
        }
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');

        // Validation
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (password && password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            const updateData: Record<string, unknown> = {
                name,
                role,
            };

            // Only include password if provided
            if (password.length > 0) {
                updateData.password = password;
            }

            await updateUser.mutateAsync({ id: user.id, data: updateData });
            toast.success('User updated successfully');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    // Filter available roles based on current user's role
    const availableRoles = currentUser?.role === 'SUPER_ADMIN'
        ? ['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER'] as const
        : ['HOTEL_ADMIN', 'AREA_MANAGER'] as const;

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information for {user.email}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Email - Read Only */}
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

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
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">New Password (optional)</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">Leave empty to keep current password</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateUser.isPending}>
                            {updateUser.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
