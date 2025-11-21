/**
 * Global error handling middleware
 * Catches all errors and formats them as ApiErrorResponse
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@shared-types';
import { log } from './logger';
import { isDevelopment } from '../config';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log error
  log.error(`Error in ${req.method} ${req.originalUrl}`, err);

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Determine error code
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  // Build error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      details: err instanceof AppError ? err.details : undefined,
      stack: isDevelopment ? err.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );

  next(error);
}
