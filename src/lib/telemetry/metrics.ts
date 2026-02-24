/**
 * Metrics definitions for OpenTelemetry
 * @module lib/telemetry/metrics
 */

import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('projx-ui', '1.0.0');

/**
 * CLI command metrics
 */
export const cliMetrics = {
	/** Total CLI commands executed */
	commandsTotal: meter.createCounter('cli.commands.total', {
		description: 'Total number of CLI commands executed',
		unit: '{command}'
	}),

	/** CLI command execution duration */
	commandDuration: meter.createHistogram('cli.commands.duration', {
		description: 'Duration of CLI command execution',
		unit: 'ms'
	}),

	/** CLI command errors */
	commandErrors: meter.createCounter('cli.commands.errors', {
		description: 'Total number of CLI command errors',
		unit: '{error}'
	})
};

/**
 * Circuit breaker metrics
 */
export const circuitBreakerMetrics = {
	/** Circuit breaker state (0=closed, 1=half-open, 2=open) */
	state: meter.createObservableGauge('cli.circuit_breaker.state', {
		description: 'Current circuit breaker state'
	}),

	/** Circuit breaker state transitions */
	transitions: meter.createCounter('cli.circuit_breaker.transitions', {
		description: 'Number of circuit breaker state transitions',
		unit: '{transition}'
	})
};

/**
 * WebSocket metrics
 */
export const wsMetrics = {
	/** Active WebSocket connections */
	connectionsActive: meter.createObservableGauge('ws.connections.active', {
		description: 'Number of active WebSocket connections',
		unit: '{connection}'
	}),

	/** WebSocket messages received */
	messagesReceived: meter.createCounter('ws.messages.received', {
		description: 'Total WebSocket messages received',
		unit: '{message}'
	}),

	/** WebSocket messages sent */
	messagesSent: meter.createCounter('ws.messages.sent', {
		description: 'Total WebSocket messages sent',
		unit: '{message}'
	})
};

/**
 * Database metrics
 */
export const dbMetrics = {
	/** Total database queries */
	queriesTotal: meter.createCounter('db.queries.total', {
		description: 'Total number of database queries',
		unit: '{query}'
	}),

	/** Database query duration */
	queryDuration: meter.createHistogram('db.queries.duration', {
		description: 'Duration of database queries',
		unit: 'ms'
	})
};
