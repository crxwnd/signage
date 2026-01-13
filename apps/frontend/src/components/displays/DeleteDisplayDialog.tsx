'use client';

/**
 * DeleteDisplayDialog
 * Confirmation modal for deleting a display with name verification
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';
import { AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DeleteDisplayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    display: {
        id: string;
        name: string;
    };
}

export function DeleteDisplayDialog({
    open,
    onOpenChange,
    display,
}: DeleteDisplayDialogProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [confirmName, setConfirmName] = useState('');

    const isConfirmValid = confirmName === display.name;

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await authenticatedFetch(`${API_URL}/api/displays/${display.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error?.message || 'Failed to delete display');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(`Display "${display.name}" deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ['displays'] });
            onOpenChange(false);
            router.push('/displays');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const handleDelete = () => {
        if (!isConfirmValid) return;
        deleteMutation.mutate();
    };

    // Reset confirmation when dialog closes
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setConfirmName('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Display
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The display will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning Box */}
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>Warning:</strong> Deleting this display will:
                        </p>
                        <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                            <li>Remove it from all sync groups</li>
                            <li>Unassign all scheduled content</li>
                            <li>Delete all display history and logs</li>
                        </ul>
                    </div>

                    {/* Display Name */}
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm text-muted-foreground">Display to delete:</p>
                        <p className="font-semibold text-lg">{display.name}</p>
                    </div>

                    {/* Confirmation Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-name">
                            Type <span className="font-mono font-bold">{display.name}</span> to confirm
                        </Label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder="Enter display name"
                            className={confirmName && !isConfirmValid ? 'border-red-500' : ''}
                        />
                        {confirmName && !isConfirmValid && (
                            <p className="text-xs text-red-500">
                                Name doesn&apos;t match. Please type exactly: {display.name}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmValid || deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Display'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
