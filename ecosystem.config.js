/**
 * PM2 Ecosystem Configuration
 * For production deployment
 */

module.exports = {
    apps: [
        {
            name: 'signage-backend',
            cwd: './apps/backend',
            script: 'dist/server.js',
            instances: 'max',
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            env_production: {
                NODE_ENV: 'production',
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
        },
        {
            name: 'signage-frontend',
            cwd: './apps/frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            instances: 2,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'signage-player',
            cwd: './apps/player',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 3002',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '256M',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
            },
            error_file: './logs/player-error.log',
            out_file: './logs/player-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
