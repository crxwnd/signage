'use client';

/**
 * Areas Page
 * List and manage hotel areas
 * Protected: Only HOTEL_ADMIN+ can access
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManage } from '@/components/auth/RoleGate';
import {
    AreaCard,
    CreateAreaModal,
    EditAreaModal,
    DeleteAreaDialog,
} from '@/components/areas';
import type { Area } from '@/lib/api/areas';

export default function AreasPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const canManage = useCanManage();
    const { areas, isLoading, error, refetch } = useAreas();

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);

    // Role protection: Redirect AREA_MANAGER to displays
    useEffect(() => {
        if (!authLoading && user && user.role === 'AREA_MANAGER') {
            router.replace('/displays');
        }
    }, [user, authLoading, router]);

    // Handlers
    const handleEdit = (area: Area) => {
        setSelectedArea(area);
        setEditModalOpen(true);
    };

    const handleDelete = (area: Area) => {
        setSelectedArea(area);
        setDeleteDialogOpen(true);
    };

    const handleSuccess = () => {
        refetch();
    };

    // Show nothing while checking auth or redirecting
    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Skeleton className="h-8 w-32" />
            </div>
        );
    }

    // Block AREA_MANAGER (will redirect, but show nothing while redirecting)
    if (user?.role === 'AREA_MANAGER') {
        return (
            <Card className="mx-auto max-w-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Acceso no autorizado</p>
                </CardContent>
            </Card>
        );
    }

    const hasAreas = areas.length > 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Áreas</h2>
                    <p className="text-muted-foreground">
                        Organiza tus pantallas por zonas del hotel
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Área
                    </Button>
                )}
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <div>
                                <p className="font-semibold">Error al cargar áreas</p>
                                <p className="text-sm opacity-80">{error.message}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && !hasAreas && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Áreas</CardTitle>
                        <CardDescription>
                            Las áreas te permiten agrupar pantallas por ubicación
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No hay áreas creadas</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Crea tu primera área para organizar las pantallas del hotel
                            </p>
                            {canManage && (
                                <Button onClick={() => setCreateModalOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear Primera Área
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Areas Grid */}
            {!isLoading && hasAreas && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area) => (
                        <AreaCard
                            key={area.id}
                            area={area}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}

            {/* Modals - Only render if user can manage */}
            {canManage && (
                <>
                    <CreateAreaModal
                        isOpen={createModalOpen}
                        onClose={() => setCreateModalOpen(false)}
                        onSuccess={handleSuccess}
                    />

                    <EditAreaModal
                        area={selectedArea}
                        isOpen={editModalOpen}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedArea(null);
                        }}
                        onSuccess={handleSuccess}
                    />

                    <DeleteAreaDialog
                        area={selectedArea}
                        isOpen={deleteDialogOpen}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setSelectedArea(null);
                        }}
                        onSuccess={handleSuccess}
                    />
                </>
            )}
        </div>
    );
}

