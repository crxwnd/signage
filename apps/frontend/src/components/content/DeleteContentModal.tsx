'use client';

/**
 * Delete Content Modal
 * Confirmation dialog for deleting content
 */

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DeleteContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    contentName: string;
    onDeleted: () => void;
}

export function DeleteContentModal({
    isOpen,
    onClose,
    contentId,
    contentName,
    onDeleted
}: DeleteContentModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await authenticatedFetch(`${API_URL}/api/content/${contentId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            // Check both response.ok and data.success
            if (!response.ok || !data.success) {
                // Extract error message from backend response
                const errorMessage = data.error?.message || data.message || 'Failed to delete content';
                throw new Error(errorMessage);
            }

            toast({
                title: 'Content deleted',
                description: `"${contentName}" has been deleted successfully.`
            });

            onDeleted();
            onClose();
        } catch (error) {
            toast({
                title: 'Cannot delete content',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{contentName}&quot;? This action cannot be undone.
                        All associated files will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
