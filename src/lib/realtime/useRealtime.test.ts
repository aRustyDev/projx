/**
 * useRealtime Hook Tests (TDD)
 * @module lib/realtime/useRealtime.test
 *
 * Tests for the realtime WebSocket client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRealtimeClient } from './useRealtime.js';

// Mock WebSocket
class MockWebSocket {
	static instances: MockWebSocket[] = [];
	static CONNECTING = 0;
	static OPEN = 1;
	static CLOSING = 2;
	static CLOSED = 3;

	url: string;
	readyState: number = MockWebSocket.CONNECTING;
	onopen: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	send = vi.fn();
	close = vi.fn();

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	// Test helpers
	simulateOpen() {
		this.readyState = MockWebSocket.OPEN;
		this.onopen?.(new Event('open'));
	}

	simulateClose() {
		this.readyState = MockWebSocket.CLOSED;
		this.onclose?.(new CloseEvent('close'));
	}

	simulateMessage(data: object) {
		this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
	}

	simulateError() {
		this.onerror?.(new Event('error'));
	}
}

describe('useRealtime', () => {
	let originalWebSocket: typeof globalThis.WebSocket;

	beforeEach(() => {
		vi.useFakeTimers();
		MockWebSocket.instances = [];
		originalWebSocket = globalThis.WebSocket;
		// @ts-expect-error - mocking WebSocket
		globalThis.WebSocket = MockWebSocket;
	});

	afterEach(() => {
		vi.useRealTimers();
		globalThis.WebSocket = originalWebSocket;
	});

	describe('connection', () => {
		it('connects to WebSocket server on creation', () => {
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.connect();

			expect(MockWebSocket.instances.length).toBe(1);
			expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8080');

			client.disconnect();
		});

		it('reconnects on disconnect', async () => {
			const client = createRealtimeClient({ url: 'ws://localhost:8080', reconnectDelay: 100 });
			client.connect();

			// Simulate connection and then disconnect
			MockWebSocket.instances[0].simulateOpen();
			MockWebSocket.instances[0].simulateClose();

			// Wait for reconnect
			await vi.advanceTimersByTimeAsync(150);

			expect(MockWebSocket.instances.length).toBe(2);

			client.disconnect();
		});

		it('disconnects when disconnect() called', () => {
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.connect();

			MockWebSocket.instances[0].simulateOpen();
			client.disconnect();

			expect(MockWebSocket.instances[0].close).toHaveBeenCalled();
		});

		it('handles connection errors', () => {
			const onError = vi.fn();
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.on('error', onError);
			client.connect();

			MockWebSocket.instances[0].simulateError();

			expect(onError).toHaveBeenCalled();

			client.disconnect();
		});
	});

	describe('events', () => {
		it('calls handler when issues:changed received', () => {
			const onIssuesChange = vi.fn();
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.on('issues:changed', onIssuesChange);
			client.connect();

			MockWebSocket.instances[0].simulateOpen();
			MockWebSocket.instances[0].simulateMessage({
				type: 'issues:changed',
				payload: { ids: ['TEST-1'] }
			});

			expect(onIssuesChange).toHaveBeenCalledWith({ ids: ['TEST-1'] });

			client.disconnect();
		});

		it('calls handler when file:changed received', () => {
			const onFileChange = vi.fn();
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.on('file:changed', onFileChange);
			client.connect();

			MockWebSocket.instances[0].simulateOpen();
			MockWebSocket.instances[0].simulateMessage({
				type: 'file:changed',
				payload: { path: '.beads/issues.db' }
			});

			expect(onFileChange).toHaveBeenCalledWith({ path: '.beads/issues.db' });

			client.disconnect();
		});

		it('ignores unknown event types', () => {
			const onIssuesChange = vi.fn();
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.on('issues:changed', onIssuesChange);
			client.connect();

			MockWebSocket.instances[0].simulateOpen();
			MockWebSocket.instances[0].simulateMessage({
				type: 'unknown:event',
				payload: {}
			});

			expect(onIssuesChange).not.toHaveBeenCalled();

			client.disconnect();
		});
	});

	describe('state', () => {
		it('reports connected state correctly', () => {
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.connect();

			expect(client.isConnected()).toBe(false);

			MockWebSocket.instances[0].simulateOpen();

			expect(client.isConnected()).toBe(true);

			client.disconnect();
		});

		it('reports disconnected state after disconnect', () => {
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.connect();

			MockWebSocket.instances[0].simulateOpen();
			client.disconnect();

			expect(client.isConnected()).toBe(false);
		});
	});

	describe('reconnection', () => {
		it('attempts reconnection after disconnect', async () => {
			const client = createRealtimeClient({
				url: 'ws://localhost:8080',
				reconnectDelay: 100
			});
			client.connect();

			MockWebSocket.instances[0].simulateOpen();

			// Disconnect triggers reconnection
			MockWebSocket.instances[0].simulateClose();
			await vi.advanceTimersByTimeAsync(150);

			// Should have created a new connection
			expect(MockWebSocket.instances.length).toBe(2);

			client.disconnect();
		});

		it('respects maxReconnectAttempts', async () => {
			const client = createRealtimeClient({
				url: 'ws://localhost:8080',
				reconnectDelay: 50,
				maxReconnectAttempts: 2
			});
			client.connect();

			MockWebSocket.instances[0].simulateOpen();

			// Trigger multiple disconnects
			for (let i = 0; i < 4; i++) {
				const lastInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
				lastInstance.simulateClose();
				await vi.advanceTimersByTimeAsync(500);
			}

			// Should stop after max attempts (1 initial + 2 retries = 3)
			expect(MockWebSocket.instances.length).toBeLessThanOrEqual(3);

			client.disconnect();
		});
	});

	describe('event subscription', () => {
		it('can unsubscribe from events', () => {
			const handler = vi.fn();
			const client = createRealtimeClient({ url: 'ws://localhost:8080' });
			client.on('issues:changed', handler);
			client.connect();

			MockWebSocket.instances[0].simulateOpen();

			// First message - handler called
			MockWebSocket.instances[0].simulateMessage({
				type: 'issues:changed',
				payload: { ids: ['TEST-1'] }
			});
			expect(handler).toHaveBeenCalledTimes(1);

			// Unsubscribe
			client.off('issues:changed', handler);

			// Second message - handler not called
			MockWebSocket.instances[0].simulateMessage({
				type: 'issues:changed',
				payload: { ids: ['TEST-2'] }
			});
			expect(handler).toHaveBeenCalledTimes(1);

			client.disconnect();
		});
	});
});
