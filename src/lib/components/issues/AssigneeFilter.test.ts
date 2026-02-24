/**
 * AssigneeFilter Component Tests
 * @module components/issues/AssigneeFilter.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AssigneeFilter from './AssigneeFilter.svelte';

const mockUsers = ['alice', 'bob', 'charlie', 'david'];

describe('AssigneeFilter', () => {
	describe('rendering', () => {
		it('renders assignee combobox', () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			expect(screen.getByRole('combobox')).toBeInTheDocument();
		});

		it('shows placeholder when no value', () => {
			render(AssigneeFilter, { props: { users: mockUsers, placeholder: 'Select assignee' } });

			expect(screen.getByPlaceholderText('Select assignee')).toBeInTheDocument();
		});

		it('shows selected value in placeholder', () => {
			render(AssigneeFilter, { props: { users: mockUsers, value: 'alice' } });

			expect(screen.getByPlaceholderText('alice')).toBeInTheDocument();
		});
	});

	describe('dropdown', () => {
		it('opens dropdown on focus', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('shows all users in dropdown', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			for (const user of mockUsers) {
				expect(screen.getByRole('option', { name: user })).toBeInTheDocument();
			}
		});

		it('filters users as user types', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'al' } });

			expect(screen.getByRole('option', { name: /alice/i })).toBeInTheDocument();
			expect(screen.queryByRole('option', { name: 'bob' })).not.toBeInTheDocument();
		});

		it('shows "No matches" when filter yields no results', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'xyz' } });

			expect(screen.getByText('No matches found')).toBeInTheDocument();
		});

		it('highlights matching text in suggestions', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'li' } });

			const option = screen.getByRole('option', { name: /alice/i });
			expect(option.innerHTML).toContain('<mark>li</mark>');
		});
	});

	describe('special options', () => {
		it('includes "Me" option when currentUser is set', async () => {
			render(AssigneeFilter, { props: { users: mockUsers, currentUser: 'alice' } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getByRole('option', { name: 'Me' })).toBeInTheDocument();
		});

		it('does not include "Me" option when currentUser is not set', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.queryByRole('option', { name: 'Me' })).not.toBeInTheDocument();
		});

		it('includes "Unassigned" option', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument();
		});

		it('includes "Any" option to clear filter', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getByRole('option', { name: 'Any' })).toBeInTheDocument();
		});

		it('"Me" resolves to current user', async () => {
			const onChange = vi.fn();
			render(AssigneeFilter, {
				props: { users: mockUsers, currentUser: 'alice', onchange: onChange }
			});

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.click(screen.getByRole('option', { name: 'Me' }));

			expect(onChange).toHaveBeenCalledWith('alice');
		});
	});

	describe('selection', () => {
		it('selects user on click', async () => {
			const onChange = vi.fn();
			render(AssigneeFilter, { props: { users: mockUsers, onchange: onChange } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.click(screen.getByRole('option', { name: 'bob' }));

			expect(onChange).toHaveBeenCalledWith('bob');
		});

		it('selects user on Enter', async () => {
			const onChange = vi.fn();
			render(AssigneeFilter, { props: { users: mockUsers, onchange: onChange } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

			expect(onChange).toHaveBeenCalled();
		});

		it('closes dropdown after selection', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.click(screen.getByRole('option', { name: 'bob' }));

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('clears filter when "Any" selected', async () => {
			const onChange = vi.fn();
			render(AssigneeFilter, { props: { users: mockUsers, value: 'alice', onchange: onChange } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.click(screen.getByRole('option', { name: 'Any' }));

			expect(onChange).toHaveBeenCalledWith(null);
		});
	});

	describe('keyboard navigation', () => {
		it('Arrow keys navigate options', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });

			// First option should be highlighted
			const options = screen.getAllByRole('option');
			expect(options[0]).toHaveClass('highlighted');

			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
			expect(options[1]).toHaveClass('highlighted');

			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
			expect(options[0]).toHaveClass('highlighted');
		});

		it('Escape closes dropdown', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			expect(screen.getByRole('listbox')).toBeInTheDocument();

			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	describe('clear button', () => {
		it('shows clear button when value is set', () => {
			render(AssigneeFilter, { props: { users: mockUsers, value: 'alice' } });

			expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
		});

		it('does not show clear button when no value', () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
		});

		it('clears value when clear button clicked', async () => {
			const onChange = vi.fn();
			render(AssigneeFilter, { props: { users: mockUsers, value: 'alice', onchange: onChange } });

			await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

			expect(onChange).toHaveBeenCalledWith(null);
		});
	});

	describe('accessibility', () => {
		it('has role="combobox"', () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			expect(screen.getByRole('combobox')).toBeInTheDocument();
		});

		it('options have role="option"', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
		});

		it('has aria-expanded when open', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			const combobox = screen.getByRole('combobox');
			expect(combobox).toHaveAttribute('aria-expanded', 'false');

			await fireEvent.focus(combobox);
			expect(combobox).toHaveAttribute('aria-expanded', 'true');
		});

		it('has aria-activedescendant when navigating', async () => {
			render(AssigneeFilter, { props: { users: mockUsers } });

			await fireEvent.focus(screen.getByRole('combobox'));
			await fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });

			expect(screen.getByRole('combobox')).toHaveAttribute(
				'aria-activedescendant',
				expect.stringContaining('option-')
			);
		});

		it('selected option has aria-selected="true"', async () => {
			render(AssigneeFilter, { props: { users: mockUsers, value: 'alice' } });

			await fireEvent.focus(screen.getByRole('combobox'));

			expect(screen.getByRole('option', { name: 'alice' })).toHaveAttribute(
				'aria-selected',
				'true'
			);
		});
	});
});
