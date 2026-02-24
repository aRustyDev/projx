/**
 * ProcessSupervisor - Centralized CLI execution with circuit breaker protection
 * @module cli/supervisor
 *
 * Manages CLI command execution with:
 * - Timeout handling
 * - Concurrent process limiting
 * - Circuit breaker pattern for fault tolerance
 * - Event-driven status updates
 */

import { execFile as nodeExecFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
	ProcessSupervisorConfig,
	CommandResult,
	QueuedCommand,
	CircuitState,
	SupervisorEvents,
	EventListener
} from './types.js';

/** Type for the exec function used by ProcessSupervisor */
export type ExecFunction = (
	command: string,
	args: string[],
	options: { timeout: number; maxBuffer: number; windowsHide: boolean }
) => Promise<{ stdout: string; stderr: string }>;

const defaultExecFile: ExecFunction = promisify(nodeExecFile) as ExecFunction;

/** Default configuration values */
const DEFAULT_CONFIG: ProcessSupervisorConfig = {
	timeout: 30000,
	maxConcurrent: 5,
	circuitBreaker: {
		threshold: 5,
		resetTimeout: 60000
	}
};

/**
 * ProcessSupervisor manages CLI command execution with circuit breaker protection.
 *
 * @example
 * ```typescript
 * const supervisor = new ProcessSupervisor({ timeout: 10000 });
 * const result = await supervisor.execute('bd', ['list', '--json']);
 * console.log(result.stdout);
 * ```
 */
export class ProcessSupervisor {
	private config: ProcessSupervisorConfig;
	private circuitState: CircuitState = 'closed';
	private consecutiveFailures = 0;
	private lastFailureTime = 0;
	private activeCount = 0;
	private queue: QueuedCommand[] = [];
	private commandCounter = 0;
	private listeners: Map<keyof SupervisorEvents, Set<EventListener<unknown>>> = new Map();
	private execFn: ExecFunction;

	constructor(config: Partial<ProcessSupervisorConfig> = {}, execFn?: ExecFunction) {
		this.config = {
			timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
			maxConcurrent: config.maxConcurrent ?? DEFAULT_CONFIG.maxConcurrent,
			circuitBreaker: {
				threshold: config.circuitBreaker?.threshold ?? DEFAULT_CONFIG.circuitBreaker.threshold,
				resetTimeout:
					config.circuitBreaker?.resetTimeout ?? DEFAULT_CONFIG.circuitBreaker.resetTimeout
			}
		};
		this.execFn = execFn ?? defaultExecFile;
	}

	/**
	 * Execute a command with circuit breaker protection.
	 *
	 * @param command - The command to execute (e.g., 'bd')
	 * @param args - Command arguments
	 * @returns Promise resolving to CommandResult
	 * @throws Error if circuit is open or command fails
	 */
	async execute(command: string, args: string[] = []): Promise<CommandResult> {
		// Check circuit state
		if (this.circuitState === 'open') {
			const timeSinceFailure = Date.now() - this.lastFailureTime;
			if (timeSinceFailure >= this.config.circuitBreaker.resetTimeout) {
				this.transitionTo('half-open');
			} else {
				throw new Error(
					`Circuit breaker is open. Retry after ${Math.ceil((this.config.circuitBreaker.resetTimeout - timeSinceFailure) / 1000)}s`
				);
			}
		}

		// Queue if at capacity
		if (this.activeCount >= this.config.maxConcurrent) {
			return this.enqueue(command, args);
		}

		return this.executeImmediate(command, args);
	}

	/**
	 * Get current circuit breaker state.
	 */
	getCircuitState(): CircuitState {
		return this.circuitState;
	}

	/**
	 * Get queue statistics.
	 */
	getStats(): { active: number; queued: number; circuitState: CircuitState; failures: number } {
		return {
			active: this.activeCount,
			queued: this.queue.length,
			circuitState: this.circuitState,
			failures: this.consecutiveFailures
		};
	}

