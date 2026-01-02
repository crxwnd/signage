'use client';

/**
 * Alerts Page
 * Management interface for emergency alerts and notifications
 */

import { useState } from 'react';
import { useAlerts, useDeactivateAlert, useDeleteAlert } from '@/hooks/useAlerts';
import { CreateAlertModal } from '@/components/alerts/CreateAlertModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertTriangle,
    Bell,
    Plus,
    Power,
    Trash2,
    Info,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Alert, AlertType } from '@shared-types';

const alertTypeConfig: Record<AlertType, { icon: typeof Info; color: string; label: string }> = {
    INFO: { icon: Info, color: 'bg-blue-500', label: 'Info' },
    WARNING: { icon: AlertCircle, color: 'bg-yellow-500', label: 'Warning' },
    EMERGENCY: { icon: AlertTriangle, color: 'bg-red-500', label: 'Emergency' },
};

export default function AlertsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const { data: alerts, isLoading } = useAlerts();
    const deactivateMutation = useDeactivateAlert();
    const deleteMutation = useDeleteAlert();

    const activeAlerts = alerts?.filter((a) => a.isActive) || [];
    const inactiveAlerts = alerts?.filter((a) => !a.isActive) || [];

    const handleDeactivate = async (id: string) => {
        try {
            await deactivateMutation.mutateAsync(id);
            toast.success('Alerta desactivada');
        } catch {
            toast.error('Error al desactivar alerta');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta alerta permanentemente?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Alerta eliminada');
        } catch {
            toast.error('Error al eliminar alerta');
        }
    };

    const getScopeLabel = (alert: Alert) => {
        if (alert.display?.name) return alert.display.name;
        if (alert.area?.name) return alert.area.name;
        return 'Todo el hotel';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Alertas</h1>
                    <p className="text-muted-foreground">
                        Gestiona alertas urgentes para tus displays
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Alerta
                </Button>
            </div>

            {/* Active Alerts */}
            <Card className="border-red-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-500" />
                        Alertas Activas ({activeAlerts.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activeAlerts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No hay alertas activas
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Alcance</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                    <TableHead>Inicio</TableHead>
                                    <TableHead>Fin</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeAlerts.map((alert) => {
                                    const config = alertTypeConfig[alert.type];
                                    const Icon = config.icon;
                                    return (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <Badge className={config.color}>
                                                    <Icon className="h-3 w-3 mr-1" />
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{alert.name}</TableCell>
                                            <TableCell>{getScopeLabel(alert)}</TableCell>
                                            <TableCell>{alert.priority}</TableCell>
                                            <TableCell>
                                                {format(new Date(alert.startAt), 'dd/MM HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                {alert.endAt
                                                    ? format(new Date(alert.endAt), 'dd/MM HH:mm')
                                                    : 'Manual'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(alert.id)}
                                                        disabled={deactivateMutation.isPending}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(alert.id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Alertas</CardTitle>
                </CardHeader>
                <CardContent>
                    {inactiveAlerts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No hay alertas en el historial
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Alcance</TableHead>
                                    <TableHead>Creada</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inactiveAlerts.slice(0, 10).map((alert) => {
                                    const config = alertTypeConfig[alert.type];
                                    return (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <Badge variant="secondary">{config.label}</Badge>
                                            </TableCell>
                                            <TableCell>{alert.name}</TableCell>
                                            <TableCell>{getScopeLabel(alert)}</TableCell>
                                            <TableCell>
                                                {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(alert.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateAlertModal open={showCreate} onOpenChange={setShowCreate} />
        </div>
    );
}
