/**
 * Database Types for Data Access Layer
 * @module db/types
 */

// ─────────────────────────────────────────────────────────────────────────────
// Global Enums and Constants
// These are the single source of truth for all enum-like values in the app
// ─────────────────────────────────────────────────────────────────────────────

/** Priority levels (0 = most urgent) */
export const PRIORITY_OPTIONS = [
	{ value: 0, label: 'P0 - Urgent', color: 'red' },
	{ value: 1, label: 'P1 - Critical', color: 'orange' },
	{ value: 2, label: 'P2 - High', color: 'yellow' },
	{ value: 3, label: 'P3 - Medium', color: 'blue' },
	{ value: 4, label: 'P4 - Low', color: 'gray' }
] as const;

/** Issue statuses */
export const STATUS_OPTIONS = [
	{ value: 'open', label: 'Open', color: 'blue' },
	{ value: 'in_progress', label: 'In Progress', color: 'yellow' },
	{ value: 'blocked', label: 'Blocked', color: 'red' },
	{ value: 'review', label: 'Review', color: 'purple' },
	{ value: 'done', label: 'Done', color: 'green' },
	{ value: 'closed', label: 'Closed', color: 'gray' }
] as const;

/** Issue types */
export const ISSUE_TYPE_OPTIONS = [
	{ value: 'task', label: 'Task', icon: 'check-square' },
	{ value: 'bug', label: 'Bug', icon: 'bug' },
	{ value: 'feature', label: 'Feature', icon: 'lightbulb' },
	{ value: 'epic', label: 'Epic', icon: 'layers' },
	{ value: 'story', label: 'Story', icon: 'book-open' }
] as const;

/** Extract values for type definitions */
export type Priority = (typeof PRIORITY_OPTIONS)[number]['value'];
export type Status = (typeof STATUS_OPTIONS)[number]['value'];
export type IssueType = (typeof ISSUE_TYPE_OPTIONS)[number]['value'];

// ─────────────────────────────────────────────────────────────────────────────
// Database Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Supported database backends */
export type DatabaseBackend = 'sqlite' | 'dolt';

/** Configuration for Data Access Layer */
export interface DatabaseConfig {
	/** Path to .beads directory (default: auto-discover) */
	beadsPath?: string;
	/** Override backend detection */
	backend?: DatabaseBackend;
	/** Dolt server configuration */
	dolt?: {
		host: string;
		port: number;
		user: string;
		password: string;
		database: string;
	};
	/** Connection pool size for Dolt (default: 5) */
	poolSize?: number;
}

/** Result of a database query */
export interface QueryResult<T = Record<string, unknown>> {
	/** Returned rows */
	rows: T[];
	/** Number of rows affected (for write operations) */
	affectedRows?: number;
	/** Query execution time in milliseconds */
	duration: number;
}

/** Issue type from database */
export interface Issue {
	id: string;
	title: string;
	description: string;
	design?: string;
	acceptance_criteria?: string;
	notes?: string;
	status: string;
	priority: number;
	issue_type: string;
	assignee?: string;
	owner?: string;
	created_at: string;
	updated_at: string;
	closed_at?: string;
	external_ref?: string;
	spec_id?: string;
	due_at?: string;
	metadata?: Record<string, unknown>;
}

/** Dependency relationship from database */
export interface Dependency {
	issue_id: string;
	depends_on_id: string;
	type: 'blocks' | 'parent-child' | 'relates_to';
	created_at: string;
}

/** Comment from database */
export interface Comment {
	id: string;
	issue_id: string;
	content: string;
	author: string;
	created_at: string;
}

/** Label from database */
export interface Label {
	issue_id: string;
	label: string;
}

/** Filter options for issue queries */
export interface IssueFilter {
	status?: string | string[];
	priority?: number | number[];
	issueType?: string | string[];
	assignee?: string | string[];
	search?: string;
	parentId?: string;
	labels?: string[];
	limit?: number;
	offset?: number;
	orderBy?: {
		field: keyof Issue;
		direction: 'asc' | 'desc';
	};
}

/**
 * DataAccessLayer interface for browser-safe type imports.
 * The actual implementation is in $lib/server/db/dal.ts (server-only).
 */
export interface DataAccessLayer {
	/** Get the current backend type */
	getBackend(): DatabaseBackend;

	/** Execute a raw SQL query (read operations only) */
	query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;

	/** Get issues with optional filtering */
	getIssues(filter?: IssueFilter): Promise<Issue[]>;

	/** Get a single issue by ID */
	getIssue(id: string): Promise<Issue | null>;

	/** Get dependencies for an issue */
	getDependencies(issueId: string): Promise<Dependency[]>;

	/** Get comments for an issue */
	getComments(issueId: string): Promise<Comment[]>;

	/** Get labels for an issue */
	getLabels(issueId: string): Promise<string[]>;

	/** Get all unique statuses in use */
	getStatuses(): Promise<string[]>;

	/** Get all unique assignees */
	getAssignees(): Promise<string[]>;

	/** Get all unique issue types */
	getIssueTypes(): Promise<string[]>;

	/** Get issue count with optional filter */
	getIssueCount(filter?: IssueFilter): Promise<number>;

	/** Close database connections */
	close(): Promise<void>;
}
