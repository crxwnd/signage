'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createArea,
    updateArea,
    deleteArea,
    type CreateAreaInput,
    type UpdateAreaInput,
    type Area,
} from '@/lib/api/areas';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for area mutations with React Query
 * Provides create, update, and delete operations with automatic cache invalidation
 */
export function useAreaMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Create Area
    const createMutation = useMutation({
        mutationFn: (data: CreateAreaInput) => createArea(data),
        onSuccess: (newArea: Area) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast({
                title: 'Área creada',
                description: `"${newArea.name}" ha sido creada exitosamente.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error al crear área',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Update Area
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAreaInput }) =>
            updateArea(id, data),
        onSuccess: (updatedArea: Area) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast({
                title: 'Área actualizada',
                description: `"${updatedArea.name}" ha sido actualizada.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error al actualizar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Delete Area
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteArea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast({
                title: 'Área eliminada',
                description: 'El área ha sido eliminada.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error al eliminar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        createArea: createMutation.mutate,
        isCreating: createMutation.isPending,

        updateArea: updateMutation.mutate,
        isUpdating: updateMutation.isPending,

        deleteArea: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    };
}
