/**
 * Server-side authentication utilities
 * For use in Server Components and middleware
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface TokenPayload {
    userId: string;
    email: string;
    role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER';
    hotelId?: string;
}

/**
 * Get user info from refresh token by calling backend
 * Used when we only have refresh token (from cookie)
 * @param refreshToken - Refresh token from cookie
 * @returns User info or null
 */
export async function getUserFromRefreshToken(
    refreshToken: string
): Promise<TokenPayload | null> {
    try {
        // Call backend to validate refresh token and get user info
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                Cookie: `refreshToken=${refreshToken}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Handle API response structure
        const user = data.data?.user || data.user || data.data;

        if (!user) {
            return null;
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            hotelId: user.hotelId,
        };
    } catch {
        return null;
    }
}

/**
 * Check if user has one of the allowed roles
 */
export function hasAllowedRole(
    user: TokenPayload | null,
    allowedRoles: Array<'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'AREA_MANAGER'>
): boolean {
    if (!user) return false;
    return allowedRoles.includes(user.role);
}

/**
 * Check if user belongs to a specific hotel
 */
export function belongsToHotel(
    user: TokenPayload | null,
    hotelId: string
): boolean {
    if (!user) return false;
    // SUPER_ADMIN can access all hotels
    if (user.role === 'SUPER_ADMIN') return true;
    return user.hotelId === hotelId;
}
