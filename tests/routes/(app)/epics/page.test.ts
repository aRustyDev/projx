/**
 * Epics Page Tests
 * @module routes/(app)/epics/+page.test
 *
 * Tests use server-side data loading - data is passed via the `data` prop
 * which simulates SvelteKit's +page.server.ts load function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../../../../src/routes/(app)/epics/+page.svelte';
import type { Issue } from '$lib/db/types.js';

// Helper to wait for async operations
async function waitForAsync() {
	await tick();
	await new Promise((r) => setTimeout(r, 0));
	await tick();
}

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'TEST-1',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		...overrides
	};
}

function createMockEpic(overrides: Partial<Issue> = {}): Issue {
	return createMockIssue({
		id: 'EPIC-1',
		title: 'Test Epic',
		issue_type: 'epic',
		...overrides
	});
}

// Mock server data factory (simulates +page.server.ts load result)
function createMockServerData(issues: Issue[] = []) {
	return {
		issues,
		statuses: ['open', 'in_progress', 'done'],
		assignees: ['alice', 'bob']
	};
}

describe('Epics Page', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Rendering', () => {
		it('shows page title', async () => {
			render(Page, { props: { data: createMockServerData() } });
			await waitForAsync();

			expect(screen.getByRole('heading', { name: 'Epics' })).toBeInTheDocument();
		});

		it('shows search input', async () => {
			render(Page, { props: { data: createMockServerData() } });
			await waitForAsync();

			// Get the main search input (not filter panel inputs)
			const searchInputs = screen.getAllByRole('searchbox');
			expect(searchInputs.length).toBeGreaterThan(0);
		});
	});

	describe('Data Loading (Server-Side)', () => {
		it('displays epics from server data', async () => {
			const epic = createMockEpic({ title: 'My Epic' });

			render(Page, {
				props: { data: createMockServerData([epic]) }
			});
			await waitForAsync();

			expect(screen.getByText('My Epic')).toBeInTheDocument();
		});

		it('shows empty state when no epics', async () => {
			render(Page, {
				props: { data: createMockServerData([createMockIssue({ issue_type: 'task' })]) }
			});
			await waitForAsync();

			expect(screen.getByText(/no epics found/i)).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('shows error message when server returns error', async () => {
			render(Page, {
				props: {
					data: { ...createMockServerData(), error: 'Database error' }
				}
			});
			await waitForAsync();

			expect(screen.getByText(/error loading epics/i)).toBeInTheDocument();
		});

		it('shows retry button on error', async () => {
			render(Page, {
				props: {
					data: { ...createMockServerData(), error: 'Database error' }
				}
			});
			await waitForAsync();

			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});
	});

	describe('Filtering', () => {
		it('filters epics by search term', async () => {
			const epics = [
				createMockEpic({ id: 'EPIC-1', title: 'Authentication Epic' }),
				createMockEpic({ id: 'EPIC-2', title: 'Dashboard Epic' })
			];

			render(Page, {
				props: { data: createMockServerData(epics) }
			});
			await waitForAsync();

			// Get the first searchbox (main search, not filter panel)
			const searchInput = screen.getAllByRole('searchbox')[0];
			await fireEvent.input(searchInput!, { target: { value: 'Auth' } });
			vi.advanceTimersByTime(300); // Debounce
			await waitForAsync();

			expect(screen.getByText('Authentication Epic')).toBeInTheDocument();
			expect(screen.queryByText('Dashboard Epic')).not.toBeInTheDocument();
		});
	});
});
