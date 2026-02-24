/**
 * Issue Store - Reactive state management for issues
 * @module stores/issues.svelte
 */

import type { Issue, IssueFilter } from '$lib/db/types.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/types.js';

export interface IssueStoreConfig {
	dal: DataAccessLayer;
	supervisor: ProcessSupervisor;
}

export interface CreateIssueInput {
	title: string;
	issue_type: string;
	description?: string;
	priority?: number;
	assignee?: string;
	status?: string;
}

export interface UpdateIssueInput {
	title?: string;
	description?: string;
	status?: string;
	priority?: number;
	assignee?: string;
	issue_type?: string;
}

export class IssueStore {
	#dal: DataAccessLayer;
	#supervisor: ProcessSupervisor;

	// Reactive state using Svelte 5 runes
	#issues = $state<Issue[]>([]);
	#filter = $state<IssueFilter>({});
	#selectedId = $state<string | null>(null);
	#loading = $state(false);

	constructor(config: IssueStoreConfig) {
		this.#dal = config.dal;
		this.#supervisor = config.supervisor;
	}

	// Public getters for reactive state
	get issues(): Issue[] {
		return this.#issues;
	}

	get filter(): IssueFilter {
		return this.#filter;
	}

	get selectedId(): string | null {
		return this.#selectedId;
	}

	get loading(): boolean {
		return this.#loading;
	}

	// Derived state: filtered issues
	get filtered(): Issue[] {
		return this.#issues.filter((issue) => {
			// Status filter
			if (this.#filter.status && issue.status !== this.#filter.status) {
				return false;
			}

			// Issue type filter
			if (this.#filter.issueType && issue.issue_type !== this.#filter.issueType) {
				return false;
			}

			// Priority filter
			if (this.#filter.priority !== undefined && issue.priority !== this.#filter.priority) {
				return false;
			}

			// Assignee filter
			if (this.#filter.assignee && issue.assignee !== this.#filter.assignee) {
				return false;
			}

			// Text search filter
			if (this.#filter.search) {
				const searchLower = this.#filter.search.toLowerCase();
				const matchesId = issue.id.toLowerCase().includes(searchLower);
				const matchesTitle = issue.title.toLowerCase().includes(searchLower);
				const matchesDescription = issue.description?.toLowerCase().includes(searchLower);
				if (!matchesId && !matchesTitle && !matchesDescription) {
					return false;
				}
			}

			return true;
		});
	}

	// Derived state: selected issue
	get selected(): Issue | null {
		if (!this.#selectedId) return null;
		return this.#issues.find((issue) => issue.id === this.#selectedId) ?? null;
	}

	// Load issues from database
	async load(): Promise<void> {
		this.#loading = true;
		try {
			const issues = await this.#dal.getIssues();
			this.#issues = issues;
		} finally {
			this.#loading = false;
		}
	}

	// Refresh issues (alias for load, used after mutations)
	async refresh(): Promise<void> {
		return this.load();
	}

	// Set filter criteria
	setFilter(filter: IssueFilter): void {
		this.#filter = filter;
	}

	// Set selected issue
	setSelected(id: string | null): void {
		this.#selectedId = id;
	}

	// Create a new issue via bd CLI
	async create(input: CreateIssueInput): Promise<Issue> {
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

		return issue;
	}

	// Update an existing issue via bd CLI
	async update(id: string, changes: UpdateIssueInput): Promise<void> {
		// Find the issue to update
		const issueIndex = this.#issues.findIndex((i) => i.id === id);
		if (issueIndex === -1) {
			throw new Error(`Issue ${id} not found`);
		}

		// Store original for rollback
		const original = this.#issues[issueIndex];

		// Optimistic update
		this.#issues = this.#issues.map((issue) =>
			issue.id === id ? { ...issue, ...changes } : issue
		);

		// Build CLI arguments
		const args = ['update', id];

		if (changes.title !== undefined) {
			args.push('--title', changes.title);
		}

		if (changes.status !== undefined) {
			args.push('--status', changes.status);
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

		if (changes.issue_type !== undefined) {
			args.push('--type', changes.issue_type);
		}

		try {
			const result = await this.#supervisor.execute('bd', args);

			if (result.exitCode !== 0) {
				throw new Error(result.stderr || 'Failed to update issue');
			}
		} catch (error) {
			// Rollback on failure
			this.#issues = this.#issues.map((issue) => (issue.id === id ? original : issue));
			throw error;
		}
	}
}

// Factory function for creating the store
export function createIssueStore(config: IssueStoreConfig): IssueStore {
	return new IssueStore(config);
}
