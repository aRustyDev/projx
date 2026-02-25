/**
 * Data Access Layer - Unified database access for SQLite and Dolt
 * @module db/dal
 *
 * Provides read-only database access. All write operations go through the `bd` CLI
 * via ProcessSupervisor to maintain data integrity.
 */

import type {
	DatabaseBackend,
	DatabaseConfig,
	QueryResult,
	Issue,
	Dependency,
	Comment,
	Label,
	IssueFilter
} from '$lib/db/types.js';
import type { ProcessSupervisor } from '$lib/cli/types.js';
import { getProcessSupervisor } from '../cli/supervisor.js';

/** Default configuration values */
const DEFAULT_CONFIG: Required<Omit<DatabaseConfig, 'backend' | 'dolt' | 'beadsPath'>> = {
	poolSize: 5
};

/**
 * Data Access Layer for unified database access.
 *
 * Supports both SQLite (via better-sqlite3) and Dolt (via mysql2) backends.
 * Automatically detects the available backend based on .beads directory contents.
 *
 * @example
 * ```typescript
 * const dal = await DataAccessLayer.create();
 * const issues = await dal.getIssues({ status: 'open', limit: 10 });
 * ```
 */
export class DataAccessLayer {
	private backend: DatabaseBackend;
	private config: DatabaseConfig;
	private sqliteDb: import('better-sqlite3').Database | null = null;
	private doltPool: import('mysql2/promise').Pool | null = null;
	private supervisor: ProcessSupervisor;

	private constructor(backend: DatabaseBackend, config: DatabaseConfig) {
		this.backend = backend;
		this.config = config;
		this.supervisor = getProcessSupervisor();
	}

	/**
	 * Create and initialize a DataAccessLayer instance.
	 * Automatically detects the appropriate backend.
	 */
	static async create(config: DatabaseConfig = {}): Promise<DataAccessLayer> {
		const backend = config.backend ?? (await DataAccessLayer.detectBackend(config.beadsPath));
		const dal = new DataAccessLayer(backend, config);
		await dal.initialize();
		return dal;
	}

	/**
	 * Detect the available database backend.
	 * Priority: Explicit env var > Dolt server > SQLite with data > Default to Dolt
	 */
	private static async detectBackend(beadsPath?: string): Promise<DatabaseBackend> {
		const path = await import('node:path');
		const fs = await import('node:fs/promises');

		// Check for explicit backend preference via environment
		const envBackend = process.env.BEADS_BACKEND;
		if (envBackend === 'sqlite' || envBackend === 'dolt') {
			return envBackend;
		}

		// Try to find .beads directory
		const basePath = beadsPath ?? process.cwd();
		const beadsDir = path.join(basePath, '.beads');

		try {
			const entries = await fs.readdir(beadsDir);

			// Check for Dolt directory structure (prefers Dolt over SQLite)
			const hasDolt = entries.includes('dolt') || entries.includes('.dolt');
			if (hasDolt) {
				return 'dolt';
			}

			// Check for SQLite database with actual data
			const sqliteFiles = entries.filter((e) => e.endsWith('.db') || e.endsWith('.sqlite3'));
			for (const file of sqliteFiles) {
				const stat = await fs.stat(path.join(beadsDir, file));
				if (stat.size > 0) {
					return 'sqlite';
				}
			}

			// Default to dolt if .beads exists but no populated SQLite found
			return 'dolt';
		} catch {
			// If .beads doesn't exist, assume Dolt server mode
			return 'dolt';
		}
	}

	/**
	 * Initialize database connection.
	 * Falls back to SQLite if Dolt connection fails.
	 */
	private async initialize(): Promise<void> {
		if (this.backend === 'sqlite') {
			await this.initSqlite();
		} else {
			try {
				await this.initDolt();
			} catch (doltError) {
				// Try SQLite fallback if Dolt fails
				console.warn(
					`Dolt connection failed, trying SQLite fallback: ${(doltError as Error).message}`
				);
				try {
					await this.initSqlite();
					this.backend = 'sqlite';
					console.warn('Successfully connected to SQLite fallback');
				} catch (sqliteError) {
					// Both failed, throw with SQLite error as cause (includes Dolt context in message)
					throw new Error(
						`Database connection failed. ` +
							`Dolt: ${(doltError as Error).message}. ` +
							`SQLite fallback: ${(sqliteError as Error).message}`,
						{ cause: sqliteError }
					);
				}
			}
		}
	}

