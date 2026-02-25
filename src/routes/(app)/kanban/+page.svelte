<script lang="ts">
	/**
	 * Kanban Board Page - Kanban view of issues
	 * @component
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import FilterPanel from '$lib/components/issues/FilterPanel.svelte';
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

	const store = appStore;

	// Local state - initialize from server data
	let loading = $state(false);
	let error = $state<string | null>(data.error || null);
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

	// Convert Issue to KanbanBoard format
	interface KanbanIssue {
		id: string;
		title: string;
		type: string;
		priority: string;
		status: string;
		assignee?: string | null;
	}

	const kanbanIssues = $derived(
		issues.map(
			(issue): KanbanIssue => ({
				id: issue.id,
				title: issue.title,
				type: issue.issue_type,
				priority: `P${issue.priority}`,
				status: issue.status,
				assignee: issue.assignee
			})
		)
	);

	// Filter state for FilterPanel
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
		}

		// Start watching for changes
		store.startWatching({ pollingInterval: 10000 });

		return () => {
			store.stopWatching();
		};
	});

	function updateURL(newFilter: IssueFilter) {
		if (!browser) return;
		const url = buildFilterURL('/kanban', newFilter);
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

	function handleCardClick(kanbanIssue: KanbanIssue) {
		const issue = issues.find((i) => i.id === kanbanIssue.id);
		if (issue) {
			store.openDetailModal(issue);
		}
	}

	async function handleStatusChange(kanbanIssue: KanbanIssue, newStatus: string) {
		try {
			await store.update(kanbanIssue.id, { status: newStatus } as { title?: string });
		} catch (e) {
			console.error('Failed to update status:', e);
		}
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
</script>

<div class="flex h-full flex-col">
	<!-- Filter panel -->
	<div class="border-b p-4 dark:border-gray-700">
		<FilterPanel
			status={filterStatus}
			issueType={filterIssueType}
			priority={filterPriority}
			assignee={filterAssignee}
			{availableStatuses}
			{availableTypes}
			{availableAssignees}
			onfilterchange={handleFilterChange}
		/>
	</div>

	<!-- Kanban board -->
	<div class="flex-1 overflow-hidden">
		{#if error}
			<div class="flex h-full flex-col items-center justify-center gap-4 text-center">
				<p class="text-red-600 dark:text-red-400">Error loading issues: {error}</p>
				<button
					type="button"
					onclick={handleRetry}
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		{:else}
			<KanbanBoard
				issues={kanbanIssues}
				statuses={availableStatuses}
				{loading}
				oncardclick={handleCardClick}
				onstatuschange={handleStatusChange}
			/>
		{/if}
	</div>
</div>
