<script lang="ts">
	/**
	 * Issues List Page - Main issues view
	 * @component
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import IssueTable from '$lib/components/issues/IssueTable.svelte';
	import FilterPanel from '$lib/components/issues/FilterPanel.svelte';
	import TextSearch from '$lib/components/issues/TextSearch.svelte';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { parseFilterFromURL, buildFilterURL } from '$lib/utils/url-state.js';
	import type { IssueFilter, Issue } from '$lib/db/types.js';

	interface Props {
		data: {
			issues: Issue[];
			statuses: string[];
			assignees: string[];
			issueTypes: string[];
			error?: string;
		};
	}

	const { data }: Props = $props();

	// Use the shared app store
	const store = appStore;

	// Local state - initialize from server data
	let loading = $state(false);
	let error = $state<string | null>(data.error || null);
	let searchValue = $state('');
	let selectedId = $state<string | null>(null);
	let availableStatuses = $state<string[]>(data.statuses);
	let availableAssignees = $state<string[]>(data.assignees);
	let availableTypes = $state<string[]>(data.issueTypes);

	// Initialize store with server-loaded data
	$effect(() => {
		if (data.issues.length > 0) {
			store.setIssues(data.issues);
		}
	});

	// Derived from store
	const issues = $derived(store.filtered);
	const filter = $derived(store.filter);

	// Filter state for FilterPanel (convert IssueFilter to array format)
	const filterStatus = $derived(
		Array.isArray(filter.status) ? filter.status : filter.status ? [filter.status] : []
	);
	const filterIssueType = $derived(
		Array.isArray(filter.issueType) ? filter.issueType : filter.issueType ? [filter.issueType] : []
	);
	const filterPriority = $derived(
		Array.isArray(filter.priority)
			? filter.priority
			: filter.priority !== undefined
				? [filter.priority]
				: []
	);
	const filterAssignee = $derived(
		Array.isArray(filter.assignee) ? filter.assignee[0] || '' : filter.assignee || ''
	);

	// Initialize filters from URL and start watching for changes
	onMount(() => {
		if (!browser) return;

		// Initialize filter from URL params
		const urlFilter = parseFilterFromURL($page.url.searchParams);
		if (Object.keys(urlFilter).length > 0) {
			store.setFilter(urlFilter);
			if (urlFilter.search) {
				searchValue = urlFilter.search;
			}
		}

		// Start watching for external changes (polling fallback, 10s interval)
		// This will refresh data when issues change externally
		store.startWatching({ pollingInterval: 10000 });

		// Cleanup on unmount
		return () => {
			store.stopWatching();
		};
	});

	function updateURL(newFilter: IssueFilter) {
		if (!browser) return;
		const url = buildFilterURL('/', newFilter);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleFilterChange(filters: {
		status: string[];
		issueType: string[];
		priority: number[];
		assignee: string;
		search: string;
	}) {
		const newFilter: IssueFilter = {};

		if (filters.status.length > 0) {
			newFilter.status = filters.status;
		}
		if (filters.issueType.length > 0) {
			newFilter.issueType = filters.issueType;
		}
		if (filters.priority.length > 0) {
			newFilter.priority = filters.priority;
		}
		if (filters.assignee) {
			newFilter.assignee = filters.assignee;
		}
		if (filters.search) {
			newFilter.search = filters.search;
		}

		store.setFilter(newFilter);
		updateURL(newFilter);
	}

	function handleSearch(query: string) {
		searchValue = query;
		const newFilter = { ...filter, search: query || undefined };
		store.setFilter(newFilter);
		updateURL(newFilter);
	}

	function handleSelect(id: string) {
		selectedId = id;
	}

	async function handleRetry() {
		loading = true;
		error = null;
		try {
			await store.load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load issues';
		} finally {
			loading = false;
		}
	}

	// Computed empty state
	const showNoIssues = $derived(!loading && !error && store.issues.length === 0);
	const showNoMatches = $derived(
		!loading && !error && store.issues.length > 0 && issues.length === 0
	);
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<!-- Header with search and filters -->
	<div class="flex items-center gap-4">
		<div class="w-64">
			<TextSearch value={searchValue} onsearch={handleSearch} {loading} />
		</div>
		<FilterPanel
			status={filterStatus}
			issueType={filterIssueType}
			priority={filterPriority}
			assignee={filterAssignee}
			search={searchValue}
			{availableStatuses}
			{availableTypes}
			{availableAssignees}
			onfilterchange={handleFilterChange}
		/>
	</div>

	<!-- Content area -->
	<div class="flex-1 overflow-auto">
		{#if loading}
			<div data-testid="loading-skeleton" class="space-y-2">
				{#each { length: 5 } as _, i (i)}
					<div class="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
				{/each}
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center gap-4 py-12 text-center">
				<p class="text-red-600 dark:text-red-400">Error loading issues: {error}</p>
				<button
					type="button"
					onclick={handleRetry}
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		{:else if showNoIssues}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-gray-500 dark:text-gray-400">No issues found. Create your first issue!</p>
			</div>
		{:else if showNoMatches}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-gray-500 dark:text-gray-400">
					No matches found. Try adjusting your filters.
				</p>
			</div>
		{:else}
			<IssueTable {issues} {loading} {selectedId} onselect={handleSelect} onretry={handleRetry} />
		{/if}
	</div>
</div>
