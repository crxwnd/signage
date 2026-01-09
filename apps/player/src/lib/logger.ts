/**
 * Player Logger
 * Only logs in development mode to avoid production warnings
 */

const isDev = process.env.NODE_ENV === 'development';

export const playerLog = {
    log: (...args: unknown[]): void => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]): void => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]): void => {
        // Always log errors
        console.error(...args);
    },
    debug: (...args: unknown[]): void => {
        if (isDev) {
            console.log(...args);
        }
    },
};
