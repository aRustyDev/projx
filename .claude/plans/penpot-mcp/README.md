# Penpot MCP Integration - Findings & Documentation

> Investigation conducted: 2026-02-23
> Status: `penpot-plugin` MCP non-functional, `penpot` MCP working (read-only)

## Summary

Two Penpot MCP servers are available for AI-assisted design workflows:

| Server | Type | Status | Purpose |
|--------|------|--------|---------|
| `penpot` | REST API | **Working** | Read-only design access |
| `penpot-plugin` | Browser Plugin | **Broken** | Read-write via execute_code |

The `penpot-plugin` server, which enables write operations, is currently non-functional due to API calls hanging indefinitely (BUG-001).

## Bug Reports

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| [BUG-001](bug-001-penpot-plugin-api-calls-hang.md) | penpot-plugin API calls hang indefinitely | Critical | Open |
| [BUG-002](bug-002-websocket-connection-drops.md) | WebSocket connection drops without notice | High | Open |
| [BUG-003](bug-003-rest-api-transit-format-default.md) | REST API returns Transit format by default | Medium | Workaround |

## Constraints

| ID | Title | Impact |
|----|-------|--------|
| [CONST-001](constraint-001-per-file-browser-connection.md) | Per-file browser connection required | High |
| [CONST-002](constraint-002-rest-api-cannot-create-pages.md) | REST API cannot create pages | High |
| [CONST-003](constraint-003-access-tokens-feature-flag.md) | Access tokens require feature flag | Low |
| [CONST-004](constraint-004-two-mcp-servers-different-purposes.md) | Two servers with different purposes | Info |

## What Works

1. **REST API** (via access tokens or direct curl)
   - Create projects
   - Create files
   - Read all design data
   - Requires `Accept: application/json` header

2. **`penpot` MCP** (read-only)
   - List projects and files
   - Read design structures
   - Export assets
   - Design token extraction

3. **Penpot UI** (manual)
   - All operations work
   - Page creation
   - Shape manipulation

## What Doesn't Work

1. **`penpot-plugin` MCP**
   - All tool calls hang indefinitely
   - Cannot use execute_code
   - Cannot create pages programmatically

## Workaround Workflow

Given current limitations:

```
1. Create Structure (scripts/penpot-setup.sh)
   - Uses REST API with access tokens
   - Creates project + all design files

2. Create Pages (MANUAL - Penpot UI)
   - Open each file in browser
   - Manually create pages
   - Cannot be automated until BUG-001 resolved

3. Read Designs (penpot MCP - working)
   - Extract design tokens
   - Export assets
   - Generate code from designs
```

## Files Created

| File | Purpose |
|------|---------|
| `scripts/penpot-setup.sh` | REST API automation for project/file creation |
| `.docker/compose.yaml` | Penpot + MCP server Docker configuration |
| `.mcp.json` | MCP server configuration for Claude Code |

## Recommendations

### Short-term
1. Use manual Penpot UI for page creation
2. Use `penpot` MCP for design reading/extraction
3. Consider ASCII wireframes as alternative to visual prototyping

### Long-term
1. Report BUG-001 to Penpot team
2. Investigate mcp-remote proxy as potential cause
3. Consider direct WebSocket integration instead of mcp-remote
