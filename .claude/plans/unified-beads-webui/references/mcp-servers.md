# MCP Servers for Development

This document catalogs MCP servers relevant to Unified Beads WebUI development.

## Core Stack Servers

These directly support our SvelteKit + Tailwind + SQLite stack.

### Tailwind-Svelte-Assistant

**Repository**: [CaullenOmdahl/Tailwind-Svelte-Assistant](https://github.com/CaullenOmdahl/Tailwind-Svelte-Assistant)

**Purpose**: Complete SvelteKit and Tailwind CSS documentation with code snippets.

**Features**:
- 100% SvelteKit coverage (1.04 MB LLM-optimized docs)
- 100% Tailwind CSS coverage (2.1 MB, all 249 files)
- Intelligent search within documentation
- Input validation and security features
- LRU caching (80-95% hit rates)

**Note**: Not published to npm. Use Smithery for installation.

**Configuration**:
```json
{
  "mcpServers": {
    "tailwind-svelte": {
      "command": "npx",
      "args": ["-y", "@smithery/cli", "run", "@CaullenOmdahl/tailwind-svelte-assistant"]
    }
  }
}
```

---

### sveltejs/mcp

**Repository**: [sveltejs/svelte.dev](https://github.com/sveltejs/svelte.dev) (mcp directory)

**Docs**: [Svelte MCP Local Setup](https://svelte.dev/docs/mcp/local-setup)

**Purpose**: Official Svelte MCP server.

**Features**:
- Svelte documentation access
- Code generation suggestions
- Available as hosted remote or local npm package

**Package**: `@sveltejs/mcp` (v0.1.20)

**Configuration**:
```json
{
  "mcpServers": {
    "svelte": {
      "command": "npx",
      "args": ["-y", "@sveltejs/mcp"]
    }
  }
}
```

---

### mcp-server-sqlite-npx

**Repository**: [johnnyoshika/mcp-server-sqlite-npx](https://github.com/johnnyoshika/mcp-server-sqlite-npx)

**Purpose**: Query and interact with SQLite databases.

**Features**:
- Query local SQLite databases
- Node.js implementation (works where Python UVX unavailable)
- MCP Inspector for testing
- Cross-platform (macOS, Windows, Linux)

**Use Case**: Debug and explore `.beads/beads.db` during development.

**Package**: `mcp-server-sqlite-npx`

**Configuration**:
```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    }
  }
}
```

---

### shadcn-ui-mcp-server

**Repository**: [Jpisnice/shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server)

**Purpose**: Access shadcn/ui components across frameworks.

**Features**:
- Multi-framework: React, **Svelte**, Vue, React Native
- Component source code retrieval
- Usage examples and metadata
- shadcn/ui v4 support

**Use Case**: Reference shadcn-svelte patterns for component implementation.

**Package**: `shadcn-ui-mcp-server`

**Configuration**:
```json
{
  "mcpServers": {
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    }
  }
}
```

---

### svelte-llm-mcp (formerly llmctx)

**Repository**: [khromov/svelte-llm-mcp](https://github.com/khromov/svelte-llm-mcp)

**Purpose**: LLM-optimized Svelte/SvelteKit documentation.

**Features**:
- Transforms documentation into AI-ready formats
- Preset URLs for quick access
- Regular updates from official sources
- Hosted endpoint available

**Hosted Endpoint**: `https://svelte-llm.stanislav.garden/mcp/`

**Configuration**:
```json
{
  "mcpServers": {
    "svelte-llm": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://svelte-llm.stanislav.garden/mcp/"]
    }
  }
}
```

---

## Development Tools

### mcp-nodejs-debugger

**Repository**: [hyperdrive-eng/mcp-nodejs-debugger](https://github.com/hyperdrive-eng/mcp-nodejs-debugger)

**Purpose**: Runtime debugging for Node.js applications.

**Features**:
- Set breakpoints at file:line locations
- Execute JavaScript in running context
- Inspect variables at runtime
- Monitor connection states

**Use Case**: Debug SvelteKit server routes when using Node.js fallback.

**Package**: `@hyperdrive-eng/mcp-nodejs-debugger` (v0.2.2)

**Configuration**:
```json
{
  "mcpServers": {
    "nodejs-debugger": {
      "command": "npx",
      "args": ["-y", "@hyperdrive-eng/mcp-nodejs-debugger"]
    }
  }
}
```

---

### DevRAG

**Repository**: [tomohiro-owada/devrag](https://github.com/tomohiro-owada/devrag)

**Purpose**: Lightweight RAG system for documentation search.

**Features**:
- Semantic vector search over markdown docs
- 40x fewer tokens vs traditional reading
- 15x faster searches (~95ms for 100 files)
- Automatic indexing of `.md` files
- GPU/CPU auto-detection
- 100+ language support

**Use Case**: Search project documentation in `/plans/unified-beads-webui/`.

**Install**: `brew install devrag` or see repo for other methods.

**Configuration**:
```json
{
  "mcpServers": {
    "devrag": {
      "command": "devrag",
      "args": ["serve", "--dir", ".claude/plans"]
    }
  }
}
```

---

## Design & Assets

### penpot-mcp (Official Plugin)

**Repository**: [penpot/penpot](https://github.com/penpot/penpot/tree/develop/mcp)

**Purpose**: Interactive AI integration with Penpot design files via browser plugin.

**Features**:
- Execute code in Penpot Plugin environment
- Real-time design manipulation
- WebSocket connection to browser plugin

**Requirements**:
1. Clone penpot/penpot repo
2. `cd mcp && npm run bootstrap`
3. Connect browser plugin in Penpot UI

**Endpoints**:
- HTTP: `localhost:4401/mcp`
- SSE: `localhost:4401/sse`

**Configuration**:
```json
{
  "mcpServers": {
    "penpot-plugin": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:4401/mcp", "--allow-http"]
    }
  }
}
```

---

### penpot-mcp (API Client)

**Repository**: [montevive/penpot-mcp](https://github.com/montevive/penpot-mcp)

**Purpose**: Headless API access to Penpot design files.

**Features**:
- Query design data via API
- Export objects as images
- Search objects by name
- Works without browser

**Package**: `penpot-mcp` (via uvx/pip)

**Configuration**:
```json
{
  "mcpServers": {
    "penpot": {
      "command": "uvx",
      "args": ["penpot-mcp"],
      "env": {
        "PENPOT_API_URL": "http://localhost:9001/api",
        "PENPOT_USERNAME": "your-email",
        "PENPOT_PASSWORD": "your-password"
      }
    }
  }
}
```

---

### icogenie

**Repository**: [albertnahas/icogenie-mcp](https://github.com/albertnahas/icogenie-mcp)

**Purpose**: AI-powered SVG icon generation.

**Features**:
- Generate icons from text descriptions
- Multiple sizes and formats
- Production-ready SVG output
- Style customization

**Use Case**: Generate app icons and UI assets.

**Package**: `@icogenie/mcp` (v0.4.2)

**Configuration**:
```json
{
  "mcpServers": {
    "icogenie": {
      "command": "npx",
      "args": ["-y", "@icogenie/mcp"]
    }
  }
}
```

---

## Internationalization

### intlayer

**Repository**: [aymericzip/intlayer](https://github.com/aymericzip/intlayer)

**Docs**: [Intlayer MCP Server](https://github.com/aymericzip/intlayer/blob/main/docs/docs/en/mcp_server.md)

**Purpose**: Internationalization (i18n) tooling.

**Features**:
- Content declaration management
- Translation key extraction
- Multi-language support
- AI-powered translations
- Visual editor integration

**Use Case**: Add multi-language support to WebUI (Phase 5+).

**Package**: `@intlayer/mcp` (v8.1.3)

**Configuration**:
```json
{
  "mcpServers": {
    "intlayer": {
      "command": "npx",
      "args": ["-y", "@intlayer/mcp"]
    }
  }
}
```

---

## Recommended Configuration

### Minimal Setup (Core Development)

```json
{
  "mcpServers": {
    "svelte": {
      "command": "npx",
      "args": ["-y", "@sveltejs/mcp"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    },
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    }
  }
}
```

### Full Setup (All Features)

```json
{
  "mcpServers": {
    "tailwind-svelte": {
      "command": "npx",
      "args": ["-y", "@smithery/cli", "run", "@CaullenOmdahl/tailwind-svelte-assistant"]
    },
    "svelte": {
      "command": "npx",
      "args": ["-y", "@sveltejs/mcp"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    },
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    },
    "svelte-llm": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://svelte-llm.stanislav.garden/mcp/"]
    },
    "devrag": {
      "command": "devrag",
      "args": ["serve", "--dir", ".claude/plans"]
    },
    "nodejs-debugger": {
      "command": "npx",
      "args": ["-y", "@hyperdrive-eng/mcp-nodejs-debugger"]
    },
    "penpot-plugin": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:4401/mcp", "--allow-http"]
    },
    "penpot": {
      "command": "uvx",
      "args": ["penpot-mcp"],
      "env": {
        "PENPOT_API_URL": "http://localhost:9001/api",
        "PENPOT_USERNAME": "demo@example.com",
        "PENPOT_PASSWORD": "123123"
      }
    },
    "icogenie": {
      "command": "npx",
      "args": ["-y", "@icogenie/mcp"]
    },
    "intlayer": {
      "command": "npx",
      "args": ["-y", "@intlayer/mcp"]
    }
  }
}
```

---

## Server Categories by Phase

| Phase | Recommended Servers |
|-------|---------------------|
| **Phase 1: MVP** | svelte, sqlite, shadcn-svelte |
| **Phase 2: Analytics** | + devrag (for doc search) |
| **Phase 3: Git Integration** | + nodejs-debugger |
| **Phase 4: Agents** | (no additional) |
| **Phase 5: Gas-Town** | + intlayer, icogenie, penpot |

---

## References

- [MCP Servers Directory](https://mcpservers.org/)
- [MCP Market](https://mcpmarket.com/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Svelte MCP Docs](https://svelte.dev/docs/mcp/local-setup)
- [ADR-0002: Use Bun as Runtime](../../../../../docs/src/adrs/0002-use-bun-as-primary-runtime.md)
- [ADR-0003: Use SvelteKit](../../../../../docs/src/adrs/0003-use-sveltekit-as-frontend-framework.md)

<!--https://smithery.ai/servers/Nekzus/npm-sentinel-mcp-->
<!--https://smithery.ai/servers/icons8community/icons8mpc-->
