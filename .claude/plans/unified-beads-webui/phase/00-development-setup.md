# Phase 0: Development Setup

**Duration**: 1 day (8-12 hours)
**Theme**: Foundational project setup

This phase covers the foundational setup required before Phase 1 development begins.

## Objectives

1. Initialize project scaffolding
2. Configure development environment
3. Set up CI/CD pipeline
4. Establish code quality standards
5. Document development workflow

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Project runs | `bun dev` starts without errors | Manual test |
| Type checking | `bun run check` passes with 0 errors | CI green |
| Linting | `bun run lint` passes with 0 errors | CI green |
| Tests run | `bun test` executes (even with no tests) | CI green |
| Pre-commit works | Commit triggers lint-staged | Manual test |
| CI pipeline | All CI jobs pass on push | GitHub Actions green |
| bd CLI available | `bd --version` returns version | Manual test |
| Database accessible | `bd sql "SELECT 1"` returns 1 | Manual test |

---

## Prerequisites

### bd CLI Installation

The `bd` (Beads) CLI is required for issue management.

**Pre-installed via Brewfile:**

The `bd` CLI is already installed via the project's Brewfile. Verify with:

```bash
bd --version
# Expected: bd 0.x.x

bd init --help
# Expected: Usage information
```

**Manual installation (if not using Brewfile):**

```bash
# Option 1: Install via Homebrew (recommended)
brew install beads

# Option 2: Install via cargo
cargo install beads-cli

# Option 3: Install from source
git clone https://github.com/your-org/beads.git
cd beads && cargo install --path crates/bd
```

### Optional: gt CLI (for Phase 5)

```bash
# Install Gas-Town CLI (optional, needed for Phase 5)
cargo install gastown-cli

gt --version
```

---

## 1. Project Scaffolding

### Initialize SvelteKit Project

```bash
# Create project with Bun
bunx create-svelte@latest projx-ui

# Options:
# - Skeleton project
# - TypeScript
# - ESLint + Prettier
# - Playwright
# - Vitest

cd projx-ui
bun install
```

### Add Core Dependencies

```bash
# Core
bun add tailwindcss@next @tailwindcss/vite tailwind-variants
bun add lucide-svelte
bun add @sveltejs/adapter-node  # Server adapter

# State & Data
bun add better-sqlite3           # SQLite support
bun add mysql2                   # Dolt support
bun add -d @types/better-sqlite3

# Drag-and-Drop (finalized library choice)
bun add svelte-dnd-action        # Svelte-native DnD

# Real-time
bun add chokidar
bun add ws
bun add -d @types/ws

# CLI Integration
bun add execa

# Observability (ADR-0011)
bun add @opentelemetry/api
bun add @opentelemetry/sdk-node
bun add @opentelemetry/sdk-trace-node
bun add @opentelemetry/sdk-metrics
bun add @opentelemetry/exporter-trace-otlp-http
bun add @opentelemetry/exporter-metrics-otlp-http
bun add @opentelemetry/semantic-conventions
bun add pino pino-pretty

# Testing
bun add -d vitest @testing-library/svelte jsdom
bun add -d playwright @playwright/test
bun add -d @vitest/coverage-v8
bun add -d axe-core @axe-core/playwright  # Accessibility testing
```

### SvelteKit Adapter Configuration

```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,
    }),
  },
};

export default config;
```

### Vite Configuration with Tailwind CSS v4

Tailwind CSS v4 uses a Vite plugin instead of PostCSS. Configure `vite.config.ts`:

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
  ],
});
```

Create the CSS entry point `src/app.css`:

```css
/* src/app.css */
@import "tailwindcss";

