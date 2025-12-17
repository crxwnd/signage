'use client';

/**
 * AreaCard Component
 * Card component for displaying individual area information
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layers, Monitor, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Area } from '@/lib/api/areas';

interface AreaCardProps {
    area: Area;
    onEdit: (area: Area) => void;
    onDelete: (area: Area) => void;
    canManage?: boolean; // false for AREA_MANAGER
}

export function AreaCard({ area, onEdit, onDelete, canManage = true }: AreaCardProps) {
    const displayCount = area._count?.displays ?? 0;
    const userCount = area._count?.users ?? 0;

    return (
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6">
                {/* Header with icon and name */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{area.name}</h3>
                            {area.hotel?.name && (
                                <p className="text-sm text-muted-foreground">{area.hotel.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions Menu */}
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(area)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(area)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Description */}
                {area.description && (
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                        {area.description}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        {displayCount} {displayCount === 1 ? 'Display' : 'Displays'}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {userCount} {userCount === 1 ? 'Usuario' : 'Usuarios'}
                    </Badge>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
        </Card>
    );
}
