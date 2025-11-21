/**
 * Request logging middleware
 * Logs HTTP requests with method, path, status, and duration
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Logger middleware
 * Logs incoming requests and their response status/duration
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Determine log level based on status code
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

    // Format log message
    const message = `[${level}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`;

    // Log to console (will be replaced with Winston later)
    if (level === 'ERROR') {
      console.error(message);
    } else if (level === 'WARN') {
      console.warn(message);
    } else {
      console.log(message);
    }
  });

  next();
}

/**
 * Simple logger utility for structured logging
 * This will be replaced with Winston in future iterations
 */
export const log = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(
      `[WARN] ${message}`,
      meta ? JSON.stringify(meta, null, 2) : ''
    );
  },

  error: (message: string, error?: Error | unknown): void => {
    console.error(`[ERROR] ${message}`);
    if (error instanceof Error) {
      console.error(`  Stack: ${error.stack}`);
    } else if (error) {
      console.error(`  Error:`, error);
    }
  },

  debug: (message: string, meta?: Record<string, unknown>): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[DEBUG] ${message}`,
        meta ? JSON.stringify(meta, null, 2) : ''
      );
    }
  },
};
