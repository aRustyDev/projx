/**
 * FileWatcher Tests (TDD)
 * @module lib/realtime/FileWatcher.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileWatcher } from './FileWatcher.js';
import type { FSWatcher } from 'chokidar';

// Mock chokidar
vi.mock('chokidar', () => ({
	watch: vi.fn(() => ({
		on: vi.fn().mockReturnThis(),
		close: vi.fn().mockResolvedValue(undefined)
	}))
}));

import * as chokidar from 'chokidar';

describe('FileWatcher', () => {
	let watcher: FileWatcher;
	let mockChokidarWatcher: {
		on: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.useFakeTimers();
		mockChokidarWatcher = {
			on: vi.fn().mockReturnThis(),
			close: vi.fn().mockResolvedValue(undefined)
		};
		vi.mocked(chokidar.watch).mockReturnValue(mockChokidarWatcher as unknown as FSWatcher);
	});

	afterEach(async () => {
		vi.useRealTimers();
		if (watcher) {
			await watcher.stop();
		}
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('watches .beads/*.db files', () => {
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.start();

			expect(chokidar.watch).toHaveBeenCalledWith(
				expect.arrayContaining([expect.stringContaining('.beads')]),
				expect.any(Object)
			);
		});

		it('watches .beads/*.jsonl files', () => {
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.start();

			const watchCall = vi.mocked(chokidar.watch).mock.calls[0];
			expect(watchCall).toBeDefined();
			const patterns = watchCall![0] as string[];
			expect(patterns.some((p) => p.includes('*.db') || p.includes('*.jsonl'))).toBe(true);
		});

		it('uses provided watchPath', () => {
			watcher = new FileWatcher({ watchPath: '/custom/path' });
			watcher.start();

			expect(chokidar.watch).toHaveBeenCalledWith(
				expect.arrayContaining([expect.stringContaining('/custom/path')]),
				expect.any(Object)
			);
		});
	});

	describe('change events', () => {
		it('emits change event when file modified', async () => {
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('change', onChange);
			watcher.start();

			// Get the 'change' handler that was registered
			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			expect(changeHandler).toBeDefined();

			// Simulate file change
			changeHandler('.beads/issues.db');

			// Advance past debounce
			vi.advanceTimersByTime(150);

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '.beads/issues.db',
					type: 'change'
				})
			);
		});

		it('debounces rapid changes (100ms)', async () => {
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads', debounceMs: 100 });
			watcher.on('change', onChange);
			watcher.start();

			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			// Rapid changes
			changeHandler('.beads/issues.db');
			vi.advanceTimersByTime(50);
			changeHandler('.beads/issues.db');
			vi.advanceTimersByTime(50);
			changeHandler('.beads/issues.db');

			// Should not have emitted yet
			expect(onChange).not.toHaveBeenCalled();

			// Advance past debounce
			vi.advanceTimersByTime(100);

			// Should emit only once
			expect(onChange).toHaveBeenCalledTimes(1);
		});

		it('ignores non-database files', async () => {
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('change', onChange);
			watcher.start();

			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			// Change to non-database file
			changeHandler('.beads/config.txt');

			vi.advanceTimersByTime(150);

			expect(onChange).not.toHaveBeenCalled();
		});

		it('emits for .db files', async () => {
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('change', onChange);
			watcher.start();

			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			changeHandler('.beads/test.db');
			vi.advanceTimersByTime(150);

			expect(onChange).toHaveBeenCalled();
		});

		it('emits for .jsonl files', async () => {
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('change', onChange);
			watcher.start();

			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			changeHandler('.beads/issues.jsonl');
			vi.advanceTimersByTime(150);

			expect(onChange).toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('handles watcher errors gracefully', () => {
			const onError = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('error', onError);
			watcher.start();

			const errorHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'error'
			)?.[1] as (error: Error) => void;

			expect(errorHandler).toBeDefined();

			// Simulate error
			errorHandler(new Error('Watch error'));

			expect(onError).toHaveBeenCalledWith(expect.any(Error));
		});

		it('continues watching after error', () => {
			const onError = vi.fn();
			const onChange = vi.fn();
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.on('error', onError);
			watcher.on('change', onChange);
			watcher.start();

			const errorHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'error'
			)?.[1] as (error: Error) => void;
			const changeHandler = mockChokidarWatcher.on.mock.calls.find(
				(call: unknown[]) => call[0] === 'change'
			)?.[1] as (path: string) => void;

			// Error occurs
			errorHandler(new Error('Watch error'));

			// But changes still work
			changeHandler('.beads/issues.db');
			vi.advanceTimersByTime(150);

			expect(onChange).toHaveBeenCalled();
		});
	});

	describe('lifecycle', () => {
		it('stops watching when stop() called', async () => {
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.start();

			await watcher.stop();

			expect(mockChokidarWatcher.close).toHaveBeenCalled();
		});

		it('can be restarted', async () => {
			watcher = new FileWatcher({ watchPath: '.beads' });
			watcher.start();
			await watcher.stop();
			watcher.start();

			expect(chokidar.watch).toHaveBeenCalledTimes(2);
		});
	});
});
