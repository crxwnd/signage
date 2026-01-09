/**
 * Debug utilities
 * Only logs in development environment
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Debug log - only outputs in development
 */
export const debugLog = (prefix: string, ...args: unknown[]): void => {
    if (isDev) {
        console.log(`[${prefix}]`, ...args);
    }
};

/**
 * Debug warn - only outputs in development
 */
export const debugWarn = (prefix: string, ...args: unknown[]): void => {
    if (isDev) {
        console.warn(`[${prefix}]`, ...args);
    }
};

/**
 * Debug error - only outputs in development
 * Note: Errors should generally still be logged in production
 * but without sensitive data
 */
export const debugError = (prefix: string, ...args: unknown[]): void => {
    if (isDev) {
        console.error(`[${prefix}]`, ...args);
    }
};
