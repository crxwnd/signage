/**
 * Settings Layout - Server-side protected
 * Only SUPER_ADMIN and HOTEL_ADMIN can access
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromRefreshToken, hasAllowedRole } from '@/lib/auth-server';

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // No token - redirect to login
    if (!refreshToken) {
        redirect('/login?redirect=/settings');
    }

    // Get user info from backend
    const user = await getUserFromRefreshToken(refreshToken);

    // Invalid session - redirect to login
    if (!user) {
        redirect('/login?redirect=/settings');
    }

    // Check role - Only SUPER_ADMIN and HOTEL_ADMIN can access settings
    if (!hasAllowedRole(user, ['SUPER_ADMIN', 'HOTEL_ADMIN'])) {
        redirect('/home?error=unauthorized');
    }

    return <>{children}</>;
}
