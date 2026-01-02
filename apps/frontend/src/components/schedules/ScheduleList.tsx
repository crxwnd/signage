'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Schedule } from '@/lib/api/schedules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash2, Repeat, Calendar, Clock, Monitor, Layers } from 'lucide-react';

interface ScheduleListProps {
    schedules: Schedule[];
    onDelete?: (id: string) => void;
    onEdit?: (schedule: Schedule) => void;
}

export function ScheduleList({ schedules, onDelete, onEdit }: ScheduleListProps) {
    if (schedules.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay programaciones</p>
                <p className="text-sm">Crea tu primera programación para empezar</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contenido</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {schedules.map((schedule) => (
                    <TableRow
                        key={schedule.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onEdit?.(schedule)}
                    >
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{schedule.content?.name || '-'}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                                {schedule.display ? (
                                    <>
                                        <Monitor className="h-3 w-3" />
                                        {schedule.display.name}
                                    </>
                                ) : schedule.area ? (
                                    <>
                                        <Layers className="h-3 w-3" />
                                        {schedule.area.name}
                                    </>
                                ) : (
                                    '-'
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(schedule.startDate), 'dd MMM yyyy', { locale: es })}
                                {schedule.endDate && (
                                    <>
                                        <span className="text-muted-foreground">→</span>
                                        {format(new Date(schedule.endDate), 'dd MMM', { locale: es })}
                                    </>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {schedule.startTime} - {schedule.endTime}
                            </div>
                        </TableCell>
                        <TableCell>
                            {schedule.recurrence ? (
                                <Badge variant="secondary" className="text-xs">
                                    <Repeat className="h-3 w-3 mr-1" />
                                    {schedule.recurrenceDescription || 'Recurrente'}
                                </Badge>
                            ) : (
                                <span className="text-sm text-muted-foreground">Una vez</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                                {schedule.isActive ? 'Activo' : 'Pausado'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(schedule.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
