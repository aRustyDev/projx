/**
 * Database Module - Browser-safe exports
 * @module db
 *
 * Types and interfaces for database access.
 * The actual implementation is in $lib/server/db/dal.ts (server-only).
 *
 * For server-side code that needs the DataAccessLayer implementation:
 * import { DataAccessLayer, getDataAccessLayer } from '$lib/server/db/dal.js';
 */

export type {
	DatabaseBackend,
	DatabaseConfig,
	QueryResult,
	Issue,
	Dependency,
	Comment,
	Label,
	IssueFilter,
	DataAccessLayer
} from './types.js';
