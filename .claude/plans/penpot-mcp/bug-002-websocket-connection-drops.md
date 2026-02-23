# BUG-002: WebSocket Connection Drops Without User Action

## Summary
The WebSocket connection between the penpot-mcp server and the browser plugin disconnects spontaneously without user action or error indication.

## Environment
- **MCP Server**: penpot-plugin
- **WebSocket Port**: 4402
- **Browser**: (any browser with Penpot open)

## Steps to Reproduce
1. Open Penpot file in browser
2. Connect penpot-plugin via Plugin Manager
3. Verify connection: `New WebSocket connection established` in logs
4. Wait or switch browser tabs
5. Connection closes without user action

## Evidence from Logs
```
[2026-02-23 18:51:34.451] (PluginBridge): New WebSocket connection established
[2026-02-23 19:04:44.564] (PluginBridge): WebSocket connection closed
```

Connection dropped after ~13 minutes without any user interaction.

## Expected Behavior
- WebSocket connection should remain stable while file is open
- If connection drops, automatic reconnection should occur
- User should be notified of disconnection

## Actual Behavior
- Connection silently drops
- No automatic reconnection
- No notification in browser or MCP server
- MCP calls hang indefinitely when connection is dropped (see BUG-001)

## Impact
- MCP calls fail silently when connection drops
- User must manually reconnect plugin
- No indication that reconnection is needed
- Unreliable for any automated workflows

## Possible Causes
1. WebSocket idle timeout (browser or server side)
2. Browser tab throttling when not focused
3. Penpot frontend WebSocket handling
4. Network keep-alive not configured

## Suggested Fixes
1. Implement WebSocket ping/pong heartbeat
2. Add automatic reconnection logic in plugin
3. Surface connection status in MCP responses
4. Add timeout to MCP calls to fail fast when disconnected
