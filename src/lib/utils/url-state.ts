/**
 * URL State Utilities - Sync filter state with URL query parameters
 * @module utils/url-state
 */

import type { IssueFilter } from '$lib/db/types.js';

/**
 * Parse URL search params into an IssueFilter
 */
export function parseFilterFromURL(searchParams: URLSearchParams): IssueFilter {
	const filter: IssueFilter = {};

	// Status (can be multiple)
	const statuses = searchParams.getAll('status');
	if (statuses.length > 0) {
		filter.status = statuses.length === 1 ? statuses[0] : statuses;
	}

	// Issue type (can be multiple)
	const types = searchParams.getAll('type');
	if (types.length > 0) {
		filter.issueType = types.length === 1 ? types[0] : types;
	}

	// Priority (can be multiple, convert to numbers)
	const priorities = searchParams
		.getAll('priority')
		.map(Number)
		.filter((n) => !isNaN(n));
	if (priorities.length > 0) {
		filter.priority = priorities.length === 1 ? priorities[0] : priorities;
	}

	// Assignee (single value)
	const assignee = searchParams.get('assignee');
	if (assignee) {
		filter.assignee = assignee;
	}

	// Search query
	const search = searchParams.get('q');
	if (search) {
		filter.search = search;
	}

	return filter;
}

/**
 * Serialize an IssueFilter to URL search params string
 */
export function serializeFilterToURL(filter: IssueFilter): string {
	const params = new URLSearchParams();

	// Status
	if (filter.status) {
		const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
		statuses.forEach((s) => params.append('status', s));
	}

	// Issue type
	if (filter.issueType) {
		const types = Array.isArray(filter.issueType) ? filter.issueType : [filter.issueType];
		types.forEach((t) => params.append('type', t));
	}

	// Priority
	if (filter.priority !== undefined) {
		const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
		priorities.forEach((p) => params.append('priority', String(p)));
	}

	// Assignee
	if (filter.assignee) {
		const assignee = Array.isArray(filter.assignee) ? filter.assignee[0] : filter.assignee;
		if (assignee) {
			params.set('assignee', assignee);
		}
	}

	// Search
	if (filter.search) {
		params.set('q', filter.search);
	}

	return params.toString();
}

/**
 * Check if filter has any active values
 */
export function hasActiveFilters(filter: IssueFilter): boolean {
	return !!(
		filter.status ||
		filter.issueType ||
		filter.priority !== undefined ||
		filter.assignee ||
		filter.search
	);
}

/**
 * Build a URL with filter params
 */
export function buildFilterURL(basePath: string, filter: IssueFilter): string {
	const params = serializeFilterToURL(filter);
	return params ? `${basePath}?${params}` : basePath;
}
