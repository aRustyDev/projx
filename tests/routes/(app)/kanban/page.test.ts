/**
 * Kanban Board Page Tests
 * @module routes/(app)/kanban/+page.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../../../../src/routes/(app)/kanban/+page.svelte';
import type { Issue } from '$lib/db/types.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/index.js';

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

// Mock DAL factory
function createMockDAL(overrides: Partial<DataAccessLayer> = {}): DataAccessLayer {
	return {
		getIssues: vi.fn().mockResolvedValue([]),
		getIssue: vi.fn().mockResolvedValue(null),
		getDependencies: vi.fn().mockResolvedValue([]),
		getComments: vi.fn().mockResolvedValue([]),
		getLabels: vi.fn().mockResolvedValue([]),
		getStatuses: vi.fn().mockResolvedValue(['open', 'in_progress', 'done']),
		getAssignees: vi.fn().mockResolvedValue(['alice', 'bob']),
		getIssueTypes: vi.fn().mockResolvedValue(['task', 'bug', 'feature']),
		getIssueCount: vi.fn().mockResolvedValue(0),
		getBackend: vi.fn().mockReturnValue('sqlite'),
		query: vi.fn().mockResolvedValue({ rows: [], duration: 0 }),
		close: vi.fn().mockResolvedValue(undefined),
		...overrides
	} as unknown as DataAccessLayer;
}

// Mock ProcessSupervisor factory
function createMockSupervisor(overrides: Partial<ProcessSupervisor> = {}): ProcessSupervisor {
	return {
		execute: vi.fn().mockResolvedValue({
			exitCode: 0,
			stdout: '',
			stderr: '',
			duration: 100,
			timedOut: false
		}),
		getCircuitState: vi.fn().mockReturnValue('closed'),
		getStats: vi
			.fn()
			.mockReturnValue({ active: 0, queued: 0, circuitState: 'closed', failures: 0 }),
		on: vi.fn(),
		off: vi.fn(),
		resetCircuit: vi.fn(),
		clearQueue: vi.fn(),
		...overrides
	} as unknown as ProcessSupervisor;
}

describe('Kanban Page', () => {
	let mockDAL: DataAccessLayer;
	let mockSupervisor: ProcessSupervisor;

	beforeEach(() => {
		mockDAL = createMockDAL();
		mockSupervisor = createMockSupervisor();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Data Loading', () => {
		it('loads issues from Data Access Layer on mount', async () => {
			vi.mocked(mockDAL.getIssues).mockResolvedValue([createMockIssue()]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(mockDAL.getIssues).toHaveBeenCalled();
		});

		it('displays loading skeleton while loading', () => {
			vi.mocked(mockDAL.getIssues).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 500))
			);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });

			expect(screen.getByTestId('kanban-loading')).toBeInTheDocument();
		});

		it('displays KanbanBoard when loaded', async () => {
			vi.mocked(mockDAL.getIssues).mockResolvedValue([createMockIssue()]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
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
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
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
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
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
		it('displays error message on load failure', async () => {
			vi.mocked(mockDAL.getIssues).mockRejectedValue(new Error('Database error'));

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(await screen.findByText(/error loading issues/i)).toBeInTheDocument();
		});
	});
});
