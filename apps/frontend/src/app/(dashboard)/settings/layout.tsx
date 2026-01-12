'use client';

/**
 * Settings Layout
 * Client-side role validation for Settings pages
 * Allows: SUPER_ADMIN, HOTEL_ADMIN
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) return;

        // If no user, AuthContext handles redirect to login
        if (!user) {
            setIsAuthorized(false);
            return;
        }

        // Check role
        const allowedRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN'];
        if (allowedRoles.includes(user.role)) {
            setIsAuthorized(true);
        } else {
            // AREA_MANAGER doesn't have access to Settings
            router.replace('/home');
        }
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading || isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Not authorized - show loading while redirecting
    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Authorized - render children
    return <>{children}</>;
}