/* Custom design tokens */
@theme {
  --color-primary: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* RAG status colors */
  --color-rag-green: #22c55e;
  --color-rag-amber: #f59e0b;
  --color-rag-red: #ef4444;
}
```

Import in the root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

**Note**: Tailwind CSS v4 does not require `tailwind.config.js` - configuration is done in CSS with `@theme` and `@source` directives.

### Directory Structure

```
projx-ui/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── preview.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── src/
│   ├── lib/
│   │   ├── components/     # Shared components
│   │   ├── stores/         # Svelte 5 state (*.svelte.ts)
│   │   ├── cli/            # ProcessSupervisor, command builders
│   │   ├── db/             # Data access layer
│   │   ├── telemetry/      # OpenTelemetry setup (ADR-0011)
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── routes/
│   │   ├── api/            # API endpoints
│   │   ├── (app)/          # App routes (layout group)
│   │   └── +layout.svelte
│   └── app.html
├── static/
├── e2e/                    # Playwright tests
├── docs/                   # Project documentation
└── .storybook/             # Component documentation
```

---

## 2. Development Environment

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Bun | 1.1+ | Runtime and package manager |
| Node.js | 20+ | Fallback compatibility |
| Git | 2.40+ | Version control |
| Docker | 24+ | Optional: Penpot, services |

### VS Code Extensions (Recommended)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vitest.explorer",
    "ms-playwright.playwright"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "svelte.enable-ts-plugin": true,
  "tailwindCSS.experimental.classRegex": [
    ["tv\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Environment Variables

```bash
# .env.example
# Database (auto-detected if not set)
BEADS_DB_PATH=.beads/beads.db
DOLT_HOST=127.0.0.1
DOLT_PORT=3307

# Server
HOST=127.0.0.1
PORT=3000

# Feature Flags
ENABLE_GASTOWN=false
ENABLE_NETWORK_MODE=false

# Observability (ADR-0011)
# Set endpoint to enable telemetry export
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=projx-ui
OTEL_SDK_DISABLED=false  # Set true to disable in tests
LOG_LEVEL=info

# Development
NODE_ENV=development
```

---

## 3. Code Quality Standards

### ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'svelte/no-at-html-tags': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/'],
  },
];
```

### Prettier Configuration

```json
// .prettierrc
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

---

## 4. Pre-commit Hooks

### Husky Setup

```bash
bun add -d husky lint-staged @commitlint/cli @commitlint/config-conventional
bunx husky init
```

### Pre-commit Hook

```bash
# .husky/pre-commit
bun run lint-staged
```

### Lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,svelte}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Commit Message Convention

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
    ],
    'scope-enum': [
      1,
      'always',
      ['core', 'ui', 'api', 'cli', 'db', 'realtime', 'kanban', 'metrics', 'gantt', 'terminal'],
    ],
  },
};
```

---

## 5. CI/CD Pipeline

### GitHub Actions: CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run check

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test:unit --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build/
```

### GitHub Actions: Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
      - uses: softprops/action-gh-release@v2
        with:
          files: build/**/*
          generate_release_notes: true
```

---

## 6. Package Scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "test": "vitest",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

---

## 7. Storybook Setup (Component Documentation)

```bash
bunx storybook@latest init --type sveltekit
```

### Storybook Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: '@storybook/sveltekit',
};

export default config;
```

---

## 8. Telemetry Setup

### Module Structure

Create the telemetry module structure per [observability.md](../spec/observability.md):

```
src/lib/telemetry/
├── index.ts           # Public API exports
├── init.ts            # SDK initialization (preload)
├── tracer.ts          # Tracer configuration
├── metrics.ts         # Metrics definitions
├── logger.ts          # Pino logger with trace context
└── types.ts           # Type definitions
```

### Bun Preload Configuration

```toml
# bunfig.toml
preload = ["./src/lib/telemetry/init.ts"]
```

### Development Collector (Optional)

For local development with trace visibility, add to Docker Compose:

```yaml
# .docker/compose.yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    ports:
      - "4318:4318"   # OTLP HTTP
    command: ["--config=/etc/otel-collector-config.yaml"]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
```

### References

- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
- [Spec: Observability Architecture](../spec/observability.md)
- [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)

---

## 9. Database Setup for Development

### SQLite (Default)

```bash
# Create .beads directory structure
mkdir -p .beads

# Initialize with bd CLI (if available)
bd init

# Or create empty database
sqlite3 .beads/beads.db < schema.sql
```

### Dolt (Optional)

```bash
# Start Dolt server (via Docker or native)
docker run -d -p 3307:3306 dolthub/dolt-sql-server

