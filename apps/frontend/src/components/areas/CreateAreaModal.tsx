'use client';

/**
 * CreateAreaModal Component
 * Modal dialog for creating a new area
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

const createAreaSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type CreateAreaFormData = z.infer<typeof createAreaSchema>;

interface CreateAreaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateAreaModal({ isOpen, onClose, onSuccess }: CreateAreaModalProps) {
    const { createArea, isCreating } = useAreaMutations();

    const [formData, setFormData] = React.useState<CreateAreaFormData>({
        name: '',
        description: '',
    });

    const [errors, setErrors] = React.useState<Partial<Record<keyof CreateAreaFormData, string>>>({});

    const handleChange = (field: keyof CreateAreaFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = createAreaSchema.safeParse(formData);
        if (!result.success) {
            const formattedErrors: Partial<Record<keyof CreateAreaFormData, string>> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof CreateAreaFormData;
                formattedErrors[field] = issue.message;
            });
            setErrors(formattedErrors);
            return;
        }

        // Submit
        createArea(
            {
                name: result.data.name,
                description: result.data.description || undefined,
            },
            {
                onSuccess: () => {
                    setFormData({ name: '', description: '' });
                    onSuccess?.();
                    onClose();
                },
            }
        );
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setFormData({ name: '', description: '' });
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Área</DialogTitle>
                    <DialogDescription>
                        Crea una nueva área para organizar tus pantallas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="ej. Lobby Principal"
                            disabled={isCreating}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                            placeholder="Descripción opcional del área..."
                            disabled={isCreating}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                    </div>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isCreating}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isCreating}>
                        {isCreating ? 'Creando...' : 'Crear Área'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
