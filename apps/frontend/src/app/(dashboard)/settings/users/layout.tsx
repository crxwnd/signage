/**
 * Users Management Layout - Server-side protected
 * Only SUPER_ADMIN and HOTEL_ADMIN can manage users
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromRefreshToken, hasAllowedRole } from '@/lib/auth-server';

interface UsersLayoutProps {
    children: React.ReactNode;
}

export default async function UsersLayout({ children }: UsersLayoutProps) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
        redirect('/login?redirect=/settings/users');
    }

    const user = await getUserFromRefreshToken(refreshToken);

    if (!user) {
        redirect('/login?redirect=/settings/users');
    }

    // Only admins can manage users
    if (!hasAllowedRole(user, ['SUPER_ADMIN', 'HOTEL_ADMIN'])) {
        redirect('/home?error=unauthorized');
    }

    return <>{children}</>;
}