	private async initSqlite(): Promise<void> {
		const path = await import('node:path');
		const fs = await import('node:fs/promises');
		const Database = (await import('better-sqlite3')).default;

		const basePath = this.config.beadsPath ?? process.cwd();
		const beadsDir = path.join(basePath, '.beads');

		// Find SQLite database files (.db or .sqlite3), prefer non-empty files with valid schema
		const entries = await fs.readdir(beadsDir);
		const dbFiles = entries.filter((e) => e.endsWith('.db') || e.endsWith('.sqlite3'));

		if (dbFiles.length === 0) {
			throw new Error(`No SQLite database found in ${beadsDir}`);
		}

		// Sort by file size (prefer larger files which likely have data)
		const filesWithSize = await Promise.all(
			dbFiles.map(async (file) => {
				const stat = await fs.stat(path.join(beadsDir, file));
				return { file, size: stat.size };
			})
		);
		filesWithSize.sort((a, b) => b.size - a.size);

		// Find a database with the issues table
		let dbFile: string | null = null;
		for (const { file, size } of filesWithSize) {
			if (size === 0) continue;

			const dbPath = path.join(beadsDir, file);
			try {
				const testDb = new Database(dbPath, { readonly: true });
				// Check if issues table exists
				const hasIssues = testDb
					.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='issues'")
					.get();
				testDb.close();

				if (hasIssues) {
					dbFile = file;
					break;
				}
			} catch {
				// Skip invalid databases
				continue;
			}
		}

		if (!dbFile) {
			throw new Error(`No SQLite database with issues table found in ${beadsDir}`);
		}

		const dbPath = path.join(beadsDir, dbFile);
		this.sqliteDb = new Database(dbPath, { readonly: true });

		// Note: WAL mode cannot be set in readonly mode, and should already
		// be configured by the bd CLI when writing to the database
	}

	private async initDolt(): Promise<void> {
		const mysql = await import('mysql2/promise');

		// Try to connect to Dolt server, checking multiple ports
		// Port 3308: Local project server (started by `just dolt-server`)
		// Port 3307: Global dolt server
		// Port 3306: Default MySQL port
		const ports = [3308, 3307, 3306];
		const database = process.env.DOLT_DATABASE ?? 'beads_projx';

		const doltConfig = this.config.dolt ?? {
			host: process.env.DOLT_HOST ?? 'localhost',
			user: process.env.DOLT_USER ?? 'root',
			password: process.env.DOLT_PASSWORD ?? ''
		};

		// Try each port until we find one that works with our database
		let lastError: Error | null = null;
		for (const port of ports) {
			try {
				const pool = mysql.createPool({
					...doltConfig,
					port: parseInt(process.env.DOLT_PORT ?? String(port), 10),
					database,
					waitForConnections: true,
					connectionLimit: this.config.poolSize ?? DEFAULT_CONFIG.poolSize,
					queueLimit: 0
				});

				// Test connection
				const conn = await pool.getConnection();
				conn.release();

				this.doltPool = pool;
				console.warn(`Connected to Dolt server on port ${port}, database: ${database}`);
				return;
			} catch (error) {
				lastError = error as Error;
				// Try next port
			}
		}

		// If explicit port was set, give a clearer error
		if (process.env.DOLT_PORT) {
			throw new Error(
				`Failed to connect to Dolt on port ${process.env.DOLT_PORT}: ${lastError?.message}`
			);
		}

		// All ports failed
		throw new Error(
			`Failed to connect to Dolt server. ` +
				`Tried ports ${ports.join(', ')} for database "${database}". ` +
				`Run 'just dolt-server' to start a local server. ` +
				`Last error: ${lastError?.message}`
		);
	}

	/**
	 * Get the current backend type.
	 */
	getBackend(): DatabaseBackend {
		return this.backend;
	}

	/**
	 * Execute a raw SQL query.
	 * For read operations only - write operations should use `bd` CLI.
	 */
	async query<T = Record<string, unknown>>(
		sql: string,
		params?: unknown[]
	): Promise<QueryResult<T>> {
		const startTime = Date.now();

		if (this.backend === 'sqlite') {
			return this.querySqlite<T>(sql, params, startTime);
		} else {
			return this.queryDolt<T>(sql, params, startTime);
		}
	}

	private async querySqlite<T>(
		sql: string,
		params: unknown[] | undefined,
		startTime: number
	): Promise<QueryResult<T>> {
		if (!this.sqliteDb) {
			throw new Error('SQLite database not initialized');
		}

		try {
			const stmt = this.sqliteDb.prepare(sql);
			const rows = params ? stmt.all(...params) : stmt.all();

			return {
				rows: rows as T[],
				duration: Date.now() - startTime
			};
		} catch (error) {
			throw new Error(`SQLite query failed: ${(error as Error).message}`, { cause: error });
		}
	}

	private async queryDolt<T>(
		sql: string,
		params: unknown[] | undefined,
		startTime: number
	): Promise<QueryResult<T>> {
		if (!this.doltPool) {
			throw new Error('Dolt connection pool not initialized');
		}

		try {
			const [rows] = await this.doltPool.execute(
				sql,
				(params ?? []) as (string | number | boolean | null)[]
			);

			return {
				rows: rows as T[],
				duration: Date.now() - startTime
			};
		} catch (error) {
			throw new Error(`Dolt query failed: ${(error as Error).message}`, { cause: error });
		}
	}

	/**
	 * Get issues with optional filtering.
	 */
	async getIssues(filter: IssueFilter = {}): Promise<Issue[]> {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filter.status) {
			const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
			conditions.push(`status IN (${statuses.map(() => '?').join(', ')})`);
			params.push(...statuses);
		}

		if (filter.priority) {
			const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
			conditions.push(`priority IN (${priorities.map(() => '?').join(', ')})`);
			params.push(...priorities);
		}

