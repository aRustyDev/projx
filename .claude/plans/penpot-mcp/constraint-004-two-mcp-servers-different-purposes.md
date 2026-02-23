# CONSTRAINT-004: Two Penpot MCP Servers with Different Purposes

## Overview
There are two distinct Penpot MCP servers available, each with different capabilities and use cases.

## Server Comparison

### 1. `penpot` (REST API-based, Read-Only)

**Package**: `uvx penpot-mcp` (Python)

**Configuration**:
```json
"penpot": {
  "command": "uvx",
  "args": ["penpot-mcp"],
  "env": {
    "PENPOT_API_URL": "http://localhost:9001/api",
    "PENPOT_USERNAME": "demo@example.com",
    "PENPOT_PASSWORD": "123123"
  }
}
```

**Authentication**: Username/password (session-based)

**Capabilities**:
- `list_projects` - List all projects
- `get_project_files` - List files in a project
- `get_file` - Get file details
- `get_object_tree` - Get shape hierarchy
- `search_object` - Find shapes by criteria
- `export_object` - Export shapes as images
- `penpot_schema` - Get API schema info
- `get_rendered_component` - Get component screenshots

**Limitations**:
- **Read-only** - Cannot create or modify anything
- No page creation
- No shape manipulation
- No code execution

**Best For**:
- Design token extraction
- Reading existing designs
- Exporting assets
- Design-to-code workflows (reading)

---

### 2. `penpot-plugin` (Browser Plugin-based, Read-Write)

**Package**: Official Penpot MCP from penpot/penpot repo `/mcp` directory

**Configuration**:
```json
"penpot-plugin": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "http://localhost:4401/sse", "--allow-http"]
}
```

**Authentication**: Browser session (WebSocket connection)

**Capabilities**:
- `execute_code` - Run JavaScript in Penpot context
- `penpot_api_info` - Get API documentation
- `high_level_overview` - Get design overview
- `export_shape` - Export shapes
- `import_image` - Import images

**Through execute_code**:
- Create pages
- Create/modify shapes
- Apply styles
- Manage components
- Full Penpot Plugin API access

**Limitations**:
- Requires browser connection per-file
- WebSocket connection can drop (see BUG-002)
- API calls may hang indefinitely (see BUG-001)
- Cannot work across multiple files simultaneously

**Best For**:
- Creating pages
- Modifying designs
- Programmatic design generation
- Interactive design manipulation

---

## Decision Matrix

| Need | Use Server |
|------|------------|
| List/browse projects | `penpot` |
| Extract design tokens | `penpot` |
| Export assets | Either (penpot more reliable) |
| Read shape properties | `penpot` |
| Create pages | `penpot-plugin` |
| Modify shapes | `penpot-plugin` |
| Batch operations across files | `penpot` (read) / REST API (create) |
| Reliable automation | `penpot` + REST API |

## Recommended Hybrid Workflow

```
1. Project Setup (REST API)
   └── Create projects and files via scripts/penpot-setup.sh

2. Design Reading (penpot MCP)
   └── Extract tokens, export assets, read structures

3. Design Modification (penpot-plugin MCP)
   └── Create pages, add shapes (when working)
   └── FALLBACK: Manual creation in Penpot UI

4. Design-to-Code (penpot MCP)
   └── Read designs, generate code
```

## Current Status (2026-02-23)

| Server | Status |
|--------|--------|
| `penpot` | Working |
| `penpot-plugin` | Not working (BUG-001) |
| REST API | Working (with Accept header fix) |

## Related
- bug-001-penpot-plugin-api-calls-hang.md
- constraint-001-per-file-browser-connection.md
- constraint-002-rest-api-cannot-create-pages.md
