'use client';

/**
 * Users Layout
 * Client-side role validation for Users management
 * Allows: SUPER_ADMIN, HOTEL_ADMIN
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface UsersLayoutProps {
    children: React.ReactNode;
}

export default function UsersLayout({ children }: UsersLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            setIsAuthorized(false);
            return;
        }

        const allowedRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN'];
        if (allowedRoles.includes(user.role)) {
            setIsAuthorized(true);
        } else {
            router.replace('/home');
        }
    }, [user, isLoading, router]);

    if (isLoading || isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
