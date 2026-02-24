/**
 * RealtimeServer - WebSocket server for broadcasting file changes
 * @module lib/realtime/RealtimeServer
 */

import { WebSocketServer, type WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface RealtimeServerOptions {
	port: number;
}

export interface RealtimeMessage {
	type: string;
	payload: unknown;
}

const OPEN = 1;

export class RealtimeServer extends EventEmitter {
	private options: RealtimeServerOptions;
	private wss: WebSocketServer | null = null;

	constructor(options: RealtimeServerOptions) {
		super();
		this.options = options;
	}

	/**
	 * Start the WebSocket server
	 */
	start(): void {
		this.wss = new WebSocketServer({ port: this.options.port });

		this.wss.on('connection', (ws: WebSocket) => {
			this.handleConnection(ws);
		});

		this.wss.on('error', (error: Error) => {
			this.emit('error', error);
		});
	}

	/**
	 * Stop the WebSocket server
	 */
	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.wss) {
				this.wss.close(() => {
					this.wss = null;
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Broadcast a message to all connected clients
	 */
	broadcast(type: string, payload: unknown): void {
		if (!this.wss) return;

		const message = JSON.stringify({ type, payload });

		for (const client of this.wss.clients) {
			if (client.readyState === OPEN) {
				client.send(message);
			}
		}
	}

	/**
	 * Handle a new client connection
	 */
	private handleConnection(ws: WebSocket): void {
		ws.on('close', () => {
			// Client disconnected
		});

		ws.on('error', (error: Error) => {
			this.emit('clientError', error);
		});

		ws.on('message', (data: Buffer) => {
			try {
				const message = JSON.parse(data.toString()) as RealtimeMessage;
				this.emit('message', message);
			} catch {
				// Invalid JSON, ignore
			}
		});
	}

	/**
	 * Get the number of connected clients
	 */
	get clientCount(): number {
		return this.wss?.clients.size ?? 0;
	}
}
