<script lang="ts">
	/**
	 * AssigneeFilter - Autocomplete dropdown for filtering by assignee
	 * @component
	 */

	interface Props {
		value?: string;
		users: string[];
		currentUser?: string;
		placeholder?: string;
		onchange?: (value: string | null) => void;
	}

	let { value = '', users, currentUser, placeholder = 'Assignee', onchange }: Props = $props();

	let isOpen = $state(false);
	let searchTerm = $state('');
	let highlightedIndex = $state(-1);
	let inputElement: HTMLInputElement | undefined;
	let dropdownElement: HTMLDivElement | undefined;

	// Special options
	const SPECIAL_OPTIONS = [
		{ value: '__me__', label: 'Me', show: () => !!currentUser },
		{ value: '__unassigned__', label: 'Unassigned', show: () => true },
		{ value: '__any__', label: 'Any', show: () => true }
	] as const;

	// Filter users based on search term
	function getFilteredOptions(): Array<{ value: string; label: string }> {
		const options: Array<{ value: string; label: string }> = [];

		// Add special options that should show
		for (const opt of SPECIAL_OPTIONS) {
			if (opt.show() && opt.label.toLowerCase().includes(searchTerm.toLowerCase())) {
				options.push({ value: opt.value, label: opt.label });
			}
		}

		// Add filtered users
		const filteredUsers = users.filter((user) =>
			user.toLowerCase().includes(searchTerm.toLowerCase())
		);

		for (const user of filteredUsers) {
			options.push({ value: user, label: user });
		}

		return options;
	}

	function getDisplayValue(val: string): string {
		if (val === '__me__') return 'Me';
		if (val === '__unassigned__') return 'Unassigned';
		if (val === '__any__') return '';
		return val;
	}

	function selectOption(optionValue: string) {
		let newValue: string | null = optionValue;

		// Resolve special values
		if (optionValue === '__me__' && currentUser) {
			newValue = currentUser;
		} else if (optionValue === '__unassigned__') {
			newValue = '__unassigned__';
		} else if (optionValue === '__any__') {
			newValue = null;
		}

		onchange?.(newValue);
		isOpen = false;
		searchTerm = '';
	}

	function handleInputFocus() {
		isOpen = true;
		highlightedIndex = -1;
	}

	function handleInputBlur(event: FocusEvent) {
		// Don't close if clicking within the dropdown
		if (dropdownElement?.contains(event.relatedTarget as Node)) {
			return;
		}
		setTimeout(() => {
			isOpen = false;
			searchTerm = '';
		}, 150);
	}

	function handleKeyDown(event: KeyboardEvent) {
		const options = getFilteredOptions();

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					isOpen = true;
				} else {
					highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
				}
				break;

			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, 0);
				break;

			case 'Enter':
				event.preventDefault();
				if (highlightedIndex >= 0 && options[highlightedIndex]) {
					selectOption(options[highlightedIndex]!.value);
				}
				break;

			case 'Escape':
				event.preventDefault();
				isOpen = false;
				searchTerm = '';
				break;
		}
	}

	function highlightMatch(text: string, search: string): string {
		if (!search) return text;
		const regex = new RegExp(`(${search})`, 'gi');
		return text.replace(regex, '<mark>$1</mark>');
	}
</script>

<div class="assignee-filter" class:open={isOpen}>
	<div class="input-wrapper">
		<input
			bind:this={inputElement}
			bind:value={searchTerm}
			type="text"
			role="combobox"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-controls="assignee-listbox"
			aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
			aria-label="Filter by assignee"
			placeholder={value ? getDisplayValue(value) : placeholder}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
			onkeydown={handleKeyDown}
		/>
		{#if value && value !== '__any__'}
			<button
				type="button"
				class="clear-button"
				aria-label="Clear assignee filter"
				onclick={() => selectOption('__any__')}
			>
				×
			</button>
		{/if}
	</div>

	{#if isOpen}
		<div bind:this={dropdownElement} class="dropdown" role="listbox" id="assignee-listbox">
			{#each getFilteredOptions() as option, index (option.value)}
				<button
					type="button"
					id="option-{index}"
					role="option"
					class="option"
					class:highlighted={index === highlightedIndex}
					class:selected={option.value === value}
					aria-selected={option.value === value}
					onmouseenter={() => (highlightedIndex = index)}
					onclick={() => selectOption(option.value)}
				>
					{#if searchTerm}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html highlightMatch(option.label, searchTerm)}
					{:else}
						{option.label}
					{/if}
				</button>
			{:else}
				<div class="no-matches">No matches found</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.assignee-filter {
		position: relative;
		display: inline-block;
		min-width: 150px;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 4px;
		background: var(--bg-primary, white);
	}

	.assignee-filter.open .input-wrapper {
		border-color: var(--focus-color, #3b82f6);
		box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.2));
	}

	input {
		flex: 1;
		padding: 8px 12px;
		border: none;
		background: transparent;
		font: inherit;
		outline: none;
	}

	input::placeholder {
		color: var(--text-secondary, #6b7280);
	}

	.clear-button {
		padding: 4px 8px;
		background: none;
		border: none;
		color: var(--text-secondary, #6b7280);
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
	}

	.clear-button:hover {
		color: var(--text-primary, #111827);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 4px;
		background: var(--bg-primary, white);
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		max-height: 200px;
		overflow-y: auto;
		z-index: 100;
	}

	.option {
		display: block;
		width: 100%;
		padding: 8px 12px;
		text-align: left;
		background: none;
		border: none;
		font: inherit;
		cursor: pointer;
	}

	.option:hover,
	.option.highlighted {
		background: var(--bg-hover, #f3f4f6);
	}

	.option.selected {
		background: var(--bg-selected, #eff6ff);
		color: var(--text-selected, #1d4ed8);
	}

	.option :global(mark) {
		background: var(--highlight-color, #fef08a);
		color: inherit;
	}

	.no-matches {
		padding: 12px;
		text-align: center;
		color: var(--text-tertiary, #9ca3af);
		font-size: 0.875rem;
	}
</style>
