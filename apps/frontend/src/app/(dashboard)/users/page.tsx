'use client';

/**
 * Users Management Page
 * CRUD for system users with RBAC
 * Only accessible to SUPER_ADMIN and HOTEL_ADMIN
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users as UsersIcon, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { UsersTable, CreateUserModal } from '@/components/users';

export default function UsersPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Redirect AREA_MANAGER to displays
    useEffect(() => {
        if (!isLoading && user && user.role === 'AREA_MANAGER') {
            router.replace('/displays');
        }
    }, [user, isLoading, router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    // Block AREA_MANAGER (will redirect, show nothing while redirecting)
    if (!user || user.role === 'AREA_MANAGER') {
        return (
            <Card className="mx-auto max-w-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Access not authorized</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <UsersIcon className="h-8 w-8" />
                        Users
                    </h2>
                    <p className="text-muted-foreground">
                        Manage system users and their roles
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Users Table */}
            <UsersTable />

            {/* Create User Modal */}
            <CreateUserModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
}