# Or use justfile
just init  # Starts Penpot + services
```

---

## 9. Verification Checklist

Before starting Phase 1, verify:

- [ ] `bun dev` starts without errors
- [ ] `bun run check` passes
- [ ] `bun run lint` passes
- [ ] `bun test` runs (even if no tests yet)
- [ ] Pre-commit hooks trigger on commit
- [ ] CI pipeline passes on push
- [ ] VS Code extensions installed and working
- [ ] `.beads/` directory exists (or can be created)
- [ ] `bd --version` works (CLI installed)
- [ ] Telemetry module structure exists (`src/lib/telemetry/`)
- [ ] `bunfig.toml` has preload configured for telemetry

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| Project scaffolding | Pending |
| Development environment | Pending |
| ESLint + Prettier config | Pending |
| Pre-commit hooks | Pending |
| CI/CD workflows | Pending |
| Storybook setup | Pending |
| Database setup | Pending |
| Telemetry setup | Pending |

---

## Time Estimate

| Task | Estimate |
|------|----------|
| Project scaffolding | 2 hours |
| Dev environment | 1 hour |
| Code quality setup | 2 hours |
| CI/CD pipeline | 2 hours |
| Storybook setup | 1 hour |
| **Total** | **8 hours (1 day)** |

---

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `bun install` fails | Bun not installed or outdated | `curl -fsSL https://bun.sh/install \| bash` |
| `bd: command not found` | bd CLI not installed | See Prerequisites section |
| `better-sqlite3` build fails | Missing build tools | macOS: `xcode-select --install`, Linux: `apt install build-essential` |
| Port 3000 in use | Another process using port | `lsof -i :3000` then kill process, or use `PORT=3001 bun dev` |
| Tailwind not working | Vite plugin not configured | Verify `@tailwindcss/vite` in vite.config.ts |
| Pre-commit hook skipped | Husky not initialized | Run `bunx husky init` again |
| `.beads/` permission denied | Directory ownership issue | `chmod -R u+rw .beads/` |
| Dolt connection refused | Dolt server not running | Start with `docker run -d -p 3307:3306 dolthub/dolt-sql-server` |
| ESLint not finding files | Wrong ignore patterns | Check `eslint.config.js` ignores section |

### Diagnostic Commands

```bash
# Check all tool versions
bun --version && node --version && git --version && bd --version

# Verify database connectivity
bd sql "SELECT 1"

# Check for port conflicts
lsof -i :3000 -i :3307

# Verify Husky hooks
cat .husky/pre-commit

# Test ESLint configuration
bun run lint --debug

# Verify TypeScript setup
bunx tsc --noEmit
```

### Platform-Specific Notes

**macOS:**
- Requires Xcode Command Line Tools: `xcode-select --install`
- If `better-sqlite3` fails, try: `brew install python-setuptools`

**Linux (Ubuntu/Debian):**
- Install build essentials: `apt install build-essential python3`
- For node-pty (Phase 4): `apt install libsecret-1-dev`

**Windows (WSL2 recommended):**
- Use WSL2 with Ubuntu for best compatibility
- Native Windows may have issues with `better-sqlite3` and `node-pty`

---

## Rollback Strategy

If setup fails at any step, use these rollback procedures:

### Step 1: Project Scaffolding Failed

```bash
# Remove generated project and start fresh
rm -rf projx-ui
bunx create-svelte@latest projx-ui
```

### Step 2: Dependencies Failed

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

### Step 3: Pre-commit Hooks Failed

```bash
# Reset Husky
rm -rf .husky
bun add -d husky
bunx husky init
echo "bun run lint-staged" > .husky/pre-commit
```

### Step 4: CI/CD Failed

```bash
# Validate workflow syntax locally
gh workflow view ci.yml
gh run list --workflow=ci.yml

# Check for secrets needed
gh secret list
```

### Step 5: Database Setup Failed

```bash
# Reset .beads directory
rm -rf .beads
bd init

# Or for Dolt
docker rm -f dolt-server
docker run -d --name dolt-server -p 3307:3306 dolthub/dolt-sql-server
```

### Complete Reset

```bash
# Nuclear option: start from scratch
cd ..
rm -rf projx-ui
git clone <repo-url> projx-ui
cd projx-ui
bun install
```

---

## Phase 1 Entry Criteria

Before proceeding to Phase 1, ALL of the following must be true:

- [ ] All success criteria met (see table above)
- [ ] `bun dev` serves application at localhost:3000
- [ ] `bun run check && bun run lint` pass with 0 errors
- [ ] Pre-commit hook fires and blocks bad commits
- [ ] CI pipeline passes on a test push
- [ ] `bd --version` returns valid version
- [ ] `bd sql "SELECT 1"` returns 1 (database working)
- [ ] `.beads/` directory exists with proper permissions
- [ ] Storybook runs with `bun run storybook`

**Sign-off**: Phase 0 complete when all items checked and verified.

---

## References

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [ADR-0002: Use Bun](../../../../../docs/src/adrs/0002-use-bun-as-primary-runtime.md)
- [ADR-0003: Use SvelteKit](../../../../../docs/src/adrs/0003-use-sveltekit-as-frontend-framework.md)
