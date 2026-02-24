/**
 * CLI Types for ProcessSupervisor
 * @module cli/types
 */

/** Circuit breaker states */
export type CircuitState = 'closed' | 'open' | 'half-open';

/** Configuration for the ProcessSupervisor */
export interface ProcessSupervisorConfig {
	/** Command timeout in milliseconds (default: 30000) */
	timeout: number;
	/** Maximum concurrent processes (default: 5) */
	maxConcurrent: number;
	/** Circuit breaker configuration */
	circuitBreaker: {
		/** Number of consecutive failures before opening circuit (default: 5) */
		threshold: number;
		/** Time in ms before attempting recovery (default: 60000) */
		resetTimeout: number;
	};
}

/** Result of a command execution */
export interface CommandResult {
	/** Exit code (0 = success) */
	exitCode: number;
	/** Standard output */
	stdout: string;
	/** Standard error */
	stderr: string;
	/** Execution duration in milliseconds */
	duration: number;
	/** Whether the command was killed due to timeout */
	timedOut: boolean;
}

/** Command in the execution queue */
export interface QueuedCommand {
	/** Unique command ID */
	id: string;
	/** Command to execute */
	command: string;
	/** Command arguments */
	args: string[];
	/** When the command was queued */
	queuedAt: number;
	/** Promise resolve function */
	resolve: (result: CommandResult) => void;
	/** Promise reject function */
	reject: (error: Error) => void;
}

/** Events emitted by ProcessSupervisor */
export interface SupervisorEvents {
	/** Circuit state changed */
	'circuit:change': { from: CircuitState; to: CircuitState };
	/** Command started */
	'command:start': { id: string; command: string; args: string[] };
	/** Command completed */
	'command:complete': { id: string; result: CommandResult };
	/** Command failed */
	'command:error': { id: string; error: Error };
	/** Queue updated */
	'queue:change': { size: number; active: number };
}

/** Event listener function type */
export type EventListener<T> = (data: T) => void;

/**
 * ProcessSupervisor interface for browser-safe type imports.
 * The actual implementation is in supervisor.ts (server-only).
 */
export interface ProcessSupervisor {
	/**
	 * Execute a command with circuit breaker protection.
	 * @param command - The command to execute (e.g., 'bd')
	 * @param args - Command arguments
	 * @returns Promise resolving to CommandResult
	 */
	execute(command: string, args?: string[]): Promise<CommandResult>;

	/** Get current circuit breaker state */
	getCircuitState(): CircuitState;

	/** Get queue statistics */
	getStats(): {
		active: number;
		queued: number;
		circuitState: CircuitState;
		failures: number;
	};

	/** Register an event listener */
	on<K extends keyof SupervisorEvents>(
		event: K,
		listener: EventListener<SupervisorEvents[K]>
	): void;

	/** Remove an event listener */
	off<K extends keyof SupervisorEvents>(
		event: K,
		listener: EventListener<SupervisorEvents[K]>
	): void;

	/** Manually reset the circuit breaker to closed state */
	resetCircuit(): void;

	/** Clear the command queue, rejecting all queued commands */
	clearQueue(): void;
}
