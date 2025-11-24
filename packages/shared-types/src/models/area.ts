/**
 * Area Model Types
 * Synced with Prisma schema: apps/backend/prisma/schema.prisma
 */

/**
 * Area interface
 * Represents a physical area within a hotel (lobby, spa, restaurant, etc.)
 */
export interface Area {
  id: string;
  name: string;
  slug: string;
  hotelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create area payload
 */
export interface CreateAreaPayload {
  name: string;
  slug: string;
  hotelId: string;
}

/**
 * Update area payload
 */
export interface UpdateAreaPayload {
  name?: string;
  slug?: string;
}
