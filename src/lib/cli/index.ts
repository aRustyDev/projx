/**
 * CLI Module - Browser-safe exports
 * @module cli
 *
 * Types and interfaces for CLI execution.
 * The actual implementation is in $lib/server/cli/supervisor.ts (server-only).
 *
 * For server-side code that needs the ProcessSupervisor implementation:
 * import { getProcessSupervisor } from '$lib/server/cli/supervisor.js';
 */

export type {
	ProcessSupervisor,
	ProcessSupervisorConfig,
	CommandResult,
	CircuitState,
	SupervisorEvents,
	EventListener
} from './types.js';
