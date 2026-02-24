/**
 * ProcessSupervisor Tests
 * @module cli/supervisor.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	ProcessSupervisor,
	getProcessSupervisor,
	initProcessSupervisor,
	type ExecFunction
} from './supervisor.js';

/** Create a mock exec function for testing */
function createMockExec(): {
	exec: ExecFunction;
	calls: Array<{ command: string; args: string[] }>;
	setResponse: (
		fn: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string }>
	) => void;
} {
	const calls: Array<{ command: string; args: string[] }> = [];
	let responseHandler: (
		cmd: string,
		args: string[]
	) => Promise<{ stdout: string; stderr: string }> = async () => ({ stdout: '', stderr: '' });

	const exec: ExecFunction = async (command, args) => {
		calls.push({ command, args });
		return responseHandler(command, args);
	};

	return {
		exec,
		calls,
		setResponse: (fn) => {
			responseHandler = fn;
		}
	};
}

describe('ProcessSupervisor', () => {
	let supervisor: ProcessSupervisor;
	let mockExec: ReturnType<typeof createMockExec>;

	beforeEach(() => {
		mockExec = createMockExec();
		supervisor = new ProcessSupervisor(
			{
				timeout: 1000,
				maxConcurrent: 2,
				circuitBreaker: {
					threshold: 3,
					resetTimeout: 100
				}
			},
			mockExec.exec
		);
	});

	afterEach(() => {
		supervisor.clearQueue();
	});

	describe('constructor', () => {
		it('creates with default config', () => {
			const s = new ProcessSupervisor();
			const stats = s.getStats();
			expect(stats.circuitState).toBe('closed');
			expect(stats.active).toBe(0);
			expect(stats.queued).toBe(0);
		});

		it('creates with custom config', () => {
			const s = new ProcessSupervisor({
				timeout: 5000,
				maxConcurrent: 10
			});
			expect(s.getStats().circuitState).toBe('closed');
		});
	});

	describe('execute', () => {
		it('executes command successfully', async () => {
			mockExec.setResponse(async () => ({ stdout: 'output', stderr: '' }));

			const result = await supervisor.execute('echo', ['hello']);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('output');
			expect(result.timedOut).toBe(false);
			expect(mockExec.calls).toHaveLength(1);
			expect(mockExec.calls[0]).toEqual({ command: 'echo', args: ['hello'] });
		});

		it('handles execution errors', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('Command failed') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			await expect(supervisor.execute('nonexistent', [])).rejects.toThrow('Command failed');

			const stats = supervisor.getStats();
			expect(stats.failures).toBe(1);
		});

		it('handles timeout errors', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('Timeout') as NodeJS.ErrnoException & { killed: boolean };
				error.code = 'ETIMEDOUT';
				error.killed = true;
				throw error;
			});

			await expect(supervisor.execute('sleep', ['10'])).rejects.toThrow('Command failed');

			const stats = supervisor.getStats();
			expect(stats.failures).toBe(1);
		});
	});

	describe('circuit breaker', () => {
		it('starts in closed state', () => {
			expect(supervisor.getCircuitState()).toBe('closed');
		});

		it('opens after threshold failures', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('fail') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			// Fail 3 times (threshold)
			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('nonexistent', [])).rejects.toThrow();
			}

			expect(supervisor.getCircuitState()).toBe('open');
		});

		it('rejects immediately when circuit is open', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('fail') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('fail', [])).rejects.toThrow();
			}

			// Should reject immediately without calling exec
			const callCountBefore = mockExec.calls.length;
			await expect(supervisor.execute('test', [])).rejects.toThrow('Circuit breaker is open');
			expect(mockExec.calls.length).toBe(callCountBefore);
		});

		it('transitions to half-open after reset timeout', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('fail') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('fail', [])).rejects.toThrow();
			}
			expect(supervisor.getCircuitState()).toBe('open');

			// Wait for reset timeout
			await new Promise((resolve) => setTimeout(resolve, 150));

			// Next call should trigger half-open transition (we'll capture this via event)
			const circuitHandler = vi.fn();
			supervisor.on('circuit:change', circuitHandler);

			// This will fail but should transition to half-open first
			await expect(supervisor.execute('test', [])).rejects.toThrow();

			// Should have transitioned to half-open
			expect(circuitHandler).toHaveBeenCalledWith({ from: 'open', to: 'half-open' });
		});

		it('closes circuit on successful half-open request', async () => {
			let shouldFail = true;

			mockExec.setResponse(async () => {
				if (shouldFail) {
					const error = new Error('fail') as NodeJS.ErrnoException;
					error.code = 'ENOENT';
					throw error;
				}
				return { stdout: 'success', stderr: '' };
			});

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('fail', [])).rejects.toThrow();
			}

			// Wait for reset timeout
			await new Promise((resolve) => setTimeout(resolve, 150));

			// Make next request succeed
			shouldFail = false;

			const result = await supervisor.execute('test', []);
			expect(result.exitCode).toBe(0);
			expect(supervisor.getCircuitState()).toBe('closed');
		});

		it('can be manually reset', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('fail') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('fail', [])).rejects.toThrow();
			}

			supervisor.resetCircuit();
			expect(supervisor.getCircuitState()).toBe('closed');
		});
	});

	describe('concurrency limiting', () => {
		it('queues commands when at capacity', async () => {
			const resolvers: Array<() => void> = [];
			let callCount = 0;

			mockExec.setResponse(() => {
				callCount++;
				const currentCall = callCount;

				if (currentCall <= 2) {
					return new Promise((resolve) => {
						resolvers.push(() =>
							resolve({ stdout: currentCall === 1 ? 'first' : 'second', stderr: '' })
						);
					});
				}
				return Promise.resolve({ stdout: 'third', stderr: '' });
			});

			// Start 2 commands (at capacity)
			const p1 = supervisor.execute('cmd1', []);
			const p2 = supervisor.execute('cmd2', []);

			// Third should be queued
			const p3 = supervisor.execute('cmd3', []);

			// Give time for queue update
			await new Promise((resolve) => setTimeout(resolve, 10));

			const stats = supervisor.getStats();
			expect(stats.active).toBe(2);
			expect(stats.queued).toBe(1);

			// Complete first two
			resolvers.forEach((r) => r());

			const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
			expect(r1.stdout).toBe('first');
			expect(r2.stdout).toBe('second');
			expect(r3.stdout).toBe('third');
		});
	});

	describe('event emitter', () => {
		it('emits command:start event', async () => {
			mockExec.setResponse(async () => ({ stdout: 'output', stderr: '' }));

			const startHandler = vi.fn();
			supervisor.on('command:start', startHandler);

			await supervisor.execute('test', ['arg']);

			expect(startHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					command: 'test',
					args: ['arg']
				})
			);
		});

		it('emits command:complete event', async () => {
			mockExec.setResponse(async () => ({ stdout: 'output', stderr: '' }));

			const completeHandler = vi.fn();
			supervisor.on('command:complete', completeHandler);

			await supervisor.execute('test', []);

			expect(completeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					result: expect.objectContaining({
						exitCode: 0,
						stdout: 'output'
					})
				})
			);
		});

		it('emits circuit:change event', async () => {
			mockExec.setResponse(async () => {
				const error = new Error('fail') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			});

			const circuitHandler = vi.fn();
			supervisor.on('circuit:change', circuitHandler);

			for (let i = 0; i < 3; i++) {
				await expect(supervisor.execute('fail', [])).rejects.toThrow();
			}

			expect(circuitHandler).toHaveBeenCalledWith({
				from: 'closed',
				to: 'open'
			});
		});

		it('can remove event listeners', async () => {
			mockExec.setResponse(async () => ({ stdout: 'output', stderr: '' }));

			const handler = vi.fn();
			supervisor.on('command:start', handler);
			supervisor.off('command:start', handler);

			await supervisor.execute('test', []);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('singleton helpers', () => {
		it('getProcessSupervisor returns consistent instance', () => {
			const s1 = getProcessSupervisor();
			const s2 = getProcessSupervisor();
			expect(s1).toBe(s2);
		});

		it('initProcessSupervisor creates new instance with config', () => {
			const s = initProcessSupervisor({ timeout: 5000 });
			expect(s).toBeInstanceOf(ProcessSupervisor);
			expect(getProcessSupervisor()).toBe(s);
		});
	});

	describe('clearQueue', () => {
		it('rejects all queued commands', async () => {
			const resolvers: Array<() => void> = [];

			mockExec.setResponse(() => {
				return new Promise((resolve) => {
					resolvers.push(() => resolve({ stdout: 'done', stderr: '' }));
				});
			});

			// Fill capacity
			const p1 = supervisor.execute('cmd1', []);
			const p2 = supervisor.execute('cmd2', []);

			// Queue more
			const p3 = supervisor.execute('cmd3', []);
			const p4 = supervisor.execute('cmd4', []);

			// Give time for queue
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Clear the queue
			supervisor.clearQueue();

			// Queued commands should reject
			await expect(p3).rejects.toThrow('Queue cleared');
			await expect(p4).rejects.toThrow('Queue cleared');

			// Unblock running commands
			resolvers.forEach((r) => r());
			await p1;
			await p2;
		});
	});
});