		if (filter.issueType) {
			const types = Array.isArray(filter.issueType) ? filter.issueType : [filter.issueType];
			conditions.push(`issue_type IN (${types.map(() => '?').join(', ')})`);
			params.push(...types);
		}

		if (filter.assignee) {
			const assignees = Array.isArray(filter.assignee) ? filter.assignee : [filter.assignee];
			conditions.push(`assignee IN (${assignees.map(() => '?').join(', ')})`);
			params.push(...assignees);
		}

		if (filter.search) {
			conditions.push(`(title LIKE ? OR description LIKE ?)`);
			const searchPattern = `%${filter.search}%`;
			params.push(searchPattern, searchPattern);
		}

		if (filter.parentId) {
			conditions.push(
				`id IN (SELECT issue_id FROM dependencies WHERE depends_on_id = ? AND type = 'parent-child')`
			);
			params.push(filter.parentId);
		}

		let sql = 'SELECT * FROM issues';
		if (conditions.length > 0) {
			sql += ` WHERE ${conditions.join(' AND ')}`;
		}

		// Order by
		if (filter.orderBy) {
			const direction = filter.orderBy.direction.toUpperCase();
			sql += ` ORDER BY ${filter.orderBy.field} ${direction}`;
		} else {
			sql += ' ORDER BY updated_at DESC';
		}

		// Pagination
		if (filter.limit) {
			sql += ` LIMIT ${filter.limit}`;
			if (filter.offset) {
				sql += ` OFFSET ${filter.offset}`;
			}
		}

		const result = await this.query<Issue>(sql, params);
		return result.rows;
	}

	/**
	 * Get a single issue by ID.
	 */
	async getIssue(id: string): Promise<Issue | null> {
		const result = await this.query<Issue>('SELECT * FROM issues WHERE id = ?', [id]);
		return result.rows[0] ?? null;
	}

	/**
	 * Get dependencies for an issue.
	 */
	async getDependencies(issueId: string): Promise<Dependency[]> {
		const result = await this.query<Dependency>(
			'SELECT * FROM dependencies WHERE issue_id = ? OR depends_on_id = ?',
			[issueId, issueId]
		);
		return result.rows;
	}

	/**
	 * Get comments for an issue.
	 */
	async getComments(issueId: string): Promise<Comment[]> {
		const result = await this.query<Comment>(
			'SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC',
			[issueId]
		);
		return result.rows;
	}

	/**
	 * Get labels for an issue.
	 */
	async getLabels(issueId: string): Promise<string[]> {
		const result = await this.query<Label>('SELECT label FROM labels WHERE issue_id = ?', [
			issueId
		]);
		return result.rows.map((r) => r.label);
	}

	/**
	 * Get all unique statuses in use.
	 */
	async getStatuses(): Promise<string[]> {
		const result = await this.query<{ status: string }>(
			'SELECT DISTINCT status FROM issues ORDER BY status'
		);
		return result.rows.map((r) => r.status);
	}

	/**
	 * Get all unique assignees.
	 */
	async getAssignees(): Promise<string[]> {
		const result = await this.query<{ assignee: string }>(
			'SELECT DISTINCT assignee FROM issues WHERE assignee IS NOT NULL ORDER BY assignee'
		);
		return result.rows.map((r) => r.assignee);
	}

	/**
	 * Get all unique issue types.
	 */
	async getIssueTypes(): Promise<string[]> {
		const result = await this.query<{ issue_type: string }>(
			'SELECT DISTINCT issue_type FROM issues ORDER BY issue_type'
		);
		return result.rows.map((r) => r.issue_type);
	}

	/**
	 * Get issue count with optional filter.
	 */
	async getIssueCount(filter: IssueFilter = {}): Promise<number> {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filter.status) {
			const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
			conditions.push(`status IN (${statuses.map(() => '?').join(', ')})`);
			params.push(...statuses);
		}

		let sql = 'SELECT COUNT(*) as count FROM issues';
		if (conditions.length > 0) {
			sql += ` WHERE ${conditions.join(' AND ')}`;
		}

		const result = await this.query<{ count: number }>(sql, params);
		return result.rows[0]?.count ?? 0;
	}

	/**
	 * Close database connections.
	 */
	async close(): Promise<void> {
		if (this.sqliteDb) {
			this.sqliteDb.close();
			this.sqliteDb = null;
		}

		if (this.doltPool) {
			await this.doltPool.end();
			this.doltPool = null;
		}
	}
}

/** Singleton instance */
let defaultDal: DataAccessLayer | null = null;

/**
 * Get the default DataAccessLayer instance.
 * Creates one with auto-detection if not initialized.
 */
export async function getDataAccessLayer(): Promise<DataAccessLayer> {
	if (!defaultDal) {
		defaultDal = await DataAccessLayer.create();
	}
	return defaultDal;
}

/**
 * Initialize the default DataAccessLayer with custom config.
 */
export async function initDataAccessLayer(config: DatabaseConfig): Promise<DataAccessLayer> {
	if (defaultDal) {
		await defaultDal.close();
	}
	defaultDal = await DataAccessLayer.create(config);
	return defaultDal;
}
