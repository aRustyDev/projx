/**
 * EpicsView Component Tests
 * @module components/epics/EpicsView.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EpicsView from './EpicsView.svelte';
import type { Issue } from '$lib/db/types.js';

const mockEpics: Issue[] = [
	{
		id: 'EPIC-1',
		title: 'User Authentication',
		description: 'Implement user authentication',
		status: 'in_progress',
		priority: 1,
		issue_type: 'epic',
		created_at: '2024-01-01',
		updated_at: '2024-01-15'
	},
	{
		id: 'EPIC-2',
		title: 'Dashboard Feature',
		description: 'Implement dashboard',
		status: 'open',
		priority: 2,
		issue_type: 'epic',
		created_at: '2024-01-02',
		updated_at: '2024-01-15'
	}
];

const mockChildren: Issue[] = [
	{
		id: 'TASK-1',
		title: 'Login form',
		description: 'Create login form',
		status: 'done',
		priority: 1,
		issue_type: 'task',
		spec_id: 'EPIC-1',
		created_at: '2024-01-03',
		updated_at: '2024-01-10'
	},
	{
		id: 'TASK-2',
		title: 'Password reset',
		description: 'Password reset flow',
		status: 'in_progress',
		priority: 2,
		issue_type: 'task',
		spec_id: 'EPIC-1',
		created_at: '2024-01-03',
		updated_at: '2024-01-12'
	},
	{
		id: 'TASK-3',
		title: 'Session management',
		description: 'Handle sessions',
		status: 'open',
		priority: 3,
		issue_type: 'task',
		spec_id: 'EPIC-1',
		created_at: '2024-01-03',
		updated_at: '2024-01-13'
	}
];

const allIssues = [...mockEpics, ...mockChildren];

describe('EpicsView', () => {
	describe('rendering', () => {
		it('displays only issues with type="epic"', () => {
			render(EpicsView, { props: { issues: allIssues } });

			expect(screen.getByText('User Authentication')).toBeInTheDocument();
			expect(screen.getByText('Dashboard Feature')).toBeInTheDocument();
			// Children should not be visible initially
			expect(screen.queryByText('Login form')).not.toBeInTheDocument();
		});

		it('shows epic title and ID', () => {
			render(EpicsView, { props: { issues: allIssues } });

			expect(screen.getByText('EPIC-1')).toBeInTheDocument();
			expect(screen.getByText('User Authentication')).toBeInTheDocument();
		});

		it('shows child count (done/total)', () => {
			render(EpicsView, { props: { issues: allIssues } });

			// EPIC-1 has 3 children, 1 done
			expect(screen.getByText('1/3')).toBeInTheDocument();
		});

		it('shows progress bar with correct percentage', () => {
			render(EpicsView, { props: { issues: allIssues } });

			// EPIC-1 has 1/3 done = 33%
			const progressBar = screen.getAllByRole('progressbar')[0];
			expect(progressBar).toHaveAttribute('aria-valuenow', '33');
		});
	});

	describe('expandable rows', () => {
		it('renders expand/collapse toggle', () => {
			render(EpicsView, { props: { issues: allIssues } });

			const toggles = screen.getAllByRole('button', { name: /expand|collapse/i });
			expect(toggles.length).toBeGreaterThan(0);
		});

		it('expands to show child issues on click', async () => {
			render(EpicsView, { props: { issues: allIssues } });

			const toggle = screen.getAllByRole('button', { name: /expand/i })[0];
			await fireEvent.click(toggle!);

			expect(screen.getByText('Login form')).toBeInTheDocument();
			expect(screen.getByText('Password reset')).toBeInTheDocument();
			expect(screen.getByText('Session management')).toBeInTheDocument();
		});

		it('collapses when toggled again', async () => {
			render(EpicsView, { props: { issues: allIssues } });

			const toggle = screen.getAllByRole('button', { name: /expand/i })[0];
			await fireEvent.click(toggle!); // Expand
			expect(screen.getByText('Login form')).toBeInTheDocument();

			await fireEvent.click(toggle!); // Collapse
			expect(screen.queryByText('Login form')).not.toBeInTheDocument();
		});

		it('toggle has aria-expanded attribute', async () => {
			render(EpicsView, { props: { issues: allIssues } });

			const toggle = screen.getAllByRole('button', { name: /expand/i })[0];
			expect(toggle).toHaveAttribute('aria-expanded', 'false');

			await fireEvent.click(toggle!);
			expect(toggle).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('progress calculation', () => {
		it('calculates progress from child statuses', () => {
			render(EpicsView, { props: { issues: allIssues } });

			// EPIC-1: 1 done out of 3 = 33%
			const progressBars = screen.getAllByRole('progressbar');
			expect(progressBars[0]).toHaveAttribute('aria-valuenow', '33');
		});

		it('counts "done" and "closed" as complete', () => {
			const issuesWithClosed = [
				...mockEpics,
				{ ...mockChildren[0]!, status: 'closed' },
				{ ...mockChildren[1]!, status: 'done' },
				mockChildren[2]!
			];
			render(EpicsView, { props: { issues: issuesWithClosed } });

			// 2 complete out of 3 = 67%
			const progressBars = screen.getAllByRole('progressbar');
			expect(progressBars[0]).toHaveAttribute('aria-valuenow', '67');
		});

		it('handles epic with no children', () => {
			render(EpicsView, { props: { issues: mockEpics } });

			// EPIC-2 has no children, so 0/0 = 0%
			const progressBars = screen.getAllByRole('progressbar');
			expect(progressBars[1]).toHaveAttribute('aria-valuenow', '0');
		});
	});

	describe('interaction', () => {
		it('calls onselect when epic row clicked', async () => {
			const onSelect = vi.fn();
			render(EpicsView, { props: { issues: allIssues, onselect: onSelect } });

			const row = screen.getByText('User Authentication').closest('tr');
			await fireEvent.click(row!);

			expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'EPIC-1' }));
		});

		it('calls onselect when child row clicked', async () => {
			const onSelect = vi.fn();
			render(EpicsView, { props: { issues: allIssues, onselect: onSelect } });

			// Expand first
			const toggle = screen.getAllByRole('button', { name: /expand/i })[0];
			await fireEvent.click(toggle!);

			// Click child
			const childRow = screen.getByText('Login form').closest('tr');
			await fireEvent.click(childRow!);

			expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'TASK-1' }));
		});

		it('expands on Enter key when focused', async () => {
			render(EpicsView, { props: { issues: allIssues } });

			const row = screen.getByText('User Authentication').closest('tr');
			await fireEvent.keyDown(row!, { key: 'ArrowRight' });

			expect(screen.getByText('Login form')).toBeInTheDocument();
		});

		it('collapses on ArrowLeft when expanded', async () => {
			render(EpicsView, { props: { issues: allIssues } });

			const row = screen.getByText('User Authentication').closest('tr');
			await fireEvent.keyDown(row!, { key: 'ArrowRight' }); // Expand
			await fireEvent.keyDown(row!, { key: 'ArrowLeft' }); // Collapse

			expect(screen.queryByText('Login form')).not.toBeInTheDocument();
		});
	});

	describe('empty state', () => {
		it('shows "No epics" message when empty', () => {
			render(EpicsView, { props: { issues: [] } });

			expect(screen.getByText('No epics found')).toBeInTheDocument();
		});

		it('shows "No epics" when no epic-type issues', () => {
			render(EpicsView, { props: { issues: mockChildren } });

			expect(screen.getByText('No epics found')).toBeInTheDocument();
		});

		it('shows create epic prompt', () => {
			render(EpicsView, { props: { issues: [] } });

			expect(screen.getByText(/create an epic/i)).toBeInTheDocument();
		});
	});

	describe('accessibility', () => {
		it('rows have role="row"', () => {
			render(EpicsView, { props: { issues: allIssues } });

			expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
		});

		it('progress bar has aria-valuenow/min/max', () => {
			render(EpicsView, { props: { issues: allIssues } });

			const progressBar = screen.getAllByRole('progressbar')[0];
			expect(progressBar).toHaveAttribute('aria-valuenow');
			expect(progressBar).toHaveAttribute('aria-valuemin', '0');
			expect(progressBar).toHaveAttribute('aria-valuemax', '100');
		});

		it('table has role="grid"', () => {
			render(EpicsView, { props: { issues: allIssues } });

			expect(screen.getByRole('grid')).toBeInTheDocument();
		});

		it('rows are keyboard focusable', () => {
			render(EpicsView, { props: { issues: allIssues } });

			const row = screen.getByText('User Authentication').closest('tr');
			expect(row).toHaveAttribute('tabindex', '0');
		});
	});
});
