<script lang="ts">
	/**
	 * FilterPanel - Multi-faceted issue filtering component
	 * @component
	 */
	import { PRIORITY_OPTIONS, STATUS_OPTIONS, ISSUE_TYPE_OPTIONS } from '$lib/db/types.js';

	interface FilterState {
		status: string[];
		issueType: string[];
		priority: number[];
		assignee: string;
		search: string;
	}

	interface Props {
		status?: string[];
		issueType?: string[];
		priority?: number[];
		assignee?: string;
		search?: string;
		searchPlaceholder?: string;
		availableStatuses?: string[];
		availableTypes?: string[];
		availableAssignees?: string[];
		onfilterchange?: (filters: FilterState) => void;
	}

	let {
		status = [],
		issueType = [],
		priority = [],
		assignee = '',
		search = '',
		searchPlaceholder = 'Search issues...',
		availableStatuses = STATUS_OPTIONS.map((s) => s.value),
		availableTypes = ISSUE_TYPE_OPTIONS.map((t) => t.value),
		availableAssignees = [],
		onfilterchange
	}: Props = $props();

	// Local state for search with debounce - derived from prop but writable for user input
	let searchValue = $derived.by(() => search);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Dropdown open states
	let statusOpen = $state(false);
	let typeOpen = $state(false);
	let priorityOpen = $state(false);
	let assigneeOpen = $state(false);

	// Use global priority options (includes P0)
	const priorityOptions = PRIORITY_OPTIONS;

	// Check if any filters are active
	const hasActiveFilters = $derived(
		status.length > 0 ||
			issueType.length > 0 ||
			priority.length > 0 ||
			assignee !== '' ||
			search !== ''
	);

	function emitFilterChange(updates: Partial<FilterState>) {
		onfilterchange?.({
			status,
			issueType,
			priority,
			assignee,
			search,
			...updates
		});
	}

	function handleSearchInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		searchValue = value;

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(() => {
			emitFilterChange({ search: value });
		}, 300);
	}

	function toggleStatus(statusValue: string) {
		const newStatus = status.includes(statusValue)
			? status.filter((s) => s !== statusValue)
			: [...status, statusValue];
		emitFilterChange({ status: newStatus });
	}

	function toggleType(typeValue: string) {
		const newType = issueType.includes(typeValue)
			? issueType.filter((t) => t !== typeValue)
			: [...issueType, typeValue];
		emitFilterChange({ issueType: newType });
	}

	function togglePriority(priorityValue: number) {
		const newPriority = priority.includes(priorityValue)
			? priority.filter((p) => p !== priorityValue)
			: [...priority, priorityValue];
		emitFilterChange({ priority: newPriority });
	}

	function selectAssignee(assigneeValue: string) {
		emitFilterChange({ assignee: assigneeValue });
		assigneeOpen = false;
	}

	function removeStatusFilter(statusValue: string) {
		emitFilterChange({ status: status.filter((s) => s !== statusValue) });
	}

	function removeTypeFilter(typeValue: string) {
		emitFilterChange({ issueType: issueType.filter((t) => t !== typeValue) });
	}

	function removePriorityFilter(priorityValue: number) {
		emitFilterChange({ priority: priority.filter((p) => p !== priorityValue) });
	}

	function removeAssigneeFilter() {
		emitFilterChange({ assignee: '' });
	}

	function clearAllFilters() {
		searchValue = '';
		onfilterchange?.({
			status: [],
			issueType: [],
			priority: [],
			assignee: '',
			search: ''
		});
	}

	function closeDropdowns(except?: string) {
		if (except !== 'status') statusOpen = false;
		if (except !== 'type') typeOpen = false;
		if (except !== 'priority') priorityOpen = false;
		if (except !== 'assignee') assigneeOpen = false;
	}
</script>

<div
	data-testid="filter-panel"
	class="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
