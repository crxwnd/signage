'use client';

/**
 * Delete Content Modal
 * Confirmation dialog for deleting content
 * Shows dependency details when content cannot be deleted
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
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Dependencies {
    displayAssignments?: number;
    schedules?: number;
    alerts?: number;
    syncGroupContents?: number;
}

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
    const [error, setError] = useState<string | null>(null);
    const [dependencies, setDependencies] = useState<Dependencies | null>(null);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        setDependencies(null);

        try {
            const response = await authenticatedFetch(`${API_URL}/api/content/${contentId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            // Check for dependency errors
            if (data.error?.code === 'CONTENT_HAS_DEPENDENCIES') {
                setError(data.error.message);
                setDependencies(data.error.details || null);
                return;
            }

            // Check both response.ok and data.success
            if (!response.ok || !data.success) {
                const errorMessage = data.error?.message || data.message || 'Failed to delete content';
                throw new Error(errorMessage);
            }

            toast({
                title: 'Content deleted',
                description: `"${contentName}" has been deleted successfully.`
            });

            onDeleted();
            handleClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(message);
            toast({
                title: 'Cannot delete content',
                description: message,
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setDependencies(null);
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{contentName}&quot;? This action cannot be undone.
                        All associated files will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-red-800 dark:text-red-200">
                                <p className="font-medium">{error}</p>
                                {dependencies && (
                                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                                        {dependencies.displayAssignments && dependencies.displayAssignments > 0 && (
                                            <li>{dependencies.displayAssignments} display assignment(s)</li>
                                        )}
                                        {dependencies.schedules && dependencies.schedules > 0 && (
                                            <li>{dependencies.schedules} schedule(s)</li>
                                        )}
                                        {dependencies.alerts && dependencies.alerts > 0 && (
                                            <li>{dependencies.alerts} alert(s)</li>
                                        )}
                                        {dependencies.syncGroupContents && dependencies.syncGroupContents > 0 && (
                                            <li>{dependencies.syncGroupContents} sync group(s)</li>
                                        )}
                                    </ul>
                                )}
                                <p className="mt-2 text-sm opacity-80">
                                    Remove the assignments first, then try deleting again.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={handleClose}>Cancel</AlertDialogCancel>
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
