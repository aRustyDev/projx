/**
 * KanbanColumn Component Tests (TDD)
 * @module components/kanban/KanbanColumn.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import KanbanColumn from './KanbanColumn.svelte';

const mockIssues = [
	{
		id: 'TEST-1',
		title: 'First issue',
		type: 'task',
		priority: 'P2',
		status: 'open',
		assignee: 'Alice'
	},
	{
		id: 'TEST-2',
		title: 'Second issue',
		type: 'bug',
		priority: 'P1',
		status: 'open',
		assignee: 'Bob'
	}
];

describe('KanbanColumn', () => {
	describe('header', () => {
		it('displays column header with status name', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByRole('heading', { name: /open/i })).toBeInTheDocument();
		});

		it('displays issue count in header', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByText('2')).toBeInTheDocument();
		});

		it('updates count when issues change', async () => {
			const { rerender } = render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByText('2')).toBeInTheDocument();

			await rerender({ status: 'open', issues: [mockIssues[0]!] });

			expect(screen.getByText('1')).toBeInTheDocument();
		});
	});

	describe('cards', () => {
		it('renders KanbanCard for each issue', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByText('First issue')).toBeInTheDocument();
			expect(screen.getByText('Second issue')).toBeInTheDocument();
		});

		it('shows empty state when no issues in column', () => {
			render(KanbanColumn, { props: { status: 'open', issues: [] } });

			expect(screen.getByText(/no issues/i)).toBeInTheDocument();
		});
	});

	describe('collapse/expand', () => {
		it('has collapse button', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
		});

		it('hides cards when collapsed', async () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			await fireEvent.click(screen.getByRole('button', { name: /collapse/i }));

			expect(screen.queryByText('First issue')).not.toBeInTheDocument();
		});

		it('shows expand button when collapsed', async () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			await fireEvent.click(screen.getByRole('button', { name: /collapse/i }));

			expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
		});

		it('shows cards when expanded', async () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			// Collapse
			await fireEvent.click(screen.getByRole('button', { name: /collapse/i }));
			expect(screen.queryByText('First issue')).not.toBeInTheDocument();

			// Expand
			await fireEvent.click(screen.getByRole('button', { name: /expand/i }));
			expect(screen.getByText('First issue')).toBeInTheDocument();
		});
	});

	describe('interaction', () => {
		it('calls oncardclick when card is clicked', async () => {
			const onCardClick = vi.fn();
			render(KanbanColumn, {
				props: { status: 'open', issues: mockIssues, oncardclick: onCardClick }
			});

			await fireEvent.click(screen.getByText('First issue'));

			expect(onCardClick).toHaveBeenCalledWith(mockIssues[0]);
		});
	});

	describe('drop zone', () => {
		it('shows drop indicator when dragover', async () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			const column = screen.getByRole('listbox');
			await fireEvent.dragEnter(column);

			expect(column.className).toMatch(/ring-|border-|bg-/);
		});

		it('calls ondrop with status when item dropped', async () => {
			const onDrop = vi.fn();
			render(KanbanColumn, { props: { status: 'in_progress', issues: [], ondrop: onDrop } });

			const column = screen.getByRole('listbox');
			await fireEvent.drop(column, {
				dataTransfer: { getData: () => JSON.stringify(mockIssues[0]) }
			});

			expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ id: 'TEST-1' }), 'in_progress');
		});
	});

	describe('accessibility', () => {
		it('has role="listbox"', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('listbox has aria-label', () => {
			render(KanbanColumn, { props: { status: 'open', issues: mockIssues } });

			const listbox = screen.getByRole('listbox');
			expect(listbox).toHaveAttribute('aria-label');
		});
	});
});
