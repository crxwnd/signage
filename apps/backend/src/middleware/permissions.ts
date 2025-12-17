/**
 * RBAC Permission Helpers
 * Utility functions for role-based access control filtering
 */

import type { UserRole } from '@prisma/client';

/**
 * User data from JWT token
 */
export interface RBACUser {
    userId: string;
    role: UserRole;
    hotelId: string | null;
    areaId?: string | null;
}

/**
 * Get hotel filter for Prisma queries
 * - SUPER_ADMIN: No filter (sees all)
 * - HOTEL_ADMIN: Filter by their hotelId
 * - AREA_MANAGER: Filter by their hotelId
 */
export function getHotelFilter(user: RBACUser): { hotelId?: string } {
    if (user.role === 'SUPER_ADMIN') {
        return {}; // No filter - sees everything
    }

    if (!user.hotelId) {
        // Safety: if user has no hotel, return impossible filter
        return { hotelId: '___INVALID___' };
    }

    return { hotelId: user.hotelId };
}

/**
 * Get display filter for Prisma queries
 * - SUPER_ADMIN: No filter (sees all displays)
 * - HOTEL_ADMIN: Filter by their hotelId (sees all displays in hotel)
 * - AREA_MANAGER: Filter by their areaId (sees only displays in their area)
 */
export function getDisplayFilter(user: RBACUser): { hotelId?: string; areaId?: string } {
    if (user.role === 'SUPER_ADMIN') {
        return {}; // No filter - sees everything
    }

    if (user.role === 'HOTEL_ADMIN') {
        if (!user.hotelId) {
            return { hotelId: '___INVALID___' };
        }
        return { hotelId: user.hotelId };
    }

    // AREA_MANAGER - only their area
    if (!user.areaId || !user.hotelId) {
        return { hotelId: '___INVALID___', areaId: '___INVALID___' };
    }

    return {
        hotelId: user.hotelId,
        areaId: user.areaId,
    };
}

/**
 * Check if user can access a specific display
 */
export function canAccessDisplay(
    user: RBACUser,
    display: { hotelId: string; areaId?: string | null }
): boolean {
    // SUPER_ADMIN can access everything
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    // User must belong to the same hotel
    if (user.hotelId !== display.hotelId) {
        return false;
    }

    // HOTEL_ADMIN can access all displays in their hotel
    if (user.role === 'HOTEL_ADMIN') {
        return true;
    }

    // AREA_MANAGER can only access displays in their area
    if (user.role === 'AREA_MANAGER') {
        // If display has no area, AREA_MANAGER cannot access it
        if (!display.areaId) {
            return false;
        }
        return user.areaId === display.areaId;
    }

    return false;
}

/**
 * Check if user can access a specific content
 */
export function canAccessContent(
    user: RBACUser,
    content: { hotelId: string }
): boolean {
    // SUPER_ADMIN can access everything
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    // All other roles: must belong to the same hotel
    return user.hotelId === content.hotelId;
}

/**
 * Check if user can create resources in a hotel
 */
export function canCreateInHotel(
    user: RBACUser,
    targetHotelId: string | undefined
): { allowed: boolean; hotelId: string | null } {
    // SUPER_ADMIN can create in any hotel if specified
    if (user.role === 'SUPER_ADMIN') {
        return {
            allowed: !!targetHotelId,
            hotelId: targetHotelId || null,
        };
    }

    // HOTEL_ADMIN and AREA_MANAGER create in their own hotel
    return {
        allowed: !!user.hotelId,
        hotelId: user.hotelId,
    };
}

/**
 * Check if user can modify/delete a resource
 * - SUPER_ADMIN: Can modify anything
 * - HOTEL_ADMIN: Can modify resources in their hotel
 * - AREA_MANAGER: Cannot modify (read-only for displays/content outside their area)
 */
export function canModifyResource(
    user: RBACUser,
    resource: { hotelId: string },
    allowAreaManager: boolean = false
): boolean {
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    if (user.role === 'AREA_MANAGER' && !allowAreaManager) {
        return false;
    }

    return user.hotelId === resource.hotelId;
}
