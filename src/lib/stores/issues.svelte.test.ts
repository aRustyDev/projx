/**
 * IssueStore Tests
 * @module stores/issues.svelte.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IssueStore, createIssueStore } from './issues.svelte.js';
import type { Issue } from '$lib/db/types.js';
import type { DataAccessLayer } from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/index.js';

// Mock issue factory
function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'test-1',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: '2026-02-24T00:00:00Z',
		updated_at: '2026-02-24T00:00:00Z',
		...overrides
	};
}

// Mock DAL factory
function createMockDAL(overrides: Partial<DataAccessLayer> = {}): DataAccessLayer {
	return {
		getIssues: vi.fn().mockResolvedValue([]),
		getIssue: vi.fn().mockResolvedValue(null),
		getDependencies: vi.fn().mockResolvedValue([]),
		getComments: vi.fn().mockResolvedValue([]),
		getLabels: vi.fn().mockResolvedValue([]),
		getStatuses: vi.fn().mockResolvedValue(['open', 'in_progress', 'done']),
		getAssignees: vi.fn().mockResolvedValue([]),
		getIssueTypes: vi.fn().mockResolvedValue(['task', 'bug', 'epic']),
		getIssueCount: vi.fn().mockResolvedValue(0),
		getBackend: vi.fn().mockReturnValue('sqlite'),
		query: vi.fn().mockResolvedValue({ rows: [], duration: 0 }),
		close: vi.fn().mockResolvedValue(undefined),
		...overrides
	} as unknown as DataAccessLayer;
}

// Mock ProcessSupervisor factory
function createMockSupervisor(overrides: Partial<ProcessSupervisor> = {}): ProcessSupervisor {
	return {
		execute: vi.fn().mockResolvedValue({
			exitCode: 0,
			stdout: '',
			stderr: '',
			duration: 100,
			timedOut: false
		}),
		getCircuitState: vi.fn().mockReturnValue('closed'),
		getStats: vi
			.fn()
			.mockReturnValue({ active: 0, queued: 0, circuitState: 'closed', failures: 0 }),
		on: vi.fn(),
		off: vi.fn(),
		resetCircuit: vi.fn(),
		clearQueue: vi.fn(),
		...overrides
	} as unknown as ProcessSupervisor;
}

describe('IssueStore', () => {
	let store: IssueStore;
	let mockDAL: DataAccessLayer;
	let mockSupervisor: ProcessSupervisor;

	beforeEach(() => {
		mockDAL = createMockDAL();
		mockSupervisor = createMockSupervisor();
		store = createIssueStore({ dal: mockDAL, supervisor: mockSupervisor });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Initialization', () => {
		it('initializes with empty issues array', () => {
			expect(store.issues).toEqual([]);
		});

		it('initializes with empty filter', () => {
			expect(store.filter).toEqual({});
		});

		it('initializes with null selectedId', () => {
			expect(store.selectedId).toBeNull();
		});
	});

	describe('Loading', () => {
		it('load() fetches issues from Data Access Layer', async () => {
			const mockIssues = [createMockIssue({ id: 'test-1' }), createMockIssue({ id: 'test-2' })];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(mockIssues);

			await store.load();

			expect(mockDAL.getIssues).toHaveBeenCalled();
		});

		it('load() updates issues state', async () => {
			const mockIssues = [createMockIssue({ id: 'test-1' })];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(mockIssues);

			await store.load();

			expect(store.issues).toEqual(mockIssues);
		});

		it('load() handles errors gracefully', async () => {
			vi.mocked(mockDAL.getIssues).mockRejectedValue(new Error('DB error'));

			await expect(store.load()).rejects.toThrow('DB error');
			expect(store.issues).toEqual([]);
		});

		it('load() sets loading state', async () => {
			vi.mocked(mockDAL.getIssues).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 100))
			);

			const loadPromise = store.load();
			expect(store.loading).toBe(true);

			await loadPromise;
			expect(store.loading).toBe(false);
		});
	});

	describe('Filtering', () => {
		beforeEach(async () => {
			const mockIssues = [
				createMockIssue({ id: 'task-1', status: 'open', issue_type: 'task', priority: 1 }),
				createMockIssue({ id: 'bug-1', status: 'open', issue_type: 'bug', priority: 2 }),
				createMockIssue({ id: 'task-2', status: 'done', issue_type: 'task', priority: 1 }),
				createMockIssue({
					id: 'task-3',
					status: 'in_progress',
					issue_type: 'task',
					priority: 3,
					assignee: 'alice'
				})
			];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(mockIssues);
			await store.load();
		});

		it('filtered getter returns all issues when no filter', () => {
			expect(store.filtered.length).toBe(4);
		});

		it('filtered getter applies status filter', () => {
			store.setFilter({ status: 'open' });
			expect(store.filtered.length).toBe(2);
			expect(store.filtered.every((i) => i.status === 'open')).toBe(true);
		});

		it('filtered getter applies type filter', () => {
			store.setFilter({ issueType: 'bug' });
			expect(store.filtered.length).toBe(1);
			expect(store.filtered[0]?.id).toBe('bug-1');
		});

		it('filtered getter applies priority filter', () => {
			store.setFilter({ priority: 1 });
			expect(store.filtered.length).toBe(2);
			expect(store.filtered.every((i) => i.priority === 1)).toBe(true);
		});

		it('filtered getter applies assignee filter', () => {
			store.setFilter({ assignee: 'alice' });
			expect(store.filtered.length).toBe(1);
			expect(store.filtered[0]?.assignee).toBe('alice');
		});

		it('filtered getter applies text search', () => {
			store.setFilter({ search: 'task-1' });
			expect(store.filtered.length).toBe(1);
			expect(store.filtered[0]?.id).toBe('task-1');
		});

		it('multiple filters combine with AND logic', () => {
			store.setFilter({ status: 'open', issueType: 'task' });
			expect(store.filtered.length).toBe(1);
			expect(store.filtered[0]?.id).toBe('task-1');
		});
	});

	describe('Selection', () => {
		beforeEach(async () => {
			const mockIssues = [createMockIssue({ id: 'test-1' }), createMockIssue({ id: 'test-2' })];
			vi.mocked(mockDAL.getIssues).mockResolvedValue(mockIssues);
			await store.load();
		});

		it('selected getter returns null when no selection', () => {
			expect(store.selected).toBeNull();
		});

		it('selected getter returns issue matching selectedId', () => {
			store.setSelected('test-1');
			expect(store.selected?.id).toBe('test-1');
		});

		it('setSelected(id) updates selectedId', () => {
			store.setSelected('test-2');
			expect(store.selectedId).toBe('test-2');
		});

		it('setSelected(null) clears selection', () => {
			store.setSelected('test-1');
			store.setSelected(null);
			expect(store.selectedId).toBeNull();
			expect(store.selected).toBeNull();
		});
	});

	describe('CRUD Operations', () => {
		describe('create()', () => {
			it('calls ProcessSupervisor with bd create command', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Created issue: test-new\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});
				vi.mocked(mockDAL.getIssue).mockResolvedValue(
					createMockIssue({ id: 'test-new', title: 'New Issue' })
				);

				await store.create({ title: 'New Issue', issue_type: 'task' });

				expect(mockSupervisor.execute).toHaveBeenCalledWith(
					'bd',
					expect.arrayContaining(['create'])
				);
			});

			it('passes title as required argument', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Created issue: test-new\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});
				vi.mocked(mockDAL.getIssue).mockResolvedValue(
					createMockIssue({ id: 'test-new', title: 'My New Issue' })
				);

				await store.create({ title: 'My New Issue', issue_type: 'task' });

				expect(mockSupervisor.execute).toHaveBeenCalledWith(
					'bd',
					expect.arrayContaining(['--title', 'My New Issue'])
				);
			});

			it('passes optional fields (type, priority, assignee)', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Created issue: test-new\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});
				vi.mocked(mockDAL.getIssue).mockResolvedValue(
					createMockIssue({
						id: 'test-new',
						title: 'New Issue',
						issue_type: 'bug',
						priority: 1,
						assignee: 'alice'
					})
				);

				await store.create({
					title: 'New Issue',
					issue_type: 'bug',
					priority: 1,
					assignee: 'alice'
				});

				const call = vi.mocked(mockSupervisor.execute).mock.calls[0];
				expect(call?.[1]).toContain('--type');
				expect(call?.[1]).toContain('bug');
				expect(call?.[1]).toContain('--priority');
				expect(call?.[1]).toContain('1');
				expect(call?.[1]).toContain('--assignee');
				expect(call?.[1]).toContain('alice');
			});

			it('returns created issue ID from CLI output', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Created issue: projx-123\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});
				vi.mocked(mockDAL.getIssue).mockResolvedValue(
					createMockIssue({ id: 'projx-123', title: 'New Issue' })
				);

				const result = await store.create({ title: 'New Issue', issue_type: 'task' });

				expect(result.id).toBe('projx-123');
			});

			it('throws on CLI failure with error message', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 1,
					stdout: '',
					stderr: 'Error: Title is required',
					duration: 100,
					timedOut: false
				});

				await expect(store.create({ title: '', issue_type: 'task' })).rejects.toThrow();
			});

			it('adds new issue to store optimistically', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Created issue: test-new\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});
				vi.mocked(mockDAL.getIssue).mockResolvedValue(
					createMockIssue({ id: 'test-new', title: 'New Issue' })
				);

				await store.create({ title: 'New Issue', issue_type: 'task' });

				expect(store.issues.some((i) => i.id === 'test-new')).toBe(true);
			});
		});

		describe('update()', () => {
			beforeEach(async () => {
				const mockIssues = [createMockIssue({ id: 'test-1', title: 'Original' })];
				vi.mocked(mockDAL.getIssues).mockResolvedValue(mockIssues);
				await store.load();
			});

			it('calls ProcessSupervisor with bd update command', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Updated issue: test-1\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});

				await store.update('test-1', { title: 'Updated' });

				expect(mockSupervisor.execute).toHaveBeenCalledWith(
					'bd',
					expect.arrayContaining(['update', 'test-1'])
				);
			});

			it('passes issue ID as first argument', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Updated\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});

				await store.update('test-1', { status: 'done' });

				const call = vi.mocked(mockSupervisor.execute).mock.calls[0];
				expect(call?.[1]?.[1]).toBe('test-1');
			});

			it('passes changed fields as flags', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Updated\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});

				await store.update('test-1', { status: 'done', priority: 1 });

				const call = vi.mocked(mockSupervisor.execute).mock.calls[0];
				expect(call?.[1]).toContain('--status');
				expect(call?.[1]).toContain('done');
				expect(call?.[1]).toContain('--priority');
				expect(call?.[1]).toContain('1');
			});

			it('updates issue in store optimistically', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 0,
					stdout: '✓ Updated\n',
					stderr: '',
					duration: 100,
					timedOut: false
				});

				await store.update('test-1', { title: 'Updated Title' });

				const issue = store.issues.find((i) => i.id === 'test-1');
				expect(issue?.title).toBe('Updated Title');
			});

			it('reverts on update failure', async () => {
				vi.mocked(mockSupervisor.execute).mockResolvedValue({
					exitCode: 1,
					stdout: '',
					stderr: 'Error: Update failed',
					duration: 100,
					timedOut: false
				});

				await expect(store.update('test-1', { title: 'New Title' })).rejects.toThrow();

				const issue = store.issues.find((i) => i.id === 'test-1');
				expect(issue?.title).toBe('Original');
			});
		});

		describe('refresh()', () => {
			it('reloads all issues from database', async () => {
				const initialIssues = [createMockIssue({ id: 'test-1' })];
				vi.mocked(mockDAL.getIssues).mockResolvedValue(initialIssues);
				await store.load();

				const updatedIssues = [
					createMockIssue({ id: 'test-1' }),
					createMockIssue({ id: 'test-2' })
				];
				vi.mocked(mockDAL.getIssues).mockResolvedValue(updatedIssues);

				await store.refresh();

				expect(store.issues.length).toBe(2);
				expect(mockDAL.getIssues).toHaveBeenCalledTimes(2);
			});
		});
	});
});
