'use client';

/**
 * Hotels Management Page
 * Placeholder - Only visible to SUPER_ADMIN
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function HotelsPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Role protection: Only SUPER_ADMIN can access
    useEffect(() => {
        if (!isLoading && user && user.role !== 'SUPER_ADMIN') {
            router.replace('/displays');
        }
    }, [user, isLoading, router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Skeleton className="h-8 w-32" />
            </div>
        );
    }

    // Block non-SUPER_ADMIN (will redirect, show nothing while redirecting)
    if (!user || user.role !== 'SUPER_ADMIN') {
        return (
            <Card className="mx-auto max-w-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Acceso no autorizado</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hotels</h2>
                    <p className="text-muted-foreground">
                        Manage hotels in the signage network
                    </p>
                </div>
            </div>

            {/* Placeholder Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Hotels Management
                    </CardTitle>
                    <CardDescription>
                        This section is under development
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="mb-4 h-16 w-16 text-muted-foreground/50" />
                        <h3 className="mb-2 text-lg font-semibold">Coming Soon</h3>
                        <p className="max-w-md text-sm text-muted-foreground">
                            Esta sección está en desarrollo. Próximamente podrás:
                        </p>
                        <ul className="mt-4 text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                            <li>Crear y gestionar hoteles</li>
                            <li>Asignar administradores de hotel</li>
                            <li>Ver estadísticas por hotel</li>
                            <li>Configurar ajustes globales</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
