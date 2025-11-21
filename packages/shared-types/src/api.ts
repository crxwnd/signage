/**
 * API Request/Response Types
 * Standard formats for HTTP API communication
 */

// ==============================================
// GENERIC API RESPONSE WRAPPER
// ==============================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  };
  timestamp: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==============================================
// PAGINATION
// ==============================================

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  sortBy?: string; // Field name to sort by
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ==============================================
// ERROR CODES
// ==============================================

/**
 * Standard error codes
 */
export enum ApiErrorCode {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  FORBIDDEN = 'FORBIDDEN',
  REQUIRES_2FA = 'REQUIRES_2FA',
  INVALID_2FA_CODE = 'INVALID_2FA_CODE',

  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Business Logic
  PAIRING_CODE_INVALID = 'PAIRING_CODE_INVALID',
  PAIRING_CODE_EXPIRED = 'PAIRING_CODE_EXPIRED',
  DISPLAY_ALREADY_PAIRED = 'DISPLAY_ALREADY_PAIRED',
  CONTENT_ALREADY_ASSIGNED = 'CONTENT_ALREADY_ASSIGNED',
  INSUFFICIENT_STORAGE = 'INSUFFICIENT_STORAGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

// ==============================================
// VALIDATION ERROR
// ==============================================

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      errors: ValidationError[];
    };
  };
}

// ==============================================
// BATCH OPERATIONS
// ==============================================

/**
 * Batch operation request
 */
export interface BatchOperationRequest<T> {
  operations: T[];
}

/**
 * Batch operation result item
 */
export interface BatchOperationResultItem<T> {
  index: number;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Batch operation response
 */
export interface BatchOperationResponse<T> {
  results: BatchOperationResultItem<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ==============================================
// FILE UPLOAD
// ==============================================

/**
 * File upload request metadata
 */
export interface FileUploadRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
  hotelId: string;
  title?: string;
  duration?: number;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  uploadId: string;
  uploadUrl: string; // Pre-signed URL for direct upload
  contentId: string;
  expiresAt: string; // ISO timestamp
}

/**
 * Chunked upload request
 */
export interface ChunkedUploadRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
}

/**
 * Chunked upload response
 */
export interface ChunkedUploadResponse {
  uploadId: string;
  chunkIndex: number;
  completed: boolean;
  nextChunkUrl?: string;
}

/**
 * Upload complete request
 */
export interface UploadCompleteRequest {
  uploadId: string;
  contentId: string;
}

// ==============================================
// HEALTH CHECK
// ==============================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number; // Seconds
  services: {
    database: 'ok' | 'down';
    redis: 'ok' | 'down';
    storage: 'ok' | 'down';
    socketio: 'ok' | 'down';
  };
  version: string;
}

// ==============================================
// STATISTICS
// ==============================================

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  displays: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  content: {
    total: number;
    videos: number;
    images: number;
    html: number;
    totalSize: number; // Bytes
  };
  users: {
    total: number;
    byRole: {
      superAdmin: number;
      hotelAdmin: number;
      areaManager: number;
    };
  };
  hotels: {
    total: number;
  };
}

/**
 * Display statistics
 */
export interface DisplayStats {
  displayId: string;
  uptime: number; // Percentage
  lastOnline: string | null;
  contentPlayedCount: number;
  averagePlaybackTime: number; // Seconds
  cacheUsage: {
    used: number; // Bytes
    total: number; // Bytes
    percentage: number;
  };
  errors: {
    count: number;
    lastError: string | null;
    lastErrorAt: string | null;
  };
}

// ==============================================
// ACTIVITY LOG
// ==============================================

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: {
    type: 'display' | 'content' | 'user' | 'hotel';
    id: string;
    name: string;
  };
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Activity log query
 */
export interface ActivityLogQuery extends PaginationQuery {
  userId?: string;
  action?: string;
  targetType?: 'display' | 'content' | 'user' | 'hotel';
  targetId?: string;
  startDate?: string; // ISO timestamp
  endDate?: string; // ISO timestamp
}
