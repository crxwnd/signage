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
 * Content status enum
 * Represents the processing status of content
 */
export enum ContentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * Content orientation type
 */
export type ContentOrientation = 'horizontal' | 'vertical' | 'square';

/**
 * Content interface
 * Represents a piece of media content (video, image, or HTML)
 */
export interface Content {
  id: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  originalUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  resolution: string | null;
  fileSize: bigint | null;
  // Media metadata
  width: number | null;
  height: number | null;
  aspectRatio: string | null;  // '16:9', '9:16', '4:3', '1:1'
  orientation: ContentOrientation | null;
  hotelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content for frontend use (BigInt converted to number/string)
 */
export interface ContentDTO {
  id: string;
  name: string;
  type: ContentType;
  status: ContentStatus;
  originalUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  resolution: string | null;
  fileSize: number | null; // In bytes, converted from BigInt
  fileSizeFormatted?: string; // Human-readable format (e.g., "3.2 GB")
  // Media metadata
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  orientation: ContentOrientation | null;
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
  name: string;
  type: ContentType;
  originalUrl: string;
  hotelId: string;
  fileSize?: number | null;
}

/**
 * Content update payload
 */
export interface UpdateContentPayload {
  name?: string;
  status?: ContentStatus;
  hlsUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  resolution?: string | null;
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
