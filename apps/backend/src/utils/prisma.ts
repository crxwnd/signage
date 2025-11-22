/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient exists
 */

import { PrismaClient } from '@prisma/client';
import { log } from '../middleware/logger';

/**
 * PrismaClient extended with logging
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

/**
 * Global Prisma client instance
 */
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    log.info('✓ Database connected successfully');
    return true;
  } catch (error) {
    log.error('✗ Database connection failed', error);
    return false;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  log.info('Database disconnected');
}
