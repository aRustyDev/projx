# CONSTRAINT-001: penpot-plugin Requires Per-File Browser Connection

## Constraint
The `penpot-plugin` MCP server requires an active browser connection to each Penpot file before any operations can be performed on that file.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Claude Code │────▶│ mcp-remote  │────▶│ penpot-mcp       │────▶│ Browser Plugin  │
│             │     │ (npx proxy) │     │ (Docker:4401)    │     │ (WebSocket:4402)│
└─────────────┘     └─────────────┘     └──────────────────┘     └─────────────────┘
                                                                          │
                                                                          ▼
                                                                 ┌─────────────────┐
                                                                 │ Penpot File     │
                                                                 │ (in browser)    │
                                                                 └─────────────────┘
```

## Implications

### What This Means
1. **One file at a time**: Can only operate on the file currently open with plugin connected
2. **Manual setup required**: User must open file in browser and connect plugin before MCP works
3. **No batch operations**: Cannot script operations across multiple files
4. **Session-based**: Connection lost when browser tab closes or plugin disconnects

### Workflow Impact
- Cannot automate multi-file design system setup
- Cannot create pages in bulk across files
- Each file requires manual browser interaction to enable MCP

## Comparison: penpot vs penpot-plugin MCP

| Capability | penpot (REST API) | penpot-plugin (Browser) |
|------------|-------------------|-------------------------|
| Authentication | Access Token | Browser session |
| Connection | Stateless HTTP | WebSocket (per-file) |
| Read operations | Yes | Yes |
| Create project | Yes | No (use REST) |
| Create file | Yes | No (use REST) |
| Create page | **No** | **Yes** |
| Modify shapes | No | Yes |
| Execute code | No | Yes |
| Multi-file | Yes | No (one at a time) |

## Workarounds

### For Project/File Creation
Use the REST API with access tokens:
```bash
# Create project
curl -X POST http://localhost:9001/api/rpc/command/create-project \
  -H "Authorization: Token $TOKEN" \
  -H "Accept: application/json" \
  -d '{"teamId":"...","name":"Project Name"}'

# Create file
curl -X POST http://localhost:9001/api/rpc/command/create-file \
  -H "Authorization: Token $TOKEN" \
  -H "Accept: application/json" \
  -d '{"projectId":"...","name":"File Name"}'
```

### For Page Creation
Must use penpot-plugin with browser connection:
1. Open file in Penpot browser
2. Connect plugin from Plugin Manager
3. Use execute_code to create pages

### For Design Token Extraction
Use the read-only `penpot` MCP which works without browser connection.

## Related
- bug-001-penpot-plugin-api-calls-hang.md
- constraint-002-rest-api-cannot-create-pages.md
