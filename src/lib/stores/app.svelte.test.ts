/**
 * App Store Tests
 * @module stores/app.svelte.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppStore } from './app.svelte.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/index.js';
import type { Issue } from '$lib/db/types.js';

// Mock toast store
vi.mock('./toast.svelte.js', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn()
	}
}));

import { toastStore } from './toast.svelte.js';

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'TEST-1',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 3,
		issue_type: 'task',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		...overrides
	};
}

function createMockDAL(): DataAccessLayer {
	return {
		getIssues: vi.fn().mockResolvedValue([]),
		getIssue: vi.fn().mockResolvedValue(null),
		getStatuses: vi.fn().mockResolvedValue(['open', 'in_progress', 'done']),
		getAssignees: vi.fn().mockResolvedValue([]),
		getIssueTypes: vi.fn().mockResolvedValue(['task', 'bug', 'feature']),
		close: vi.fn()
	} as unknown as DataAccessLayer;
}

function createMockSupervisor(): ProcessSupervisor {
	return {
		execute: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
		spawn: vi.fn()
	} as unknown as ProcessSupervisor;
}

describe('AppStore', () => {
	let store: AppStore;
	let mockDAL: DataAccessLayer;
	let mockSupervisor: ProcessSupervisor;

	beforeEach(() => {
		store = new AppStore();
		mockDAL = createMockDAL();
		mockSupervisor = createMockSupervisor();
		store.reset({ dal: mockDAL, supervisor: mockSupervisor });
		vi.clearAllMocks();
	});

	describe('Modal State', () => {
		it('createModalOpen starts as false', () => {
			expect(store.createModalOpen).toBe(false);
		});

		it('openCreateModal sets createModalOpen to true', () => {
			store.openCreateModal();
			expect(store.createModalOpen).toBe(true);
		});

		it('closeCreateModal sets createModalOpen to false', () => {
			store.openCreateModal();
			store.closeCreateModal();
			expect(store.createModalOpen).toBe(false);
		});

		it('issueDetailModalOpen starts as false', () => {
			expect(store.issueDetailModalOpen).toBe(false);
		});

		it('openDetailModal sets issue and opens modal', () => {
			const issue = createMockIssue();
			store.openDetailModal(issue);
			expect(store.issueDetailModalOpen).toBe(true);
			expect(store.selectedIssueForDetail).toEqual(issue);
		});

		it('closeDetailModal clears issue and closes modal', () => {
			const issue = createMockIssue();
			store.openDetailModal(issue);
			store.closeDetailModal();
			expect(store.issueDetailModalOpen).toBe(false);
			expect(store.selectedIssueForDetail).toBeNull();
		});
	});

	describe('Loading Issues', () => {
		it('load() fetches issues from DAL', async () => {
			const issues = [createMockIssue()];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			await store.load();

			expect(mockDAL.getIssues).toHaveBeenCalled();
			expect(store.issues).toEqual(issues);
		});

		it('load() sets loading state', async () => {
			vi.mocked(mockDAL.getIssues).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 10))
			);

			const loadPromise = store.load();
			expect(store.loading).toBe(true);

			await loadPromise;
			expect(store.loading).toBe(false);
		});
	});

	describe('Filtering', () => {
		it('filtered returns all issues when no filter', async () => {
			const issues = [createMockIssue({ id: '1' }), createMockIssue({ id: '2' })];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			await store.load();

			expect(store.filtered).toEqual(issues);
		});

		it('setFilter updates filter state', () => {
			store.setFilter({ status: 'open' });
			expect(store.filter).toEqual({ status: 'open' });
		});

		it('filtered applies status filter', async () => {
			const issues = [
				createMockIssue({ id: '1', status: 'open' }),
				createMockIssue({ id: '2', status: 'done' })
			];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			await store.load();
			store.setFilter({ status: 'open' });

			expect(store.filtered).toHaveLength(1);
			expect(store.filtered[0]?.id).toBe('1');
		});

		it('filtered applies search filter', async () => {
			const issues = [
				createMockIssue({ id: '1', title: 'Fix bug' }),
				createMockIssue({ id: '2', title: 'Add feature' })
			];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(issues);

			await store.load();
			store.setFilter({ search: 'bug' });

			expect(store.filtered).toHaveLength(1);
			expect(store.filtered[0]?.id).toBe('1');
		});
	});

	describe('Creating Issues', () => {
		it('create() calls supervisor with correct args', async () => {
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: 'Created issue: TEST-NEW',
				stderr: ''
			});
			vi.mocked(mockDAL.getIssue).mockResolvedValue(createMockIssue({ id: 'TEST-NEW' }));

			await store.create({
				title: 'New Issue',
				issue_type: 'bug',
				priority: 2
			});

			expect(mockSupervisor.execute).toHaveBeenCalledWith('bd', [
				'create',
				'--title',
				'New Issue',
				'--type',
				'bug',
				'--priority',
				'2'
			]);
		});

		it('create() adds issue to store on success', async () => {
			const newIssue = createMockIssue({ id: 'TEST-NEW', title: 'New Issue' });
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: 'Created issue: TEST-NEW',
				stderr: ''
			});
			vi.mocked(mockDAL.getIssue).mockResolvedValue(newIssue);

			const result = await store.create({
				title: 'New Issue',
				issue_type: 'task'
			});

			expect(result).toEqual(newIssue);
			expect(store.issues).toContainEqual(newIssue);
		});

		it('create() shows success toast', async () => {
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: 'Created issue: TEST-NEW',
				stderr: ''
			});
			vi.mocked(mockDAL.getIssue).mockResolvedValue(createMockIssue({ id: 'TEST-NEW' }));

			await store.create({ title: 'Test', issue_type: 'task' });

			expect(toastStore.success).toHaveBeenCalledWith('Created issue TEST-NEW');
		});

		it('create() shows error toast on failure', async () => {
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 1,
				stdout: '',
				stderr: 'Failed to create'
			});

			await expect(store.create({ title: 'Test', issue_type: 'task' })).rejects.toThrow();

			expect(toastStore.error).toHaveBeenCalled();
		});
	});

	describe('Updating Issues', () => {
		it('update() performs optimistic update', async () => {
			const issue = createMockIssue({ id: '1', title: 'Old Title' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([issue]);
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: '',
				stderr: ''
			});

			await store.load();
			await store.update('1', { title: 'New Title' });

			expect(store.issues[0]?.title).toBe('New Title');
		});

		it('update() rolls back on failure', async () => {
			const issue = createMockIssue({ id: '1', title: 'Old Title' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([issue]);
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 1,
				stdout: '',
				stderr: 'Failed'
			});

			await store.load();

			await expect(store.update('1', { title: 'New Title' })).rejects.toThrow();

			expect(store.issues[0]?.title).toBe('Old Title');
		});
	});

	describe('Deleting Issues', () => {
		it('delete() removes issue from store', async () => {
			const issue = createMockIssue({ id: '1' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([issue]);
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: '',
				stderr: ''
			});

			await store.load();
			await store.delete('1');

			expect(store.issues).toHaveLength(0);
		});

		it('delete() calls bd close command', async () => {
			const issue = createMockIssue({ id: '1' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([issue]);
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: '',
				stderr: ''
			});

			await store.load();
			await store.delete('1');

			expect(mockSupervisor.execute).toHaveBeenCalledWith('bd', ['close', '1']);
		});

		it('delete() rolls back on failure', async () => {
			const issue = createMockIssue({ id: '1' });
			vi.mocked(mockDAL.getIssues).mockResolvedValue([issue]);
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 1,
				stdout: '',
				stderr: 'Failed'
			});

			await store.load();

			await expect(store.delete('1')).rejects.toThrow();

			expect(store.issues).toHaveLength(1);
		});
	});

	describe('Metadata Methods', () => {
		it('getStatuses() returns available statuses', async () => {
			vi.mocked(mockDAL.getStatuses).mockResolvedValue(['open', 'closed']);

			const result = await store.getStatuses();

			expect(result).toEqual(['open', 'closed']);
		});

		it('getAssignees() returns available assignees', async () => {
			vi.mocked(mockDAL.getAssignees).mockResolvedValue(['alice', 'bob']);

			const result = await store.getAssignees();

			expect(result).toEqual(['alice', 'bob']);
		});

		it('getIssueTypes() returns available types', async () => {
			vi.mocked(mockDAL.getIssueTypes).mockResolvedValue(['task', 'bug']);

			const result = await store.getIssueTypes();

			expect(result).toEqual(['task', 'bug']);
		});
	});

	describe('Subscription', () => {
		it('subscribe() adds listener', () => {
			const listener = vi.fn();
			store.subscribe(listener);

			// Create should notify listeners
			vi.mocked(mockSupervisor.execute).mockResolvedValue({
				exitCode: 0,
				stdout: 'Created issue: TEST-1',
				stderr: ''
			});
			vi.mocked(mockDAL.getIssue).mockResolvedValue(createMockIssue());

			// Trigger a change that notifies listeners
			store.create({ title: 'Test', issue_type: 'task' });

			// Wait for async operation
			return new Promise<void>((resolve) => {
				setTimeout(() => {
					expect(listener).toHaveBeenCalled();
					resolve();
				}, 10);
			});
		});

		it('unsubscribe removes listener', () => {
			const listener = vi.fn();
			const unsubscribe = store.subscribe(listener);

			unsubscribe();

			// Make a change
			store.setFilter({ status: 'open' });

			// Listener should not be called after unsubscribe
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('Real-time Watching', () => {
		it('isWatching starts as false', () => {
			expect(store.isWatching).toBe(false);
		});

		it('startWatching sets isWatching to true', () => {
			store.startWatching({ pollingInterval: 10000 });
			expect(store.isWatching).toBe(true);
			store.stopWatching();
		});

		it('stopWatching sets isWatching to false', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.stopWatching();
			expect(store.isWatching).toBe(false);
		});

		it('startWatching is idempotent', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.startWatching({ pollingInterval: 10000 }); // Should not throw
			expect(store.isWatching).toBe(true);
			store.stopWatching();
		});

		it('reset() stops watching', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.reset({ dal: mockDAL, supervisor: mockSupervisor });
			expect(store.isWatching).toBe(false);
		});
	});
});
