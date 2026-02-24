/**
 * Structured logger with OpenTelemetry trace context
 * @module lib/telemetry/logger
 */

import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

/**
 * Get trace context for log correlation
 */
function getTraceContext(): Record<string, string | number> | Record<string, never> {
	const span = trace.getSpan(context.active());
	if (span) {
		const spanContext = span.spanContext();
		return {
			trace_id: spanContext.traceId,
			span_id: spanContext.spanId,
			trace_flags: spanContext.traceFlags
		};
	}
	return {};
}

/**
 * Root logger with trace context mixin
 */
export const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	mixin: getTraceContext,
	transport:
		process.env.NODE_ENV === 'development'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true
					}
				}
			: undefined
});

/**
 * Create a child logger for a specific module
 */
export function getLogger(module: string): pino.Logger {
	return logger.child({ module });
}
