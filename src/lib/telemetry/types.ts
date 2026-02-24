/**
 * Telemetry type definitions
 * @module lib/telemetry/types
 */

import type { Tracer } from '@opentelemetry/api';

/**
 * Telemetry configuration options
 */
export interface TelemetryConfig {
	/** Service name for resource attribution */
	serviceName: string;
	/** Service version */
	serviceVersion: string;
	/** OTLP endpoint URL (e.g., http://localhost:4318) */
	otlpEndpoint?: string;
	/** Whether telemetry is enabled */
	enabled: boolean;
	/** Log level for Pino logger */
	logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
	/** Environment (development, production, test) */
	environment: string;
}

/**
 * Available tracers for different modules
 */
export interface Tracers {
	cli: Tracer;
	ws: Tracer;
	db: Tracer;
	http: Tracer;
}

/**
 * Span attributes for CLI operations
 */
export interface CLISpanAttributes {
	'process.command': string;
	'process.command_args'?: string;
	'process.command_line'?: string;
	'process.exit.code'?: number;
	'process.runtime.name'?: string;
	'process.runtime.version'?: string;
}

/**
 * Span attributes for WebSocket operations
 */
export interface WSSpanAttributes {
	'ws.event_type': string;
	'ws.client_count'?: number;
	'ws.message_size'?: number;
}

/**
 * Span attributes for database operations
 */
export interface DBSpanAttributes {
	'db.system': 'sqlite' | 'dolt';
	'db.statement'?: string;
	'db.operation'?: string;
	'db.rows_affected'?: number;
}
