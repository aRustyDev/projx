# BUG-001: penpot-plugin MCP API Calls Hang Indefinitely

## Summary
All tool calls to the `penpot-plugin` MCP server hang indefinitely (>4 minutes) without returning results or error messages.

## Environment
- **MCP Server**: penpot-plugin (official Penpot MCP)
- **Docker Image**: Custom build from penpot/penpot repo `/mcp` directory
- **Connection Method**: `mcp-remote` via HTTP/SSE to Docker container
- **Endpoints Tested**:
  - `/mcp` (Streamable HTTP) - hangs
  - `/sse` (Legacy SSE) - hangs

## Steps to Reproduce
1. Start penpot-mcp Docker container
2. Open Penpot file in browser
3. Connect penpot-plugin via Plugin Manager (http://localhost:4400)
4. Verify WebSocket connection in logs: `New WebSocket connection established`
5. Call any penpot-plugin tool from Claude Code:
   ```
   mcp__penpot-plugin__penpot_api_info(type="Penpot")
   ```
6. Tool call hangs indefinitely with no response

## Expected Behavior
Tool should return API documentation within a few seconds.

## Actual Behavior
- Tool call never completes
- No timeout error
- No response from MCP server
- Docker logs show no activity during the hung call
- WebSocket connection appears established but unresponsive

## Diagnostic Information

### MCP Configuration (.mcp.json)
```json
"penpot-plugin": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "http://localhost:4401/sse", "--allow-http"]
}
```

### Docker Container Status
- Container running normally
- CPU/Memory usage normal (0.13% CPU, 288MB RAM)
- WebSocket server on port 4402
- HTTP/SSE server on port 4401
- REPL server on port 4403 (accessible and working)

### Connection Chain
```
Claude Code → mcp-remote (npx) → HTTP:4401 → penpot-mcp (Docker) → WebSocket:4402 → Browser Plugin
```

### SSE Endpoint Test (Direct)
```bash
curl -s -N http://localhost:4401/sse -H "Accept: text/event-stream" --max-time 3
# Returns: event: endpoint, data: /messages?sessionId=...
```
SSE endpoint responds correctly to direct requests.

## Workarounds Attempted
1. Switched from `/mcp` to `/sse` endpoint - no change
2. Reconnected browser plugin multiple times - no change
3. Reloaded Claude Code MCP servers - no change

## Suspected Causes
1. **mcp-remote proxy issue**: The proxy may not be correctly forwarding requests/responses
2. **WebSocket message routing**: Messages may not be reaching the browser plugin
3. **Plugin response handling**: Browser plugin may receive request but response not routed back
4. **Timeout configuration**: No timeout set, so failures result in infinite hang

## Impact
- Cannot use penpot-plugin for any operations
- Cannot create pages programmatically
- Cannot execute code in Penpot designs
- Blocks design-to-code automation workflow

## Related
- constraint-001-per-file-browser-connection.md
- bug-002-websocket-connection-drops.md
