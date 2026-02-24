/**
 * Tracer configuration and factory
 * @module lib/telemetry/tracer
 */

import { trace, type Tracer } from '@opentelemetry/api';
import type { Tracers } from './types.js';

const SERVICE_NAME = 'projx-ui';

/**
 * Get a tracer for a specific module
 */
export function getTracer(name: string, version?: string): Tracer {
	return trace.getTracer(`${SERVICE_NAME}.${name}`, version ?? '1.0.0');
}

/**
 * Pre-configured tracers for common modules
 */
export const tracers: Tracers = {
	cli: getTracer('cli'),
	ws: getTracer('websocket'),
	db: getTracer('database'),
	http: getTracer('http')
};

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
	return process.env.OTEL_SDK_DISABLED !== 'true';
}
