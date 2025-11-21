/**
 * Content Model Types
 * Synced with Prisma schema: apps/backend/prisma/schema.prisma
 */

/**
 * Content type enum
 * Represents the type of media content
 */
export enum ContentType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  HTML = 'HTML',
}

/**
 * Content interface
 * Represents a piece of media content (video, image, or HTML)
 */
export interface Content {
  id: string;
  title: string;
  type: ContentType;
  url: string;
  duration: number | null;
  fileSize: bigint | null;
  hotelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content for frontend use (BigInt converted to number/string)
 */
export interface ContentDTO {
  id: string;
  title: string;
  type: ContentType;
  url: string;
  duration: number | null;
  fileSize: number | null; // In bytes, converted from BigInt
  fileSizeFormatted?: string; // Human-readable format (e.g., "3.2 GB")
  hotelId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Display-Content relationship
 * Represents the assignment of content to a display
 */
export interface DisplayContent {
  id: string;
  displayId: string;
  contentId: string;
  order: number;
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Display-Content with relations
 */
export interface DisplayContentWithRelations extends DisplayContent {
  content?: Content;
  display?: {
    id: string;
    name: string;
    location: string;
  };
}

/**
 * Content creation payload
 */
export interface CreateContentPayload {
  title: string;
  type: ContentType;
  url: string;
  duration?: number | null;
  fileSize?: number | null;
  hotelId: string;
}

/**
 * Content update payload
 */
export interface UpdateContentPayload {
  title?: string;
  type?: ContentType;
  url?: string;
  duration?: number | null;
}

/**
 * Content filter for querying
 */
export interface ContentFilter {
  hotelId?: string;
  type?: ContentType;
  search?: string;
}

/**
 * Playlist item
 * Represents a scheduled content item in a playlist
 */
export interface PlaylistItem {
  contentId: string;
  content: ContentDTO;
  order: number;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
}

/**
 * Playlist
 * Collection of scheduled content for a display
 */
export interface Playlist {
  displayId: string;
  items: PlaylistItem[];
  totalDuration: number; // Total duration in seconds
  lastUpdated: Date | string;
}

/**
 * Assign content to display payload
 */
export interface AssignContentPayload {
  displayId: string;
  contentId: string;
  order: number;
  startTime?: string | null;
  endTime?: string | null;
}
