/**
 * Configuration module
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

/**
 * Server configuration
 */
export const config = {
  /**
   * Node environment
   */
  env: process.env.NODE_ENV || 'development',

  /**
   * Server port
   */
  port: parseInt(process.env.PORT || '3001', 10),

  /**
   * Database connection URL
   */
  databaseUrl: process.env.DATABASE_URL || '',

  /**
   * Redis connection URL
   */
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  /**
   * CORS allowed origins
   */
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  /**
   * JWT secret for authentication
   */
  jwtSecret: process.env.JWT_SECRET || '',

  /**
   * JWT refresh secret
   */
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const required = ['DATABASE_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(', ')}`
    );
    console.warn('   The application may not function correctly.');
  }

  if (config.env === 'production') {
    const productionRequired = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const productionMissing = productionRequired.filter(
      (key) => !process.env[key]
    );

    if (productionMissing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${productionMissing.join(', ')}`
      );
    }
  }
}

/**
 * Check if running in production mode
 */
export const isProduction = config.env === 'production';

/**
 * Check if running in development mode
 */
export const isDevelopment = config.env === 'development';

/**
 * Check if running in test mode
 */
export const isTest = config.env === 'test';
