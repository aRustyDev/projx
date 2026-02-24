/**
 * useRealtime - Client-side WebSocket connection for real-time updates
 * @module lib/realtime/useRealtime
 */

export interface RealtimeClientOptions {
	url: string;
	reconnectDelay?: number;
	maxReconnectDelay?: number;
	maxReconnectAttempts?: number;
}

export interface RealtimeMessage {
	type: string;
	payload: unknown;
}

type EventHandler = (payload: unknown) => void;

export interface RealtimeClient {
	connect(): void;
	disconnect(): void;
	isConnected(): boolean;
	on(event: string, handler: EventHandler): void;
	off(event: string, handler: EventHandler): void;
}

/**
 * Create a realtime client for WebSocket communication
 */
export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
	const {
		url,
		reconnectDelay = 1000,
		maxReconnectDelay = 30000,
		maxReconnectAttempts = Infinity
	} = options;

	let ws: WebSocket | null = null;
	let reconnectAttempts = 0;
	let currentReconnectDelay = reconnectDelay;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let intentionalDisconnect = false;

	const handlers = new Map<string, Set<EventHandler>>();

	function getHandlers(event: string): Set<EventHandler> {
		if (!handlers.has(event)) {
			handlers.set(event, new Set());
		}
		return handlers.get(event)!;
	}

	function emit(event: string, payload: unknown): void {
		const eventHandlers = handlers.get(event);
		if (eventHandlers) {
			for (const handler of eventHandlers) {
				handler(payload);
			}
		}
	}

	function connect(): void {
		intentionalDisconnect = false;

		try {
			ws = new WebSocket(url);

			ws.onopen = () => {
				reconnectAttempts = 0;
				currentReconnectDelay = reconnectDelay;
				emit('connected', null);
			};

			ws.onclose = () => {
				ws = null;
				emit('disconnected', null);

				if (!intentionalDisconnect && reconnectAttempts < maxReconnectAttempts) {
					scheduleReconnect();
				}
			};

			ws.onerror = () => {
				emit('error', new Error('WebSocket error'));
			};

			ws.onmessage = (event: MessageEvent) => {
				try {
					const message = JSON.parse(event.data) as RealtimeMessage;
					emit(message.type, message.payload);
				} catch {
					// Invalid JSON, ignore
				}
			};
		} catch (error) {
			emit('error', error);
		}
	}

	function disconnect(): void {
		intentionalDisconnect = true;

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (ws) {
			ws.close();
			ws = null;
		}
	}

	function scheduleReconnect(): void {
		reconnectAttempts++;

		reconnectTimeout = setTimeout(() => {
			connect();
		}, currentReconnectDelay);

		// Exponential backoff
		currentReconnectDelay = Math.min(currentReconnectDelay * 2, maxReconnectDelay);
	}

	function isConnected(): boolean {
		return ws !== null && ws.readyState === WebSocket.OPEN;
	}

	function on(event: string, handler: EventHandler): void {
		getHandlers(event).add(handler);
	}

	function off(event: string, handler: EventHandler): void {
		getHandlers(event).delete(handler);
	}

	return {
		connect,
		disconnect,
		isConnected,
		on,
		off
	};
}
