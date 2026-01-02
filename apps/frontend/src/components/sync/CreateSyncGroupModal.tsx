'use client';

/**
 * CreateSyncGroupModal Component
 * Modal for creating new sync groups with content, displays, and schedule options
 */

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContentSelector } from '@/components/ContentSelector';
import { PlaylistBuilder } from '@/components/PlaylistBuilder';
import { RecurrenceEditor } from '@/components/schedules/RecurrenceEditor';
import { useCreateSyncGroup } from '@/hooks/useSyncGroups';
import { useDisplays } from '@/hooks/useDisplays';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Check, Monitor, Calendar, FileVideo } from 'lucide-react';

interface CreateSyncGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface PlaylistItem {
    contentId: string;
    duration: number;
    order: number;
}

export function CreateSyncGroupModal({ open, onOpenChange }: CreateSyncGroupModalProps) {
    const { user } = useAuth();
    const hotelId = user?.hotelId || '';

    // Form state
    const [name, setName] = useState('');
    const [contentType, setContentType] = useState<'single' | 'playlist'>('single');
    const [contentId, setContentId] = useState('');
    const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
    const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);

    // Schedule state
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleStartDate, setScheduleStartDate] = useState('');
    const [scheduleEndDate, setScheduleEndDate] = useState('');
    const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
    const [scheduleEndTime, setScheduleEndTime] = useState('18:00');
    const [scheduleRecurrence, setScheduleRecurrence] = useState('');

    const { displays = [], isLoading: displaysLoading } = useDisplays();
    const createMutation = useCreateSyncGroup();

    const toggleDisplay = (displayId: string) => {
        setSelectedDisplays(prev =>
            prev.includes(displayId)
                ? prev.filter(id => id !== displayId)
                : [...prev, displayId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('El nombre es requerido');
            return;
        }

        if (contentType === 'single' && !contentId) {
            alert('Selecciona un contenido');
            return;
        }

        if (contentType === 'playlist' && playlistItems.length === 0) {
            alert('Agrega al menos un item a la playlist');
            return;
        }

        if (selectedDisplays.length < 2) {
            alert('Selecciona al menos 2 pantallas para sincronizar');
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: name.trim(),
                displayIds: selectedDisplays,
                hotelId: hotelId || undefined,
                contentId: contentType === 'single' && contentId ? contentId : undefined,
                playlistItems: contentType === 'playlist' && playlistItems.length > 0 ? playlistItems : undefined,
                scheduleEnabled,
                scheduleStart: scheduleEnabled && scheduleStartDate ? new Date(scheduleStartDate).toISOString() : undefined,
                scheduleEnd: scheduleEnabled && scheduleEndDate ? new Date(scheduleEndDate).toISOString() : undefined,
                scheduleStartTime: scheduleEnabled ? scheduleStartTime : undefined,
                scheduleEndTime: scheduleEnabled ? scheduleEndTime : undefined,
                scheduleRecurrence: scheduleEnabled && scheduleRecurrence ? scheduleRecurrence : undefined,
            });

            // Reset and close
            setName('');
            setContentType('single');
            setContentId('');
            setPlaylistItems([]);
            setSelectedDisplays([]);
            setScheduleEnabled(false);
            setScheduleStartDate('');
            setScheduleEndDate('');
            setScheduleStartTime('09:00');
            setScheduleEndTime('18:00');
            setScheduleRecurrence('');

            onOpenChange(false);
        } catch {
            // Error handled by mutation
        }
    };

    const isValid = name.trim() && selectedDisplays.length >= 2 &&
        ((contentType === 'single' && contentId) || (contentType === 'playlist' && playlistItems.length > 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Crear Grupo de Sincronización</DialogTitle>
                        <DialogDescription>
                            Configura un grupo de pantallas para reproducir contenido sincronizado.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Group name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre del grupo *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Lobby Screens, Entrada Principal..."
                                required
                            />
                        </div>

                        {/* Content section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <FileVideo className="w-4 h-4" />
                                <span className="font-medium text-sm uppercase">Contenido</span>
                            </div>

                            <RadioGroup
                                value={contentType}
                                onValueChange={(v: string) => setContentType(v as 'single' | 'playlist')}
                                className="space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="single" />
                                    <Label htmlFor="single" className="cursor-pointer text-sm">
                                        Contenido único (todas muestran lo mismo)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="playlist" id="playlist" />
                                    <Label htmlFor="playlist" className="cursor-pointer text-sm">
                                        Playlist (secuencia sincronizada)
                                    </Label>
                                </div>
                            </RadioGroup>

                            {contentType === 'single' ? (
                                <ContentSelector
                                    hotelId={hotelId}
                                    value={contentId}
                                    onChange={setContentId}
                                    label="Seleccionar contenido"
                                />
                            ) : (
                                <PlaylistBuilder
                                    hotelId={hotelId}
                                    items={playlistItems}
                                    onChange={setPlaylistItems}
                                />
                            )}
                        </div>

                        {/* Display selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Monitor className="w-4 h-4" />
                                <span className="font-medium text-sm uppercase">Pantallas</span>
                                <span className="text-xs text-muted-foreground">(mínimo 2)</span>
                            </div>

                            {displaysLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : displays.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay pantallas disponibles</p>
                            ) : (
                                <div className="max-h-[180px] overflow-y-auto space-y-1 border rounded-md p-2">
                                    {displays.map((display) => (
                                        <div
                                            key={display.id}
                                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                                            onClick={() => toggleDisplay(display.id)}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedDisplays.includes(display.id)
                                                ? 'bg-primary border-primary'
                                                : 'border-muted-foreground'
                                                }`}>
                                                {selectedDisplays.includes(display.id) && (
                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{display.name}</p>
                                                <p className="text-xs text-muted-foreground">{display.location}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${display.status === 'ONLINE'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {display.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedDisplays.length > 0 && (
                                <p className="text-xs text-primary">
                                    {selectedDisplays.length} pantalla(s) seleccionada(s)
                                </p>
                            )}
                        </div>

                        {/* Schedule section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium text-sm uppercase">Programación</span>
                                <span className="text-xs text-muted-foreground">(opcional)</span>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={scheduleEnabled}
                                    onCheckedChange={(checked: boolean | 'indeterminate') => setScheduleEnabled(checked === true)}
                                />
                                <span className="text-sm">
                                    Activar automáticamente por horario
                                </span>
                            </label>

                            {scheduleEnabled && (
                                <div className="space-y-4 p-3 bg-muted rounded-lg border">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Fecha inicio</Label>
                                            <Input
                                                type="date"
                                                value={scheduleStartDate}
                                                onChange={(e) => setScheduleStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Fecha fin (opcional)</Label>
                                            <Input
                                                type="date"
                                                value={scheduleEndDate}
                                                onChange={(e) => setScheduleEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Hora inicio</Label>
                                            <Input
                                                type="time"
                                                value={scheduleStartTime}
                                                onChange={(e) => setScheduleStartTime(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Hora fin</Label>
                                            <Input
                                                type="time"
                                                value={scheduleEndTime}
                                                onChange={(e) => setScheduleEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Repetición</Label>
                                        <RecurrenceEditor
                                            value={scheduleRecurrence}
                                            onChange={(rrule: string | undefined) => setScheduleRecurrence(rrule || '')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Grupo'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
