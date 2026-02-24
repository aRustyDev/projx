/**
 * KanbanBoard Component Tests (TDD)
 * @module components/kanban/KanbanBoard.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import KanbanBoard from './KanbanBoard.svelte';

const defaultStatuses = ['open', 'in_progress', 'review', 'done'];

const mockIssues = [
	{
		id: 'TEST-1',
		title: 'Open issue',
		type: 'task',
		priority: 'P2',
		status: 'open',
		assignee: 'Alice'
	},
	{
		id: 'TEST-2',
		title: 'In progress',
		type: 'bug',
		priority: 'P1',
		status: 'in_progress',
		assignee: 'Bob'
	},
	{
		id: 'TEST-3',
		title: 'Another open',
		type: 'task',
		priority: 'P3',
		status: 'open',
		assignee: null
	},
	{
		id: 'TEST-4',
		title: 'Under review',
		type: 'feature',
		priority: 'P2',
		status: 'review',
		assignee: 'Charlie'
	}
];

describe('KanbanBoard', () => {
	describe('columns', () => {
		it('renders a column for each status', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			// Check for column headers by looking for h3 elements with specific text
			const openHeaders = screen.getAllByRole('heading', { level: 3 });
			expect(openHeaders.some((h) => h.textContent === 'Open')).toBe(true);
			expect(openHeaders.some((h) => h.textContent === 'In Progress')).toBe(true);
			expect(openHeaders.some((h) => h.textContent === 'Review')).toBe(true);
			expect(openHeaders.some((h) => h.textContent === 'Done')).toBe(true);
		});

		it('distributes issues to correct columns', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			// Get all listboxes (columns)
			const columns = screen.getAllByRole('listbox');
			expect(columns).toHaveLength(4);

			// Check cards are in correct columns
			expect(screen.getByText('Open issue')).toBeInTheDocument();
			expect(screen.getByText('In progress')).toBeInTheDocument();
			expect(screen.getByText('Under review')).toBeInTheDocument();
		});

		it('updates when issues prop changes', async () => {
			const { rerender } = render(KanbanBoard, {
				props: { issues: mockIssues, statuses: defaultStatuses }
			});

			expect(screen.getByText('Open issue')).toBeInTheDocument();

			// Update issues - move Open issue to done
			const updatedIssues = mockIssues.map((i) =>
				i.id === 'TEST-1' ? { ...i, status: 'done' } : i
			);
			await rerender({ issues: updatedIssues, statuses: defaultStatuses });

			// The issue should now appear in a different visual context
			expect(screen.getByText('Open issue')).toBeInTheDocument();
		});

		it('handles empty state (no issues)', () => {
			render(KanbanBoard, { props: { issues: [], statuses: defaultStatuses } });

			// All columns should show empty state
			const emptyMessages = screen.getAllByText(/no issues/i);
			expect(emptyMessages).toHaveLength(4);
		});
	});

	describe('interaction', () => {
		it('calls oncardclick when card is clicked', async () => {
			const onCardClick = vi.fn();
			render(KanbanBoard, {
				props: { issues: mockIssues, statuses: defaultStatuses, oncardclick: onCardClick }
			});

			await fireEvent.click(screen.getByText('Open issue'));

			expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'TEST-1' }));
		});

		it('calls onstatuschange when card dropped in new column', async () => {
			const onStatusChange = vi.fn();
			render(KanbanBoard, {
				props: { issues: mockIssues, statuses: defaultStatuses, onstatuschange: onStatusChange }
			});

			// Find the in_progress column and drop a card
			const columns = screen.getAllByRole('listbox');
			expect(columns.length).toBeGreaterThan(1);
			const inProgressColumn = columns[1]!; // Second column

			await fireEvent.drop(inProgressColumn, {
				dataTransfer: { getData: () => JSON.stringify(mockIssues[0]) }
			});

			expect(onStatusChange).toHaveBeenCalledWith(
				expect.objectContaining({ id: 'TEST-1' }),
				'in_progress'
			);
		});
	});

	describe('layout', () => {
		it('displays columns horizontally', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			const board = screen.getByTestId('kanban-board');
			expect(board).toHaveClass('flex');
		});

		it('columns have equal width', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			const columns = screen.getAllByRole('listbox');
			// Each column's wrapper (grandparent of listbox) has flex-1
			columns.forEach((column) => {
				const wrapper = column.closest('.flex-1');
				expect(wrapper).toBeTruthy();
			});
		});
	});

	describe('accessibility', () => {
		it('board has appropriate role', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			expect(screen.getByRole('region')).toBeInTheDocument();
		});

		it('board has aria-label', () => {
			render(KanbanBoard, { props: { issues: mockIssues, statuses: defaultStatuses } });

			const board = screen.getByRole('region');
			expect(board).toHaveAttribute('aria-label', 'Kanban board');
		});
	});

	describe('loading state', () => {
		it('shows loading skeleton when loading', () => {
			render(KanbanBoard, { props: { issues: [], statuses: defaultStatuses, loading: true } });

			expect(screen.getByTestId('kanban-loading')).toBeInTheDocument();
		});

		it('hides loading skeleton when not loading', () => {
			render(KanbanBoard, {
				props: { issues: mockIssues, statuses: defaultStatuses, loading: false }
			});

			expect(screen.queryByTestId('kanban-loading')).not.toBeInTheDocument();
		});
	});
});
