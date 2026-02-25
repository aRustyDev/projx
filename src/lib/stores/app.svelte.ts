/**
 * App Store - Application-level shared state
 * @module stores/app.svelte
 *
 * Provides global state that needs to be shared across layout and pages,
 * such as modal states and issue creation that happens from the nav bar.
 */

import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';
import { createRealtimeClient, type RealtimeClient } from '$lib/realtime/useRealtime.js';
import { toastStore } from './toast.svelte.js';
import type { Issue, IssueFilter } from '$lib/db/types.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/types.js';

export interface CreateIssueInput {
	title: string;
	issue_type: string;
	description?: string;
	priority?: number;
	assignee?: string;
}

export interface AppStoreConfig {
	dal?: DataAccessLayer;
	supervisor?: ProcessSupervisor;
}

/**
 * Application-level store for shared state
 */
class AppStore {
	#dal: DataAccessLayer | null = null;
	#supervisor: ProcessSupervisor | null = null;
	#realtimeClient: RealtimeClient | null = null;
	#pollingInterval: ReturnType<typeof setInterval> | null = null;
	#initialized = false;
	#watching = false;

	// Modal states
	#createModalOpen = $state(false);
	#issueDetailModalOpen = $state(false);
	#selectedIssueForDetail = $state<Issue | null>(null);

	// Issues state (shared across pages)
	#issues = $state<Issue[]>([]);
	#filter = $state<IssueFilter>({});
	#loading = $state(false);

	// Event listeners for store changes
	#listeners: SvelteSet<() => void> = new SvelteSet();

	get createModalOpen(): boolean {
		return this.#createModalOpen;
	}

	get issueDetailModalOpen(): boolean {
		return this.#issueDetailModalOpen;
	}

	get selectedIssueForDetail(): Issue | null {
		return this.#selectedIssueForDetail;
	}

	get issues(): Issue[] {
		return this.#issues;
	}

	get filter(): IssueFilter {
		return this.#filter;
	}

	get loading(): boolean {
		return this.#loading;
	}

