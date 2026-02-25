/**
 * Kanban Board Page Tests
 * @module routes/(app)/kanban/+page.test
 *
 * Tests use server-side data loading - data is passed via the `data` prop
 * which simulates SvelteKit's +page.server.ts load function.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../../../../src/routes/(app)/kanban/+page.svelte';
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
		statuses: ['open', 'in_progress', 'review', 'done'],
		assignees: ['alice', 'bob'],
		issueTypes: ['task', 'bug', 'feature']
	};
}

describe('Kanban Page', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Data Loading (Server-Side)', () => {
		it('displays issues from server data', async () => {
			const issues = [createMockIssue()];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			expect(await screen.findByTestId('kanban-board', {}, { timeout: 3000 })).toBeInTheDocument();
		});

		it('displays KanbanBoard with server data', async () => {
			const issues = [createMockIssue()];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			expect(await screen.findByTestId('kanban-board', {}, { timeout: 3000 })).toBeInTheDocument();
		});
	});

	describe('Component Wiring', () => {
		it('passes filtered issues to KanbanBoard', async () => {
			const issues = [
				createMockIssue({ id: '1', status: 'open', title: 'Open Issue' }),
				createMockIssue({ id: '2', status: 'done', title: 'Done Issue' })
			];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			await screen.findByTestId('kanban-board', {}, { timeout: 3000 });

			// Both issues should be visible
			expect(screen.getByText('Open Issue')).toBeInTheDocument();
			expect(screen.getByText('Done Issue')).toBeInTheDocument();
		});

		it('KanbanBoard groups issues by status', async () => {
			const issues = [
				createMockIssue({ id: '1', status: 'open' }),
				createMockIssue({ id: '2', status: 'done' })
			];

			render(Page, {
				props: { data: createMockServerData(issues) }
			});
			await waitForAsync();

			await screen.findByTestId('kanban-board', {}, { timeout: 3000 });

			// Should have columns for each status (using aria-labels)
			expect(screen.getByLabelText(/open issues/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/done issues/i)).toBeInTheDocument();
		});
	});

	describe('Drag and Drop', () => {
		it.skip('dropping card calls issueStore.update with new status', async () => {
			// TODO: Implement drag-drop testing with proper DnD library simulation
		});

		it.skip('shows optimistic status update immediately', async () => {
			// TODO: Implement optimistic update testing
		});

		it.skip('reverts status on update failure', async () => {
			// TODO: Implement failure revert testing
		});
	});

	describe('Error Handling', () => {
		it('displays error message when server returns error', async () => {
			render(Page, {
				props: {
					data: { ...createMockServerData(), error: 'Database error' }
				}
			});
			await waitForAsync();

			expect(await screen.findByText(/error loading issues/i)).toBeInTheDocument();
		});
	});
});
