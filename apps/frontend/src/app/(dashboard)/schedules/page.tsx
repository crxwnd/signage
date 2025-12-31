'use client';

import { useState } from 'react';
import { useSchedules, useDeleteSchedule } from '@/hooks/useSchedules';
import { CreateScheduleModal } from '@/components/schedules/CreateScheduleModal';
import { ScheduleCalendar } from '@/components/schedules/ScheduleCalendar';
import { ScheduleList } from '@/components/schedules/ScheduleList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, List, Loader2 } from 'lucide-react';

export default function SchedulesPage() {
    const [showCreate, setShowCreate] = useState(false);
    const { data: schedules, isLoading, error } = useSchedules();
    const deleteSchedule = useDeleteSchedule();

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta programación?')) {
            await deleteSchedule.mutateAsync(id);
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error cargando programaciones</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Programación</h1>
                    <p className="text-muted-foreground">
                        Programa contenido para tus displays con fechas y recurrencias
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Programación
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Schedules
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schedules?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {schedules?.filter(s => s.isActive).length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Recurrentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {schedules?.filter(s => s.recurrence).length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pausados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {schedules?.filter(s => !s.isActive).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Views */}
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Tabs defaultValue="calendar">
                            <TabsList className="mb-4">
                                <TabsTrigger value="calendar">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Calendario
                                </TabsTrigger>
                                <TabsTrigger value="list">
                                    <List className="h-4 w-4 mr-2" />
                                    Lista
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="calendar">
                                <ScheduleCalendar
                                    schedules={schedules || []}
                                    onEventClick={(schedule) => {
                                        // TODO: Open edit modal
                                        console.log('Edit schedule:', schedule.id);
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="list">
                                <ScheduleList
                                    schedules={schedules || []}
                                    onDelete={handleDelete}
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            <CreateScheduleModal
                open={showCreate}
                onOpenChange={setShowCreate}
            />
        </div>
    );
}
