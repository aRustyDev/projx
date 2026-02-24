/**
 * Epics Page Tests
 * @module routes/(app)/epics/+page.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from '../../../../src/routes/(app)/epics/+page.svelte';
import type { Issue } from '$lib/db/types.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/index.js';

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

function createMockDAL(): DataAccessLayer {
	return {
		getIssues: vi.fn().mockResolvedValue([]),
		getIssue: vi.fn().mockResolvedValue(null),
		getStatuses: vi.fn().mockResolvedValue(['open', 'in_progress', 'done']),
		getAssignees: vi.fn().mockResolvedValue(['alice', 'bob']),
		getIssueTypes: vi.fn().mockResolvedValue(['task', 'bug', 'feature', 'epic']),
		close: vi.fn()
	} as unknown as DataAccessLayer;
}

function createMockSupervisor(): ProcessSupervisor {
	return {
		execute: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
		spawn: vi.fn()
	} as unknown as ProcessSupervisor;
}

describe('Epics Page', () => {
	let mockDAL: DataAccessLayer;
	let mockSupervisor: ProcessSupervisor;

	beforeEach(() => {
		mockDAL = createMockDAL();
		mockSupervisor = createMockSupervisor();
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Rendering', () => {
		it('shows page title', async () => {
			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(screen.getByRole('heading', { name: 'Epics' })).toBeInTheDocument();
		});

		it('shows loading skeleton initially', () => {
			vi.mocked(mockDAL.getIssues).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 100))
			);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });

			expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
		});

		it('shows search input', async () => {
			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			// Get the main search input (not filter panel inputs)
			const searchInputs = screen.getAllByRole('searchbox');
			expect(searchInputs.length).toBeGreaterThan(0);
		});
	});

	describe('Data Loading', () => {
		it('loads issues from store', async () => {
			vi.mocked(mockDAL.getIssues).mockResolvedValue([createMockEpic()]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(mockDAL.getIssues).toHaveBeenCalled();
		});

		it('displays epics when loaded', async () => {
			const epic = createMockEpic({ title: 'My Epic' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([epic]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(screen.getByText('My Epic')).toBeInTheDocument();
		});

		it('shows empty state when no epics', async () => {
			vi.mocked(mockDAL.getIssues).mockResolvedValue([createMockIssue({ issue_type: 'task' })]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(screen.getByText(/no epics found/i)).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('shows error message on load failure', async () => {
			vi.mocked(mockDAL.getIssues).mockRejectedValue(new Error('Database error'));

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(screen.getByText(/error loading epics/i)).toBeInTheDocument();
		});

		it('shows retry button on error', async () => {
			vi.mocked(mockDAL.getIssues).mockRejectedValue(new Error('Database error'));

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});

		it('retries loading when retry clicked', async () => {
			vi.mocked(mockDAL.getIssues)
				.mockRejectedValueOnce(new Error('Database error'))
				.mockResolvedValueOnce([createMockEpic()]);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
			await waitForAsync();

			await fireEvent.click(screen.getByRole('button', { name: /retry/i }));
			await waitForAsync();

			expect(mockDAL.getIssues).toHaveBeenCalledTimes(2);
		});
	});

	describe('Filtering', () => {
		it('filters epics by search term', async () => {
			const epics = [
				createMockEpic({ id: 'EPIC-1', title: 'Authentication Epic' }),
				createMockEpic({ id: 'EPIC-2', title: 'Dashboard Epic' })
			];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(epics);

			render(Page, { props: { dal: mockDAL, supervisor: mockSupervisor } });
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
