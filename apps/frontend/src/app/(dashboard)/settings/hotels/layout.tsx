'use client';

/**
 * Hotels Layout
 * Client-side role validation for Hotels management
 * Allows: SUPER_ADMIN only
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface HotelsLayoutProps {
    children: React.ReactNode;
}

export default function HotelsLayout({ children }: HotelsLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            setIsAuthorized(false);
            return;
        }

        // Only SUPER_ADMIN can manage hotels
        if (user.role === 'SUPER_ADMIN') {
            setIsAuthorized(true);
        } else {
            router.replace('/settings');
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
