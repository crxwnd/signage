'use client';

/**
 * DeleteAreaDialog Component
 * Confirmation dialog for deleting an area
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
import { useAreaMutations } from '@/hooks/useAreaMutations';
import type { Area } from '@/lib/api/areas';

interface DeleteAreaDialogProps {
    area: Area | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DeleteAreaDialog({ area, isOpen, onClose, onSuccess }: DeleteAreaDialogProps) {
    const { deleteArea, isDeleting } = useAreaMutations();

    const handleDelete = () => {
        if (!area) return;

        deleteArea(area.id, {
            onSuccess: () => {
                onSuccess?.();
                onClose();
            },
        });
    };

    const displayCount = area?._count?.displays ?? 0;
    const userCount = area?._count?.users ?? 0;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            Estás a punto de eliminar el área <strong>&quot;{area?.name}&quot;</strong>.
                        </p>
                        {(displayCount > 0 || userCount > 0) && (
                            <p className="text-amber-600 dark:text-amber-500">
                                ⚠️ Esta área tiene {displayCount} display(s) y {userCount} usuario(s) asignados.
                                Quedarán sin área asignada.
                            </p>
                        )}
                        <p>Esta acción no se puede deshacer.</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
