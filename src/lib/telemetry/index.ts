/**
 * Telemetry module - OpenTelemetry-based observability
 * @module lib/telemetry
 *
 * Provides tracing, metrics, and structured logging for the application.
 *
 * @example
 * ```typescript
 * import { tracers, getLogger, cliMetrics } from '$lib/telemetry';
 * import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
 *
 * const log = getLogger('my-module');
 *
 * async function executeCommand(cmd: string, args: string[]) {
 *   return tracers.cli.startActiveSpan(
 *     'cli.execute',
 *     { kind: SpanKind.INTERNAL },
 *     async (span) => {
 *       span.setAttribute('process.command', cmd);
 *       try {
 *         const result = await exec(cmd, args);
 *         span.setStatus({ code: SpanStatusCode.OK });
 *         cliMetrics.commandsTotal.add(1, { command: cmd });
 *         return result;
 *       } catch (error) {
 *         span.recordException(error);
 *         log.error({ error }, 'Command failed');
 *         throw error;
 *       } finally {
 *         span.end();
 *       }
 *     }
 *   );
 * }
 * ```
 *
 * @see ADR-0011 for decision rationale
 * @see ../../../.claude/plans/unified-beads-webui/spec/observability.md for full spec
 */

// Re-export OpenTelemetry API types for convenience
export { SpanKind, SpanStatusCode, context, propagation, trace, metrics } from '@opentelemetry/api';

// Tracer utilities
export { getTracer, tracers, isTelemetryEnabled } from './tracer.js';

// Logger utilities
export { logger, getLogger } from './logger.js';

// Metrics
export { cliMetrics, circuitBreakerMetrics, wsMetrics, dbMetrics } from './metrics.js';

// Types
export type {
	TelemetryConfig,
	Tracers,
	CLISpanAttributes,
	WSSpanAttributes,
	DBSpanAttributes
} from './types.js';
