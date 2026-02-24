/**
 * FileWatcher - Watches beads database files for changes
 * @module lib/realtime/FileWatcher
 */

import { watch, type FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { join } from 'path';

export interface FileWatcherOptions {
	watchPath: string;
	debounceMs?: number;
}

export interface FileChangeEvent {
	path: string;
	type: 'change' | 'add' | 'unlink';
}

export class FileWatcher extends EventEmitter {
	private options: Required<FileWatcherOptions>;
	private watcher: FSWatcher | null = null;
	private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

	constructor(options: FileWatcherOptions) {
		super();
		this.options = {
			watchPath: options.watchPath,
			debounceMs: options.debounceMs ?? 100
		};
	}

	/**
	 * Start watching for file changes
	 */
	start(): void {
		const patterns = [
			join(this.options.watchPath, '*.db'),
			join(this.options.watchPath, '*.jsonl')
		];

		this.watcher = watch(patterns, {
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 50,
				pollInterval: 10
			}
		});

		this.watcher.on('change', (path) => this.handleChange(path, 'change'));
		this.watcher.on('add', (path) => this.handleChange(path, 'add'));
		this.watcher.on('unlink', (path) => this.handleChange(path, 'unlink'));
		this.watcher.on('error', (error) => this.emit('error', error));
	}

	/**
	 * Stop watching for file changes
	 */
	async stop(): Promise<void> {
		// Clear all debounce timers
		for (const timer of this.debounceTimers.values()) {
			clearTimeout(timer);
		}
		this.debounceTimers.clear();

		if (this.watcher) {
			await this.watcher.close();
			this.watcher = null;
		}
	}

	/**
	 * Handle a file change with debouncing
	 */
	private handleChange(path: string, type: 'change' | 'add' | 'unlink'): void {
		// Only emit for supported file types
		if (!this.isValidFile(path)) {
			return;
		}

		// Clear existing timer for this path
		const existingTimer = this.debounceTimers.get(path);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set new debounce timer
		const timer = setTimeout(() => {
			this.debounceTimers.delete(path);
			this.emit('change', { path, type } as FileChangeEvent);
		}, this.options.debounceMs);

		this.debounceTimers.set(path, timer);
	}

	/**
	 * Check if file is a valid database file
	 */
	private isValidFile(path: string): boolean {
		return path.endsWith('.db') || path.endsWith('.jsonl');
	}
}
