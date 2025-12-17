'use client';

/**
 * EditAreaModal Component
 * Modal dialog for editing an existing area
 */

import * as React from 'react';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useAreaMutations } from '@/hooks/useAreaMutations';
import type { Area } from '@/lib/api/areas';

const editAreaSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type EditAreaFormData = z.infer<typeof editAreaSchema>;

interface EditAreaModalProps {
    area: Area | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function EditAreaModal({ area, isOpen, onClose, onSuccess }: EditAreaModalProps) {
    const { updateArea, isUpdating } = useAreaMutations();

    const [formData, setFormData] = React.useState<EditAreaFormData>({
        name: '',
        description: '',
    });

    const [errors, setErrors] = React.useState<Partial<Record<keyof EditAreaFormData, string>>>({});

    // Sync form data when area changes
    React.useEffect(() => {
        if (area) {
            setFormData({
                name: area.name,
                description: area.description || '',
            });
        }
    }, [area]);

    const handleChange = (field: keyof EditAreaFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!area) return;

        setErrors({});

        // Validate
        const result = editAreaSchema.safeParse(formData);
        if (!result.success) {
            const formattedErrors: Partial<Record<keyof EditAreaFormData, string>> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof EditAreaFormData;
                formattedErrors[field] = issue.message;
            });
            setErrors(formattedErrors);
            return;
        }

        // Submit
        updateArea(
            {
                id: area.id,
                data: {
                    name: result.data.name,
                    description: result.data.description || undefined,
                },
            },
            {
                onSuccess: () => {
                    onSuccess?.();
                    onClose();
                },
            }
        );
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Área</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del área.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Nombre *</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="ej. Lobby Principal"
                            disabled={isUpdating}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-description">Descripción</Label>
                        <Textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                            placeholder="Descripción opcional del área..."
                            disabled={isUpdating}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                    </div>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUpdating}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isUpdating}>
                        {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