>
	<!-- Search -->
	<div class="min-w-[200px] flex-1">
		<label for="filter-search" class="sr-only">Search</label>
		<input
			id="filter-search"
			type="search"
			role="searchbox"
			aria-label="Search issues"
			value={searchValue}
			oninput={handleSearchInput}
			placeholder={searchPlaceholder}
			class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
		/>
	</div>

	<!-- Status Filter -->
	<div class="relative">
		<label for="status-filter" class="sr-only">Status</label>
		<button
			id="status-filter"
			type="button"
			aria-label="Status"
			aria-expanded={statusOpen}
			onclick={() => {
				closeDropdowns('status');
				statusOpen = !statusOpen;
			}}
			class="rounded-md border bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
		>
			Status {status.length > 0 ? `(${status.length})` : ''}
		</button>
		{#if statusOpen}
			<div
				class="absolute z-50 mt-1 w-48 rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
			>
				{#each availableStatuses as statusOption (statusOption)}
					<button
						type="button"
						onclick={() => toggleStatus(statusOption)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
					>
						<span
							class="flex h-4 w-4 items-center justify-center rounded border {status.includes(
								statusOption
							)
								? 'border-blue-500 bg-blue-500'
								: ''}"
						>
							{#if status.includes(statusOption)}
								<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</span>
						{statusOption}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Type Filter -->
	<div class="relative">
		<label for="type-filter" class="sr-only">Type</label>
		<button
			id="type-filter"
			type="button"
			aria-label="Type"
			aria-expanded={typeOpen}
			onclick={() => {
				closeDropdowns('type');
				typeOpen = !typeOpen;
			}}
			class="rounded-md border bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
		>
			Type {issueType.length > 0 ? `(${issueType.length})` : ''}
		</button>
		{#if typeOpen}
			<div
				class="absolute z-50 mt-1 w-48 rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
			>
				{#each availableTypes as typeOption (typeOption)}
					<button
						type="button"
						onclick={() => toggleType(typeOption)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
					>
						<span
							class="flex h-4 w-4 items-center justify-center rounded border {issueType.includes(
								typeOption
							)
								? 'border-blue-500 bg-blue-500'
								: ''}"
						>
							{#if issueType.includes(typeOption)}
								<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</span>
						{typeOption}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Priority Filter -->
	<div class="relative">
		<label for="priority-filter" class="sr-only">Priority</label>
		<button
			id="priority-filter"
			type="button"
			aria-label="Priority"
			aria-expanded={priorityOpen}
			onclick={() => {
				closeDropdowns('priority');
				priorityOpen = !priorityOpen;
			}}
			class="rounded-md border bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
		>
			Priority {priority.length > 0 ? `(${priority.length})` : ''}
		</button>
		{#if priorityOpen}
			<div
				class="absolute z-50 mt-1 w-48 rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
			>
				{#each priorityOptions as { value, label } (value)}
					<button
						type="button"
						onclick={() => togglePriority(value)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
					>
						<span
							class="flex h-4 w-4 items-center justify-center rounded border {priority.includes(
								value
							)
								? 'border-blue-500 bg-blue-500'
								: ''}"
						>
							{#if priority.includes(value)}
								<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</span>
						{label}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Assignee Filter -->
	<div class="relative">
		<label for="assignee-filter" class="sr-only">Assignee</label>
		<button
			id="assignee-filter"
			type="button"
			aria-label="Assignee"
			aria-expanded={assigneeOpen}
			onclick={() => {
				closeDropdowns('assignee');
				assigneeOpen = !assigneeOpen;
			}}
			class="rounded-md border bg-white px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
		>
			{assignee || 'Assignee'}
		</button>
		{#if assigneeOpen}
			<div
				class="absolute z-50 mt-1 max-h-48 w-48 overflow-y-auto rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
			>
				<button
					type="button"
					onclick={() => selectAssignee('')}
					class="w-full px-3 py-2 text-left text-gray-400 italic hover:bg-gray-100 dark:hover:bg-gray-600"
				>
					Any
				</button>
				{#each availableAssignees as assigneeOption (assigneeOption)}
					<button
						type="button"
						onclick={() => selectAssignee(assigneeOption)}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
					>
						{assigneeOption}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Clear All Button -->
	{#if hasActiveFilters}
		<button
			type="button"
			onclick={clearAllFilters}
			class="rounded-md px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
		>
			Clear all
		</button>
	{/if}
</div>

<!-- Active Filter Badges -->
{#if hasActiveFilters}
	<div class="mt-2 flex flex-wrap gap-2 px-4">
		{#each status as s (s)}
			<span
				data-testid="filter-badge"
				class="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
			>
				{s}
				<button
					type="button"
					onclick={() => removeStatusFilter(s)}
					class="hover:text-blue-600 dark:hover:text-blue-100"
					aria-label="Remove {s} filter"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</span>
		{/each}
		{#each issueType as t (t)}
			<span
				data-testid="filter-badge"
				class="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-sm text-purple-800 dark:bg-purple-900 dark:text-purple-200"
			>
				{t}
				<button
					type="button"
					onclick={() => removeTypeFilter(t)}
					class="hover:text-purple-600 dark:hover:text-purple-100"
					aria-label="Remove {t} filter"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</span>
		{/each}
		{#each priority as p (p)}
			<span
				data-testid="filter-badge"
				class="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200"
			>
				P{p}
				<button
					type="button"
					onclick={() => removePriorityFilter(p)}
					class="hover:text-amber-600 dark:hover:text-amber-100"
					aria-label="Remove P{p} filter"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</span>
		{/each}
		{#if assignee}
			<span
				data-testid="filter-badge"
				class="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200"
			>
				{assignee}
				<button
					type="button"
					onclick={removeAssigneeFilter}
					class="hover:text-green-600 dark:hover:text-green-100"
					aria-label="Remove assignee filter"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</span>
		{/if}
	</div>
{/if}
