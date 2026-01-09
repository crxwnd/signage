/**
 * Hotels Management Layout - Server-side protected
 * Only SUPER_ADMIN can manage hotels
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromRefreshToken, hasAllowedRole } from '@/lib/auth-server';

interface HotelsLayoutProps {
    children: React.ReactNode;
}

export default async function HotelsLayout({ children }: HotelsLayoutProps) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
        redirect('/login?redirect=/settings/hotels');
    }

    const user = await getUserFromRefreshToken(refreshToken);

    if (!user) {
        redirect('/login?redirect=/settings/hotels');
    }

    // Only SUPER_ADMIN can manage hotels
    if (!hasAllowedRole(user, ['SUPER_ADMIN'])) {
        redirect('/home?error=unauthorized');
    }

    return <>{children}</>;
}
