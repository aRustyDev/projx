/**
 * Realtime module - WebSocket-based real-time updates
 * @module lib/realtime
 */

export { FileWatcher, type FileWatcherOptions, type FileChangeEvent } from './FileWatcher.js';
export { RealtimeServer, type RealtimeServerOptions } from './RealtimeServer.js';
export {
	createRealtimeClient,
	type RealtimeClient,
	type RealtimeClientOptions,
	type RealtimeMessage
} from './useRealtime.js';
