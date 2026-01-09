/**
 * Reports Layout - Server-side protected
 * Only SUPER_ADMIN and HOTEL_ADMIN can access reports
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromRefreshToken, hasAllowedRole } from '@/lib/auth-server';

interface ReportsLayoutProps {
    children: React.ReactNode;
}

export default async function ReportsLayout({ children }: ReportsLayoutProps) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
        redirect('/login?redirect=/reports');
    }

    const user = await getUserFromRefreshToken(refreshToken);

    if (!user) {
        redirect('/login?redirect=/reports');
    }

    // Only admins can view reports
    if (!hasAllowedRole(user, ['SUPER_ADMIN', 'HOTEL_ADMIN'])) {
        redirect('/home?error=unauthorized');
    }

    return <>{children}</>;
}
