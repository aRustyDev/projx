/**
 * RealtimeServer Tests (TDD)
 * @module lib/realtime/RealtimeServer.test
 *
 * Tests for the WebSocket server for broadcasting file changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ws module before imports
vi.mock('ws', () => {
	const mockServer: {
		clients: Set<unknown>;
		handlers: Map<string, Array<(arg: unknown) => void>>;
		on: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
		simulateConnection: ReturnType<typeof vi.fn>;
		simulateError: ReturnType<typeof vi.fn>;
	} = {
		clients: new Set(),
		handlers: new Map(),
		on: vi.fn(function (event: string, handler: (arg: unknown) => void) {
			if (!mockServer.handlers.has(event)) {
				mockServer.handlers.set(event, []);
			}
			mockServer.handlers.get(event)!.push(handler);
			return mockServer;
		}),
		close: vi.fn((cb?: () => void) => cb?.()),
		// Test helper
		simulateConnection: vi.fn(function (ws: unknown) {
			const handlers = mockServer.handlers.get('connection') || [];
			handlers.forEach((h) => h(ws));
		}),
		simulateError: vi.fn(function (error: Error) {
			const handlers = mockServer.handlers.get('error') || [];
			handlers.forEach((h) => h(error));
		})
	};

	// Use vi.fn with a regular function implementation (not arrow) so it can be called with 'new'
	const MockWebSocketServer = vi.fn(function () {
		return mockServer;
	});

	return {
		WebSocketServer: MockWebSocketServer,
		__mockServer: mockServer
	};
});

import { RealtimeServer } from './RealtimeServer.js';
import { WebSocketServer, __mockServer } from 'ws';

describe('RealtimeServer', () => {
	let server: RealtimeServer;
	let mockWss: typeof __mockServer;

	const OPEN = 1;
	const CLOSED = 3;

	beforeEach(() => {
		mockWss = __mockServer;
		mockWss.clients = new Set();
		mockWss.handlers = new Map();
		vi.clearAllMocks();
	});

	afterEach(async () => {
		if (server) {
			await server.stop();
		}
	});

	describe('initialization', () => {
		it('creates WebSocket server on specified port', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			expect(WebSocketServer).toHaveBeenCalledWith({ port: 8080 });
		});
	});

	describe('client connections', () => {
		it('accepts client connections', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
		});

		it('handles client disconnection', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			const mockClient = {
				on: vi.fn().mockReturnThis(),
				send: vi.fn(),
				readyState: OPEN
			};

			mockWss.simulateConnection(mockClient);

			expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
		});
	});

	describe('broadcasting', () => {
		it('broadcasts file:changed events to all clients', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			const mockClient1 = { send: vi.fn(), readyState: OPEN };
			const mockClient2 = { send: vi.fn(), readyState: OPEN };
			mockWss.clients.add(mockClient1);
			mockWss.clients.add(mockClient2);

			server.broadcast('file:changed', { path: '.beads/issues.db' });

			expect(mockClient1.send).toHaveBeenCalledWith(expect.stringContaining('file:changed'));
			expect(mockClient2.send).toHaveBeenCalledWith(expect.stringContaining('file:changed'));
		});

		it('broadcasts issues:changed events', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			const mockClient = { send: vi.fn(), readyState: OPEN };
			mockWss.clients.add(mockClient);

			server.broadcast('issues:changed', { ids: ['TEST-1', 'TEST-2'] });

			const message = JSON.parse(mockClient.send.mock.calls[0][0]);
			expect(message.type).toBe('issues:changed');
			expect(message.payload).toEqual({ ids: ['TEST-1', 'TEST-2'] });
		});

		it('supports multiple concurrent clients', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			const clients = Array.from({ length: 5 }, () => ({
				send: vi.fn(),
				readyState: OPEN
			}));
			clients.forEach((c) => mockWss.clients.add(c));

			server.broadcast('file:changed', { path: '.beads/test.db' });

			clients.forEach((client) => {
				expect(client.send).toHaveBeenCalledTimes(1);
			});
		});

		it('skips clients that are not open', () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			const openClient = { send: vi.fn(), readyState: OPEN };
			const closedClient = { send: vi.fn(), readyState: CLOSED };
			mockWss.clients.add(openClient);
			mockWss.clients.add(closedClient);

			server.broadcast('file:changed', { path: '.beads/test.db' });

			expect(openClient.send).toHaveBeenCalled();
			expect(closedClient.send).not.toHaveBeenCalled();
		});
	});

	describe('lifecycle', () => {
		it('stops server when stop() called', async () => {
			server = new RealtimeServer({ port: 8080 });
			server.start();

			await server.stop();

			expect(mockWss.close).toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('handles server errors', () => {
			const onError = vi.fn();
			server = new RealtimeServer({ port: 8080 });
			server.on('error', onError);
			server.start();

			mockWss.simulateError(new Error('Server error'));

			expect(onError).toHaveBeenCalled();
		});
	});
});
