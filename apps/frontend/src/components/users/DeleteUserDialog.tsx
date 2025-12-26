'use client';

/**
 * Delete User Dialog
 * Confirmation dialog for user deletion
 */

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
import { useDeleteUser } from '@/hooks/useUsers';
import type { User } from '@/lib/api/users';
import { toast } from 'sonner';

interface DeleteUserDialogProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
}

export function DeleteUserDialog({ user, open, onClose }: DeleteUserDialogProps) {
    const deleteUser = useDeleteUser();

    const handleDelete = async () => {
        if (!user) return;

        try {
            await deleteUser.mutateAsync(user.id);
            toast.success('User deleted successfully');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    if (!user) return null;

    return (
        <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{user.name}</strong> ({user.email})?
                        <br />
                        <br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteUser.isPending}
                    >
                        {deleteUser.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
