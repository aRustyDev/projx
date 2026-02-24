<script lang="ts">
	/**
	 * StatusDropdown - Inline status change dropdown
	 * @component
	 */
	import { STATUS_COLORS } from './types.js';

	interface Props {
		status: string;
		statuses: string[];
		loading?: boolean;
		error?: string | null;
		disabled?: boolean;
		onchange?: (status: string) => void;
	}

	let {
		status,
		statuses,
		loading = false,
		error = null,
		disabled = false,
		onchange
	}: Props = $props();

	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	let dropdownElement: HTMLDivElement;
	let buttonElement: HTMLButtonElement;

	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			highlightedIndex = statuses.indexOf(status);
		}
	}

	function selectStatus(newStatus: string) {
		onchange?.(newStatus);
		isOpen = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (!isOpen) {
				toggle();
			} else {
				const selectedStatus = statuses[highlightedIndex];
				if (highlightedIndex >= 0 && selectedStatus) {
					selectStatus(selectedStatus);
				}
			}
		} else if (event.key === 'Escape') {
			isOpen = false;
			buttonElement?.focus();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!isOpen) {
				toggle();
			} else {
				highlightedIndex = Math.min(highlightedIndex + 1, statuses.length - 1);
				if (highlightedIndex < 0) highlightedIndex = 0;
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function getStatusColor(s: string): string {
		return STATUS_COLORS[s] ?? 'text-gray-500';
	}

	// Handle click outside
	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="relative inline-block" bind:this={dropdownElement}>
	<button
		bind:this={buttonElement}
		type="button"
		onclick={toggle}
		onkeydown={handleKeyDown}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-disabled={disabled}
		{disabled}
		class="rounded px-2 py-1 text-sm font-medium transition-colors {getStatusColor(
			status
		)} {disabled
			? 'cursor-not-allowed opacity-50'
			: 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}"
	>
		{#if loading}
			<span data-testid="status-loading" class="inline-flex items-center gap-1">
				<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				{status}
			</span>
		{:else}
			{status}
		{/if}
	</button>

	{#if error}
		<div
			class="absolute z-20 mt-1 rounded border border-red-200 bg-red-50 p-2 text-sm whitespace-nowrap text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
		>
			{error}
		</div>
	{/if}

	{#if isOpen}
		<div
			role="listbox"
			aria-label="Select status"
			onkeydown={handleKeyDown}
			tabindex="-1"
			class="absolute z-10 mt-1 max-h-60 w-40 overflow-auto rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			{#each statuses as s, index (s)}
				<button
					type="button"
					role="option"
					aria-selected={s === status}
					data-highlighted={index === highlightedIndex}
					onclick={() => selectStatus(s)}
					onmouseenter={() => (highlightedIndex = index)}
					class="w-full px-3 py-2 text-left text-sm transition-colors {getStatusColor(s)} {index ===
					highlightedIndex
						? 'bg-gray-100 dark:bg-gray-700'
						: ''} {s === status ? 'font-medium' : ''} hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					{s}
					{#if s === status}
						<span class="float-right">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
