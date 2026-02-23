# Phase 0: Development Setup

This phase covers the foundational setup required before Phase 1 development begins.

## Objectives

1. Initialize project scaffolding
2. Configure development environment
3. Set up CI/CD pipeline
4. Establish code quality standards
5. Document development workflow

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

# State & Data
bun add better-sqlite3
bun add -d @types/better-sqlite3

# Real-time
bun add chokidar
bun add ws
bun add -d @types/ws

# CLI Integration
bun add execa

# Testing
bun add -d vitest @testing-library/svelte jsdom
bun add -d playwright @playwright/test
bun add -d @vitest/coverage-v8
```

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

# Development
LOG_LEVEL=debug
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

## 8. Database Setup for Development

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

## References

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [ADR-0002: Use Bun](../../../../../docs/src/adrs/0002-use-bun-as-primary-runtime.md)
- [ADR-0003: Use SvelteKit](../../../../../docs/src/adrs/0003-use-sveltekit-as-frontend-framework.md)
