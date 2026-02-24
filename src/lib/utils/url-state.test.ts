/**
 * URL State Utilities Tests
 * @module utils/url-state.test
 */

import { describe, it, expect } from 'vitest';
import {
	parseFilterFromURL,
	serializeFilterToURL,
	hasActiveFilters,
	buildFilterURL
} from './url-state.js';
import type { IssueFilter } from '$lib/db/types.js';

describe('parseFilterFromURL', () => {
	it('parses empty params to empty filter', () => {
		const params = new URLSearchParams();
		const filter = parseFilterFromURL(params);
		expect(filter).toEqual({});
	});

	it('parses single status', () => {
		const params = new URLSearchParams('status=open');
		const filter = parseFilterFromURL(params);
		expect(filter.status).toBe('open');
	});

	it('parses multiple statuses', () => {
		const params = new URLSearchParams('status=open&status=in_progress');
		const filter = parseFilterFromURL(params);
		expect(filter.status).toEqual(['open', 'in_progress']);
	});

	it('parses single issue type', () => {
		const params = new URLSearchParams('type=bug');
		const filter = parseFilterFromURL(params);
		expect(filter.issueType).toBe('bug');
	});

	it('parses multiple issue types', () => {
		const params = new URLSearchParams('type=bug&type=feature');
		const filter = parseFilterFromURL(params);
		expect(filter.issueType).toEqual(['bug', 'feature']);
	});

	it('parses single priority', () => {
		const params = new URLSearchParams('priority=1');
		const filter = parseFilterFromURL(params);
		expect(filter.priority).toBe(1);
	});

	it('parses multiple priorities', () => {
		const params = new URLSearchParams('priority=1&priority=2');
		const filter = parseFilterFromURL(params);
		expect(filter.priority).toEqual([1, 2]);
	});

	it('parses assignee', () => {
		const params = new URLSearchParams('assignee=alice');
		const filter = parseFilterFromURL(params);
		expect(filter.assignee).toBe('alice');
	});

	it('parses search query', () => {
		const params = new URLSearchParams('q=bug+fix');
		const filter = parseFilterFromURL(params);
		expect(filter.search).toBe('bug fix');
	});

	it('parses combined filters', () => {
		const params = new URLSearchParams('status=open&type=bug&priority=1&assignee=bob&q=urgent');
		const filter = parseFilterFromURL(params);
		expect(filter).toEqual({
			status: 'open',
			issueType: 'bug',
			priority: 1,
			assignee: 'bob',
			search: 'urgent'
		});
	});

	it('ignores invalid priority values', () => {
		const params = new URLSearchParams('priority=invalid');
		const filter = parseFilterFromURL(params);
		expect(filter.priority).toBeUndefined();
	});
});

describe('serializeFilterToURL', () => {
	it('serializes empty filter to empty string', () => {
		const result = serializeFilterToURL({});
		expect(result).toBe('');
	});

	it('serializes single status', () => {
		const filter: IssueFilter = { status: 'open' };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('status=open');
	});

	it('serializes multiple statuses', () => {
		const filter: IssueFilter = { status: ['open', 'in_progress'] };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('status=open&status=in_progress');
	});

	it('serializes issue type', () => {
		const filter: IssueFilter = { issueType: 'bug' };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('type=bug');
	});

	it('serializes priority', () => {
		const filter: IssueFilter = { priority: 1 };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('priority=1');
	});

	it('serializes assignee', () => {
		const filter: IssueFilter = { assignee: 'alice' };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('assignee=alice');
	});

	it('serializes search', () => {
		const filter: IssueFilter = { search: 'bug fix' };
		const result = serializeFilterToURL(filter);
		expect(result).toBe('q=bug+fix');
	});

	it('serializes combined filters', () => {
		const filter: IssueFilter = {
			status: 'open',
			issueType: 'bug',
			priority: 1,
			assignee: 'bob',
			search: 'urgent'
		};
		const result = serializeFilterToURL(filter);
		const params = new URLSearchParams(result);
		expect(params.get('status')).toBe('open');
		expect(params.get('type')).toBe('bug');
		expect(params.get('priority')).toBe('1');
		expect(params.get('assignee')).toBe('bob');
		expect(params.get('q')).toBe('urgent');
	});
});

describe('hasActiveFilters', () => {
	it('returns false for empty filter', () => {
		expect(hasActiveFilters({})).toBe(false);
	});

	it('returns true for status filter', () => {
		expect(hasActiveFilters({ status: 'open' })).toBe(true);
	});

	it('returns true for issueType filter', () => {
		expect(hasActiveFilters({ issueType: 'bug' })).toBe(true);
	});

	it('returns true for priority filter', () => {
		expect(hasActiveFilters({ priority: 1 })).toBe(true);
	});

	it('returns true for priority 0', () => {
		expect(hasActiveFilters({ priority: 0 })).toBe(true);
	});

	it('returns true for assignee filter', () => {
		expect(hasActiveFilters({ assignee: 'alice' })).toBe(true);
	});

	it('returns true for search filter', () => {
		expect(hasActiveFilters({ search: 'test' })).toBe(true);
	});
});

describe('buildFilterURL', () => {
	it('returns base path for empty filter', () => {
		expect(buildFilterURL('/', {})).toBe('/');
	});

	it('appends query params for filter', () => {
		const filter: IssueFilter = { status: 'open' };
		expect(buildFilterURL('/', filter)).toBe('/?status=open');
	});

	it('works with non-root paths', () => {
		const filter: IssueFilter = { status: 'open' };
		expect(buildFilterURL('/epics', filter)).toBe('/epics?status=open');
	});
});
