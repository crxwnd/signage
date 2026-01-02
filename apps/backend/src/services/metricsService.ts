/**
 * Metrics Service
 * Exposes Prometheus metrics for monitoring
 */

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

// ==============================================
// REGISTRY
// ==============================================

export const metricsRegistry = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register: metricsRegistry });

// ==============================================
// CUSTOM METRICS
// ==============================================

// HTTP Requests
export const httpRequestsTotal = new Counter({
    name: 'signage_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
    name: 'signage_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [metricsRegistry],
});

// WebSocket Connections
export const websocketConnections = new Gauge({
    name: 'signage_websocket_connections',
    help: 'Current number of WebSocket connections',
    labelNames: ['type'],
    registers: [metricsRegistry],
});

// Display Status
export const displaysOnline = new Gauge({
    name: 'signage_displays_online',
    help: 'Number of online displays',
    registers: [metricsRegistry],
});

export const displaysOffline = new Gauge({
    name: 'signage_displays_offline',
    help: 'Number of offline displays',
    registers: [metricsRegistry],
});

export const displaysError = new Gauge({
    name: 'signage_displays_error',
    help: 'Number of displays in error state',
    registers: [metricsRegistry],
});

// Content Processing
export const transcodingJobsTotal = new Counter({
    name: 'signage_transcoding_jobs_total',
    help: 'Total number of transcoding jobs',
    labelNames: ['status'],
    registers: [metricsRegistry],
});

export const transcodingJobsActive = new Gauge({
    name: 'signage_transcoding_jobs_active',
    help: 'Number of active transcoding jobs',
    registers: [metricsRegistry],
});

export const transcodingDuration = new Histogram({
    name: 'signage_transcoding_duration_seconds',
    help: 'Transcoding job duration in seconds',
    buckets: [10, 30, 60, 120, 300, 600, 1200],
    registers: [metricsRegistry],
});

// Alerts
export const activeAlerts = new Gauge({
    name: 'signage_active_alerts',
    help: 'Number of currently active alerts',
    labelNames: ['type'],
    registers: [metricsRegistry],
});

// Sync Groups
export const activeSyncGroups = new Gauge({
    name: 'signage_active_sync_groups',
    help: 'Number of actively playing sync groups',
    registers: [metricsRegistry],
});

// Database
export const databaseQueryDuration = new Histogram({
    name: 'signage_database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [metricsRegistry],
});

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(method: string, path: string, status: number, duration: number): void {
    httpRequestsTotal.inc({ method, path, status: status.toString() });
    httpRequestDuration.observe({ method, path }, duration);
}

/**
 * Update display counts from database
 */
export function updateDisplayMetrics(online: number, offline: number, error: number): void {
    displaysOnline.set(online);
    displaysOffline.set(offline);
    displaysError.set(error);
}

/**
 * Record transcoding job completion
 */
export function recordTranscodingJob(status: 'completed' | 'failed', durationSeconds?: number): void {
    transcodingJobsTotal.inc({ status });
    if (status === 'completed' && durationSeconds) {
        transcodingDuration.observe(durationSeconds);
    }
}

// ==============================================
// METRICS ENDPOINT HANDLER
// ==============================================

export async function getMetrics(): Promise<string> {
    return metricsRegistry.metrics();
}

export async function getMetricsContentType(): Promise<string> {
    return metricsRegistry.contentType;
}
