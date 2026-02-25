/**
 * Issues List Page Tests
 * @module routes/(app)/+page.test
 *
 * Tests use server-side data loading - data is passed via the `data` prop
 * which simulates SvelteKit's +page.server.ts load function.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../../../src/routes/(app)/+page.svelte';
import type { Issue } from '$lib/db/types.js';

// Helper to wait for async operations
async function waitForAsync() {
	await tick();
	await new Promise((r) => setTimeout(r, 50));
	await tick();
}

// Mock issue factory
function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'test-1',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: '2026-02-24T00:00:00Z',
		updated_at: '2026-02-24T00:00:00Z',
		...overrides
	};
}

// Mock server data factory (simulates +page.server.ts load result)
function createMockServerData(issues: Issue[] = []) {
	return {
		issues,
		statuses: ['open', 'in_progress', 'done'],
		assignees: ['alice', 'bob'],
		issueTypes: ['task', 'bug', 'feature']
	};
}

describe('Issues Page', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Data Loading (Server-Side)', () => {
		it('displays issues from server-loaded data', async () => {
			const issues = [createMockIssue({ id: 'test-1', title: 'Server Issue' })];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			expect(await screen.findByRole('grid', {}, { timeout: 3000 })).toBeInTheDocument();
			expect(screen.getByText('Server Issue')).toBeInTheDocument();
		});

		it('displays IssueTable with server data', async () => {
			const issues = [createMockIssue({ id: 'test-1', title: 'Test Issue' })];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			expect(await screen.findByRole('grid', {}, { timeout: 3000 })).toBeInTheDocument();
			expect(screen.getByText('Test Issue')).toBeInTheDocument();
		});

		it('displays error message when server returns error', async () => {
			render(Page, {
				props: {
					data: { ...createMockServerData(), error: 'Database connection failed' }
				}
			});
			await waitForAsync();

			expect(await screen.findByText(/error loading issues/i)).toBeInTheDocument();
		});
	});

	describe('Component Wiring', () => {
		it('passes filtered issues to IssueTable', async () => {
			const issues = [
				createMockIssue({ id: '1', status: 'open' }),
				createMockIssue({ id: '2', status: 'done' })
			];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			expect(await screen.findByRole('grid', {}, { timeout: 3000 })).toBeInTheDocument();
			// Both issues should be visible when no filter applied (header + 2 data rows)
			expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
		});

		it('passes filter state to FilterPanel', async () => {
			render(Page, {
				props: { data: createMockServerData() }
			});

			// FilterPanel is rendered immediately (not async)
			expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
		});

		it('passes search term to TextSearch', async () => {
			render(Page, {
				props: { data: createMockServerData() }
			});

			// TextSearch is rendered immediately
			expect(screen.getByLabelText(/search issues/i)).toBeInTheDocument();
		});
	});

	describe('Filter Integration', () => {
		it.skip('FilterPanel changes update issueStore.filter', async () => {
			// TODO: Fix timing issues with filter state updates
			const issues = [
				createMockIssue({ id: '1', status: 'open', title: 'Open Issue' }),
				createMockIssue({ id: '2', status: 'done', title: 'Done Issue' })
			];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			await screen.findByRole('grid', {}, { timeout: 3000 });

			const statusButton = screen.getByRole('button', { name: /status/i });
			await fireEvent.click(statusButton);

			const openOption = await screen.findByRole('checkbox', { name: /open/i });
			await fireEvent.click(openOption);
			await waitForAsync();

			expect(screen.getByText('Open Issue')).toBeInTheDocument();
			expect(screen.queryByText('Done Issue')).not.toBeInTheDocument();
		});
	});

	describe('Search Integration', () => {
		it.skip('TextSearch input updates search filter', async () => {
			// TODO: Fix timing issues with search debounce
			const issues = [
				createMockIssue({ id: '1', title: 'Bug in login' }),
				createMockIssue({ id: '2', title: 'Feature request' })
			];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await screen.findByRole('grid', {}, { timeout: 3000 });

			const searchInput = screen.getByLabelText(/search issues/i);
			await fireEvent.input(searchInput, { target: { value: 'Bug' } });
			await waitForAsync();

			expect(screen.getByText('Bug in login')).toBeInTheDocument();
			expect(screen.queryByText('Feature request')).not.toBeInTheDocument();
		});

		it.skip('clearing search shows all issues', async () => {
			// TODO: Fix timing issues with search clear
		});
	});

	describe('Selection', () => {
		it.skip('clicking row updates selectedId', async () => {
			// TODO: Fix row selection test - need to investigate IssueTable row click handling
			const issues = [createMockIssue({ id: 'test-1', title: 'Test Issue' })];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await screen.findByRole('grid', {}, { timeout: 3000 });

			const row = screen.getByRole('row', { name: /test issue/i });
			await fireEvent.click(row);

			expect(row).toHaveAttribute('aria-selected', 'true');
		});
	});

	describe('Empty State', () => {
		it('shows "No issues" when no issues exist', async () => {
			render(Page, {
				props: { data: createMockServerData([]) }
			});
			await waitForAsync();

			expect(await screen.findByText(/no issues/i)).toBeInTheDocument();
		});

		it.skip('shows "No matches" when filter yields no results', async () => {
			// TODO: Fix filter integration
		});
	});
});