	/**
	 * Register an event listener.
	 */
	on<K extends keyof SupervisorEvents>(
		event: K,
		listener: EventListener<SupervisorEvents[K]>
	): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener as EventListener<unknown>);
	}

	/**
	 * Remove an event listener.
	 */
	off<K extends keyof SupervisorEvents>(
		event: K,
		listener: EventListener<SupervisorEvents[K]>
	): void {
		this.listeners.get(event)?.delete(listener as EventListener<unknown>);
	}

	/**
	 * Manually reset the circuit breaker to closed state.
	 * Use with caution - typically for testing or admin override.
	 */
	resetCircuit(): void {
		this.consecutiveFailures = 0;
		this.transitionTo('closed');
	}

	/**
	 * Clear the command queue.
	 * Rejects all queued commands with an error.
	 */
	clearQueue(): void {
		const error = new Error('Queue cleared');
		for (const cmd of this.queue) {
			cmd.reject(error);
		}
		this.queue = [];
		this.emit('queue:change', { size: 0, active: this.activeCount });
	}

	private async executeImmediate(command: string, args: string[]): Promise<CommandResult> {
		const id = `cmd-${++this.commandCounter}`;
		const startTime = Date.now();

		this.activeCount++;
		this.emit('command:start', { id, command, args });
		this.emit('queue:change', { size: this.queue.length, active: this.activeCount });

		try {
			const { stdout, stderr } = await this.execFn(command, args, {
				timeout: this.config.timeout,
				maxBuffer: 10 * 1024 * 1024, // 10MB
				windowsHide: true
			});

			const result: CommandResult = {
				exitCode: 0,
				stdout,
				stderr,
				duration: Date.now() - startTime,
				timedOut: false
			};

			this.onSuccess();
			this.emit('command:complete', { id, result });

			return result;
		} catch (error) {
			const execError = error as NodeJS.ErrnoException & {
				stdout?: string;
				stderr?: string;
				killed?: boolean;
				code?: number | string;
			};

			// Non-zero exit code is still a "successful" execution (CLI returned)
			if (typeof execError.code === 'number' && execError.code !== 0) {
				const result: CommandResult = {
					exitCode: execError.code,
					stdout: execError.stdout ?? '',
					stderr: execError.stderr ?? '',
					duration: Date.now() - startTime,
					timedOut: false
				};

				// Non-zero exit doesn't trip the circuit breaker
				this.emit('command:complete', { id, result });
				return result;
			}

			// Actual execution failure (timeout, command not found, etc.)
			this.onFailure();
			this.emit('command:error', { id, error: execError });

			throw new Error(`Command failed: ${execError.message}`, { cause: error });
		} finally {
			this.activeCount--;
			this.emit('queue:change', { size: this.queue.length, active: this.activeCount });
			this.processQueue();
		}
	}

	private enqueue(command: string, args: string[]): Promise<CommandResult> {
		return new Promise((resolve, reject) => {
			const id = `cmd-${++this.commandCounter}`;
			this.queue.push({
				id,
				command,
				args,
				queuedAt: Date.now(),
				resolve,
				reject
			});
			this.emit('queue:change', { size: this.queue.length, active: this.activeCount });
		});
	}

	private processQueue(): void {
		while (this.queue.length > 0 && this.activeCount < this.config.maxConcurrent) {
			const next = this.queue.shift();
			if (next) {
				this.executeImmediate(next.command, next.args).then(next.resolve).catch(next.reject);
			}
		}
	}

	private onSuccess(): void {
		if (this.circuitState === 'half-open') {
			// Successful test request - close the circuit
			this.consecutiveFailures = 0;
			this.transitionTo('closed');
		} else {
			this.consecutiveFailures = 0;
		}
	}

	private onFailure(): void {
		this.consecutiveFailures++;
		this.lastFailureTime = Date.now();

		if (this.circuitState === 'half-open') {
			// Test request failed - reopen circuit
			this.transitionTo('open');
		} else if (this.consecutiveFailures >= this.config.circuitBreaker.threshold) {
			this.transitionTo('open');
		}
	}

	private transitionTo(newState: CircuitState): void {
		if (this.circuitState !== newState) {
			const from = this.circuitState;
			this.circuitState = newState;
			this.emit('circuit:change', { from, to: newState });
		}
	}

	private emit<K extends keyof SupervisorEvents>(event: K, data: SupervisorEvents[K]): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			for (const listener of listeners) {
				try {
					listener(data);
				} catch {
					// Ignore listener errors
				}
			}
		}
	}
}

/** Singleton instance for application-wide use */
let defaultSupervisor: ProcessSupervisor | null = null;

/**
 * Get the default ProcessSupervisor instance.
 * Creates one with default config if not already initialized.
 */
export function getProcessSupervisor(): ProcessSupervisor {
	if (!defaultSupervisor) {
		defaultSupervisor = new ProcessSupervisor();
	}
	return defaultSupervisor;
}

/**
 * Initialize the default ProcessSupervisor with custom config.
 * Should be called early in application startup.
 */
export function initProcessSupervisor(config: Partial<ProcessSupervisorConfig>): ProcessSupervisor {
	defaultSupervisor = new ProcessSupervisor(config);
	return defaultSupervisor;
}
