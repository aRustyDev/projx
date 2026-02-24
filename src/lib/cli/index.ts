/**
 * CLI Module
 * @module cli
 *
 * Provides CLI execution capabilities with circuit breaker protection.
 */

export {
	ProcessSupervisor,
	getProcessSupervisor,
	initProcessSupervisor,
	type ExecFunction
} from './supervisor.js';

export type {
	ProcessSupervisorConfig,
	CommandResult,
	CircuitState,
	SupervisorEvents
} from './types.js';