	// Derived: filtered issues
	get filtered(): Issue[] {
		return this.#issues.filter((issue) => {
			if (this.#filter.status) {
				const statuses = Array.isArray(this.#filter.status)
					? this.#filter.status
					: [this.#filter.status];
				if (!statuses.includes(issue.status)) return false;
			}

			if (this.#filter.issueType) {
				const types = Array.isArray(this.#filter.issueType)
					? this.#filter.issueType
					: [this.#filter.issueType];
				if (!types.includes(issue.issue_type)) return false;
			}

			if (this.#filter.priority !== undefined) {
				const priorities = Array.isArray(this.#filter.priority)
					? this.#filter.priority
					: [this.#filter.priority];
				if (!priorities.includes(issue.priority)) return false;
			}

			if (this.#filter.assignee) {
				const assignees = Array.isArray(this.#filter.assignee)
					? this.#filter.assignee
					: [this.#filter.assignee];
				if (!assignees.includes(issue.assignee || '')) return false;
			}

			if (this.#filter.search) {
				const searchLower = this.#filter.search.toLowerCase();
				const matchesId = issue.id.toLowerCase().includes(searchLower);
				const matchesTitle = issue.title.toLowerCase().includes(searchLower);
				const matchesDescription = issue.description?.toLowerCase().includes(searchLower);
				if (!matchesId && !matchesTitle && !matchesDescription) return false;
			}

			return true;
		});
	}

	/**
	 * Initialize the store with dependencies
	 */
	async init(config: AppStoreConfig = {}): Promise<void> {
		if (this.#initialized) return;

		// Only create real instances if explicitly provided or in browser and not testing
		const isTest = typeof process !== 'undefined' && process.env?.VITEST;
		const shouldCreateInstances = browser && !isTest;

		if (config.dal) {
			this.#dal = config.dal;
		} else if (shouldCreateInstances) {
			try {
				// Use non-static import path to bypass SvelteKit guard
				// These modules are only loaded during SSR, never in browser
				const dalPath = '$lib/server/db/dal.js';
				const mod = await import(/* @vite-ignore */ dalPath);
				this.#dal = await mod.DataAccessLayer.create();
			} catch {
				// DAL creation failed, will use null
				this.#dal = null;
			}
		}

		if (config.supervisor) {
			this.#supervisor = config.supervisor;
		} else if (shouldCreateInstances) {
			try {
				// Use non-static import path to bypass SvelteKit guard
				const supervisorPath = '$lib/server/cli/supervisor.js';
				const mod = await import(/* @vite-ignore */ supervisorPath);
				this.#supervisor = mod.getProcessSupervisor();
			} catch {
				this.#supervisor = null;
			}
		}

		this.#initialized = true;
	}

	/**
	 * Reset for testing
	 */
	reset(config: AppStoreConfig = {}): void {
		this.stopWatching();
		this.#dal = config.dal ?? null;
		this.#supervisor = config.supervisor ?? null;
		this.#initialized = !!config.dal || !!config.supervisor;
		this.#issues = [];
		this.#filter = {};
		this.#loading = false;
		this.#createModalOpen = false;
		this.#issueDetailModalOpen = false;
		this.#selectedIssueForDetail = null;
	}

	// Modal controls
	openCreateModal(): void {
		this.#createModalOpen = true;
	}

	closeCreateModal(): void {
		this.#createModalOpen = false;
	}

	openDetailModal(issue: Issue): void {
		this.#selectedIssueForDetail = issue;
		this.#issueDetailModalOpen = true;
	}

	closeDetailModal(): void {
		this.#issueDetailModalOpen = false;
		this.#selectedIssueForDetail = null;
	}

	// Issue operations
	setFilter(filter: IssueFilter): void {
		this.#filter = filter;
	}

	/**
	 * Set issues directly (used when server-loaded data is available)
	 */
	setIssues(issues: Issue[]): void {
		this.#issues = issues;
		this.#notifyListeners();
	}

	/**
	 * Load issues from database
	 */
	async load(): Promise<void> {
		if (!this.#dal) {
			await this.init();
		}
		if (!this.#dal) return;

		this.#loading = true;
		try {
			const issues = await this.#dal.getIssues();
			this.#issues = issues;
			this.#notifyListeners();
		} finally {
			this.#loading = false;
		}
	}

	/**
	 * Create a new issue via bd CLI
	 */
	async create(input: CreateIssueInput): Promise<Issue | null> {
		if (!this.#supervisor || !this.#dal) {
			await this.init();
		}
		if (!this.#supervisor || !this.#dal) {
			toastStore.error('Store not initialized');
			return null;
		}

		const args = ['create', '--title', input.title, '--type', input.issue_type];

		if (input.priority !== undefined) {
			args.push('--priority', String(input.priority));
		}

		if (input.assignee) {
			args.push('--assignee', input.assignee);
		}

		if (input.description) {
			args.push('--description', input.description);
		}

		try {
			const result = await this.#supervisor.execute('bd', args);

			if (result.exitCode !== 0) {
				throw new Error(result.stderr || 'Failed to create issue');
			}

			// Parse issue ID from CLI output (format: "✓ Created issue: <id>")
			const match = result.stdout.match(/Created issue:\s*(\S+)/);
			const issueId = match?.[1];

			if (!issueId) {
				throw new Error('Could not parse issue ID from CLI output');
			}

			// Fetch the created issue from database
			const issue = await this.#dal.getIssue(issueId);

			if (!issue) {
				throw new Error(`Created issue ${issueId} not found in database`);
			}

			// Add to local state
			this.#issues = [...this.#issues, issue];
			this.#notifyListeners();

			toastStore.success(`Created issue ${issueId}`);
			return issue;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Update an existing issue via bd CLI
	 */
	async update(id: string, changes: Partial<CreateIssueInput>): Promise<void> {
		if (!this.#supervisor) {
			await this.init();
		}
		if (!this.#supervisor) {
			toastStore.error('Store not initialized');
			return;
		}

		const original = this.#issues.find((i) => i.id === id);
		if (!original) {
			throw new Error(`Issue ${id} not found`);
		}

		// Optimistic update
		this.#issues = this.#issues.map((issue) =>
			issue.id === id ? { ...issue, ...changes } : issue
		);
		this.#notifyListeners();

		const args = ['update', id];

		if (changes.title !== undefined) {
			args.push('--title', changes.title);
		}
		if (changes.issue_type !== undefined) {
			args.push('--type', changes.issue_type);
		}
		if (changes.priority !== undefined) {
			args.push('--priority', String(changes.priority));
		}
		if (changes.assignee !== undefined) {
			args.push('--assignee', changes.assignee);
		}
		if (changes.description !== undefined) {
			args.push('--description', changes.description);
		}

		try {
			const result = await this.#supervisor.execute('bd', args);

			if (result.exitCode !== 0) {
				throw new Error(result.stderr || 'Failed to update issue');
			}

			toastStore.success(`Updated issue ${id}`);
		} catch (error) {
			// Rollback on failure
			this.#issues = this.#issues.map((issue) => (issue.id === id ? original : issue));
			this.#notifyListeners();

			const message = error instanceof Error ? error.message : 'Failed to update issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Delete an issue via bd CLI
	 */
	async delete(id: string): Promise<void> {
		if (!this.#supervisor) {
			await this.init();
		}
		if (!this.#supervisor) {
			toastStore.error('Store not initialized');
			return;
		}

		const original = this.#issues.find((i) => i.id === id);
		if (!original) {
			throw new Error(`Issue ${id} not found`);
		}

		// Optimistic update - store the original list for rollback
		const originalIssues = [...this.#issues];
		this.#issues = this.#issues.filter((issue) => issue.id !== id);
		this.#notifyListeners();

		try {
			const result = await this.#supervisor.execute('bd', ['close', id]);

			if (result.exitCode !== 0) {
				throw new Error(result.stderr || 'Failed to delete issue');
			}

			toastStore.success(`Closed issue ${id}`);
		} catch (error) {
			// Rollback on failure
			this.#issues = originalIssues;
			this.#notifyListeners();

			const message = error instanceof Error ? error.message : 'Failed to delete issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Subscribe to store changes
	 */
	subscribe(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	/**
	 * Get available statuses from DAL
	 */
	async getStatuses(): Promise<string[]> {
		if (!this.#dal) {
			await this.init();
		}
		if (!this.#dal) return ['open', 'in_progress', 'done'];
		return this.#dal.getStatuses();
	}

	/**
	 * Get available assignees from DAL
	 */
	async getAssignees(): Promise<string[]> {
		if (!this.#dal) {
			await this.init();
		}
		if (!this.#dal) return [];
		return this.#dal.getAssignees();
	}

	/**
	 * Get available issue types from DAL
	 */
	async getIssueTypes(): Promise<string[]> {
		if (!this.#dal) {
			await this.init();
		}
		if (!this.#dal) return ['task', 'bug', 'feature'];
		return this.#dal.getIssueTypes();
	}

	#notifyListeners(): void {
		this.#listeners.forEach((listener) => listener());
	}

	/**
	 * Start watching for external changes (via WebSocket or polling)
	 * @param options Watch options
	 */
	startWatching(options: { websocketUrl?: string; pollingInterval?: number } = {}): void {
		if (this.#watching) return;

		const { websocketUrl, pollingInterval = 5000 } = options;

		if (websocketUrl && browser) {
			// Try WebSocket connection
			this.#realtimeClient = createRealtimeClient({
				url: websocketUrl,
				reconnectDelay: 1000,
				maxReconnectDelay: 30000
			});

			this.#realtimeClient.on('issues-changed', () => {
				this.load();
			});

			this.#realtimeClient.on('connected', () => {
				toastStore.info('Connected to real-time updates');
			});

			this.#realtimeClient.on('disconnected', () => {
				// Fallback to polling when WebSocket disconnects
				if (!this.#pollingInterval) {
					this.#startPolling(pollingInterval);
				}
			});

			this.#realtimeClient.connect();
		} else if (browser) {
			// Use polling as fallback
			this.#startPolling(pollingInterval);
		}

		this.#watching = true;
	}

	/**
	 * Stop watching for changes
	 */
	stopWatching(): void {
		if (this.#realtimeClient) {
			this.#realtimeClient.disconnect();
			this.#realtimeClient = null;
		}

		if (this.#pollingInterval) {
			clearInterval(this.#pollingInterval);
			this.#pollingInterval = null;
		}

		this.#watching = false;
	}

	/**
	 * Start polling for changes
	 */
	#startPolling(intervalMs: number): void {
		if (this.#pollingInterval) return;

		this.#pollingInterval = setInterval(async () => {
			try {
				await this.load();
			} catch {
				// Silently ignore polling errors
			}
		}, intervalMs);
	}

	/**
	 * Check if currently watching for changes
	 */
	get isWatching(): boolean {
		return this.#watching;
	}
}

// Export singleton instance
export const appStore = new AppStore();

// Export class for testing
export { AppStore };
