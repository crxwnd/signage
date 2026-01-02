'use client';

import { useState } from 'react';
import { useCreateSchedule } from '@/hooks/useSchedules';
import { useContent } from '@/hooks/useContent';
import { useDisplays } from '@/hooks/useDisplays';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { RecurrenceEditor } from './RecurrenceEditor';

interface CreateScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateScheduleModal({ open, onOpenChange }: CreateScheduleModalProps) {
    const { user } = useAuth();
    const createSchedule = useCreateSchedule();
    const { contents } = useContent();
    const { displays } = useDisplays();
    const { areas } = useAreas();

    const [formData, setFormData] = useState({
        name: '',
        contentId: '',
        targetType: 'display' as 'display' | 'area',
        displayId: '',
        areaId: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        recurrence: undefined as string | undefined,
        priority: 0,
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await createSchedule.mutateAsync({
                name: formData.name,
                contentId: formData.contentId,
                displayId: formData.targetType === 'display' ? formData.displayId : undefined,
                areaId: formData.targetType === 'area' ? formData.areaId : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate || undefined,
                startTime: formData.startTime,
                endTime: formData.endTime,
                recurrence: formData.recurrence,
                priority: formData.priority,
                hotelId: user?.hotelId || undefined,
            });

            onOpenChange(false);
            // Reset form
            setFormData({
                name: '',
                contentId: '',
                targetType: 'display',
                displayId: '',
                areaId: '',
                startDate: '',
                endDate: '',
                startTime: '09:00',
                endTime: '18:00',
                recurrence: undefined,
                priority: 0,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear la programación';
            setError(message);
        }
    };

    // Filter ready content only
    const readyContents = contents.filter((c) => c.status === 'READY');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nueva Programación</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Promoción Fin de Semana"
                            required
                        />
                    </div>

                    {/* Content Select */}
                    <div className="space-y-2">
                        <Label>Contenido</Label>
                        <Select
                            value={formData.contentId}
                            onValueChange={(value) => setFormData({ ...formData, contentId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar contenido" />
                            </SelectTrigger>
                            <SelectContent>
                                {readyContents.map((content) => (
                                    <SelectItem key={content.id} value={content.id}>
                                        {content.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Target Type */}
                    <div className="space-y-2">
                        <Label>Asignar a</Label>
                        <Select
                            value={formData.targetType}
                            onValueChange={(value: 'display' | 'area') =>
                                setFormData({ ...formData, targetType: value, displayId: '', areaId: '' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="display">Display específico</SelectItem>
                                <SelectItem value="area">Área completa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Display/Area Select */}
                    {formData.targetType === 'display' ? (
                        <div className="space-y-2">
                            <Label>Display</Label>
                            <Select
                                value={formData.displayId}
                                onValueChange={(value) => setFormData({ ...formData, displayId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar display" />
                                </SelectTrigger>
                                <SelectContent>
                                    {displays.map((display) => (
                                        <SelectItem key={display.id} value={display.id}>
                                            {display.name} - {display.location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Área</Label>
                            <Select
                                value={formData.areaId}
                                onValueChange={(value) => setFormData({ ...formData, areaId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar área" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha inicio</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Fecha fin (opcional)</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Hora inicio</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">Hora fin</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Recurrence */}
                    <RecurrenceEditor
                        value={formData.recurrence}
                        onChange={(recurrence: string | undefined) => setFormData({ ...formData, recurrence })}
                    />

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label htmlFor="priority">Prioridad (0-100)</Label>
                        <Input
                            id="priority"
                            type="number"
                            min={0}
                            max={100}
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Mayor número = mayor prioridad. Usado cuando hay schedules superpuestos.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createSchedule.isPending}>
                            {createSchedule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Crear Programación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
