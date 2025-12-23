'use client';

/**
 * RoleGate Component
 * Conditional rendering based on user role
 *
 * @example
 * <RoleGate allowedRoles={['SUPER_ADMIN', 'HOTEL_ADMIN']}>
 *   <CreateButton />
 * </RoleGate>
 */

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';

interface RoleGateProps {
    /** List of roles allowed to see the children */
    allowedRoles: UserRole[];
    /** Content to render if user has required role */
    children: ReactNode;
    /** Content to render if user doesn't have required role (default: null) */
    fallback?: ReactNode;
}

/**
 * RoleGate - Conditionally renders children based on user role
 *
 * Rules:
 * - If user is not authenticated, renders fallback
 * - If user's role is in allowedRoles, renders children
 * - Otherwise renders fallback
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const { user, isLoading } = useAuth();

    // While loading auth state, render nothing to avoid flash
    if (isLoading) {
        return null;
    }

    // Not authenticated
    if (!user) {
        return <>{fallback}</>;
    }

    // Check if user's role is in the allowed list
    if (allowedRoles.includes(user.role as UserRole)) {
        return <>{children}</>;
    }

    // User doesn't have required role
    return <>{fallback}</>;
}

/**
 * Helper: Check if user can manage (create/edit/delete)
 * Returns true for SUPER_ADMIN and HOTEL_ADMIN
 */
export function useCanManage(): boolean {
    const { user } = useAuth();
    if (!user) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'HOTEL_ADMIN';
}

/**
 * Helper: Check if user is super admin
 */
export function useIsSuperAdmin(): boolean {
    const { user } = useAuth();
    if (!user) return false;
    return user.role === 'SUPER_ADMIN';
}
