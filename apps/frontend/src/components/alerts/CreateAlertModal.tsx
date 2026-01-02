'use client';

/**
 * CreateAlertModal
 * Modal for creating new alerts with type, content, scope, and schedule options
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHotels } from '@/hooks/useHotels';
import { useAreas } from '@/hooks/useAreas';
import { useDisplays } from '@/hooks/useDisplays';
import { useCreateAlert } from '@/hooks/useAlerts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ContentSelector } from '@/components/ContentSelector';
import type { AlertType } from '@shared-types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Scope = 'hotel' | 'area' | 'display';

export function CreateAlertModal({ open, onOpenChange }: Props) {
    const { user } = useAuth();
    const { data: hotels } = useHotels();
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const effectiveHotelId = user?.hotelId || selectedHotelId;

    const { areas } = useAreas(
        effectiveHotelId ? { filter: { hotelId: effectiveHotelId } } : undefined
    );
    const { displays } = useDisplays();
    const createMutation = useCreateAlert();

    // Form state
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [contentId, setContentId] = useState('');
    const [scope, setScope] = useState<Scope>('hotel');
    const [areaId, setAreaId] = useState('');
    const [displayId, setDisplayId] = useState('');
    const [type, setType] = useState<AlertType>('INFO');
    const [priority, setPriority] = useState(100);
    const [endAt, setEndAt] = useState('');

    // Pre-select hotel for SUPER_ADMIN
    useEffect(() => {
        if (!user?.hotelId && hotels && hotels.length > 0 && hotels[0] && !selectedHotelId) {
            setSelectedHotelId(hotels[0].id);
        }
    }, [user?.hotelId, hotels, selectedHotelId]);

    const resetForm = () => {
        setName('');
        setMessage('');
        setContentId('');
        setScope('hotel');
        setAreaId('');
        setDisplayId('');
        setType('INFO');
        setPriority(100);
        setEndAt('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!effectiveHotelId || !name || !contentId) {
            toast.error('Completa los campos requeridos');
            return;
        }

        try {
            await createMutation.mutateAsync({
                name,
                message: message || undefined,
                contentId,
                hotelId: effectiveHotelId,
                areaId: scope === 'area' ? areaId : undefined,
                displayId: scope === 'display' ? displayId : undefined,
                type,
                priority,
                endAt: endAt || undefined,
            });

            toast.success('Alerta creada y activada');
            onOpenChange(false);
            resetForm();
        } catch {
            toast.error('Error al crear alerta');
        }
    };

    const filteredDisplays = displays.filter(
        (d) => effectiveHotelId && d.hotelId === effectiveHotelId
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nueva Alerta</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Hotel selector for SUPER_ADMIN */}
                    {!user?.hotelId && (
                        <div className="space-y-2">
                            <Label>Hotel</Label>
                            <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar hotel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hotels?.map((hotel) => (
                                        <SelectItem key={hotel.id} value={hotel.id}>
                                            {hotel.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la alerta *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Evacuacion Piso 3"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Mensaje (opcional)</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Texto adicional para mostrar"
                            rows={2}
                        />
                    </div>

                    <ContentSelector
                        hotelId={effectiveHotelId}
                        value={contentId}
                        onChange={setContentId}
                        label="Contenido a mostrar *"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(v) => setType(v as AlertType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INFO">Informativo</SelectItem>
                                    <SelectItem value="WARNING">Advertencia</SelectItem>
                                    <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridad</Label>
                            <Input
                                type="number"
                                min={1}
                                max={999}
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Alcance</Label>
                        <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hotel">Todo el hotel</SelectItem>
                                <SelectItem value="area">Area especifica</SelectItem>
                                <SelectItem value="display">Display especifico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {scope === 'area' && (
                        <div className="space-y-2">
                            <Label>Area</Label>
                            <Select value={areaId} onValueChange={setAreaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas?.map((area) => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {scope === 'display' && (
                        <div className="space-y-2">
                            <Label>Display</Label>
                            <Select value={displayId} onValueChange={setDisplayId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar display" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredDisplays.map((display) => (
                                        <SelectItem key={display.id} value={display.id}>
                                            {display.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Fin automatico (opcional)</Label>
                        <Input
                            type="datetime-local"
                            value={endAt}
                            onChange={(e) => setEndAt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Dejar vacio para desactivar manualmente
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                createMutation.isPending || !name || !contentId || !effectiveHotelId
                            }
                        >
                            {createMutation.isPending ? 'Creando...' : 'Crear y Activar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
