<script lang="ts">
	/**
	 * Epics Page - Hierarchical view of epics with children
	 * @component
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import EpicsView from '$lib/components/epics/EpicsView.svelte';
	import FilterPanel from '$lib/components/issues/FilterPanel.svelte';
	import TextSearch from '$lib/components/issues/TextSearch.svelte';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { parseFilterFromURL, buildFilterURL } from '$lib/utils/url-state.js';
	import type { DataAccessLayer } from '$lib/db/types.js';
	import type { ProcessSupervisor } from '$lib/cli/types.js';
	import type { IssueFilter, Issue } from '$lib/db/types.js';

	interface Props {
		dal?: DataAccessLayer;
		supervisor?: ProcessSupervisor;
	}

	const props: Props = $props();

	// Initialize app store with injected dependencies for testing
	if (props.dal || props.supervisor) {
		appStore.reset({ dal: props.dal, supervisor: props.supervisor });
	}

	const store = appStore;

	// Local state
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchValue = $state('');
	let availableStatuses = $state<string[]>(['open', 'in_progress', 'done']);
	let availableAssignees = $state<string[]>([]);

	// Derived from store - all issues (epics will be filtered by EpicsView)
	const issues = $derived(store.filtered);
	const filter = $derived(store.filter);

	// Filter state for FilterPanel
	const filterStatus = $derived(
		Array.isArray(filter.status) ? filter.status : filter.status ? [filter.status] : []
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

	// Load initial data
	onMount(() => {
		if (!browser) return;

		(async () => {
			try {
				// Initialize filter from URL params
				const urlFilter = parseFilterFromURL($page.url.searchParams);
				if (Object.keys(urlFilter).length > 0) {
					store.setFilter(urlFilter);
					if (urlFilter.search) {
						searchValue = urlFilter.search;
					}
				}

				const [statuses, assignees] = await Promise.all([
					store.getStatuses(),
					store.getAssignees()
				]);

				availableStatuses = statuses;
				availableAssignees = assignees;

				await store.load();
				loading = false;

				store.startWatching({ pollingInterval: 10000 });
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load epics';
				loading = false;
			}
		})();

		return () => {
			store.stopWatching();
		};
	});

	function updateURL(newFilter: IssueFilter) {
		if (!browser) return;
		const url = buildFilterURL('/epics', newFilter);
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

	function handleSelect(issue: Issue) {
		store.openDetailModal(issue);
	}

	async function handleRetry() {
		loading = true;
		error = null;
		try {
			await store.load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load epics';
		} finally {
			loading = false;
		}
	}

	// Check for epics in the current issues
	const hasEpics = $derived(issues.some((i) => i.issue_type === 'epic'));
	const showNoEpics = $derived(!loading && !error && !hasEpics);
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<!-- Header with search and filters -->
	<div class="flex items-center gap-4">
		<h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Epics</h1>
		<div class="w-64">
			<TextSearch value={searchValue} onsearch={handleSearch} {loading} />
		</div>
		<FilterPanel
			status={filterStatus}
			issueType={[]}
			priority={filterPriority}
			assignee={filterAssignee}
			search={searchValue}
			{availableStatuses}
			availableTypes={[]}
			{availableAssignees}
			onfilterchange={handleFilterChange}
		/>
	</div>

	<!-- Content area -->
	<div class="flex-1 overflow-auto">
		{#if loading}
			<div data-testid="loading-skeleton" class="space-y-2">
				{#each { length: 5 } as _, i (i)}
					<div class="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
				{/each}
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center gap-4 py-12 text-center">
				<p class="text-red-600 dark:text-red-400">Error loading epics: {error}</p>
				<button
					type="button"
					onclick={handleRetry}
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		{:else if showNoEpics}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-gray-500 dark:text-gray-400">No epics found.</p>
				<p class="mt-2 text-sm text-gray-400 dark:text-gray-500">
					Create an epic to organize related issues.
				</p>
			</div>
		{:else}
			<EpicsView {issues} onselect={handleSelect} />
		{/if}
	</div>
</div>
