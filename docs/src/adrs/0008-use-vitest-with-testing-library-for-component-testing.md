---
number: 8
title: Use Vitest with Testing Library for Component Testing
status: accepted
date: 2026-02-24
tags:
  - testing
  - components
  - svelte
deciders:
  - aRustyDev
---

# Use Vitest with Testing Library for Component Testing

## Context and Problem Statement

The Unified Beads WebUI needs a testing strategy for Svelte 5 components. The testing framework must support modern Svelte 5 features including runes ($props, $state, $derived), provide a good developer experience with fast feedback, and integrate well with SvelteKit.

## Decision Drivers

* **Svelte 5 compatibility**: Must work with new runes API and compilation model
* **Speed**: Fast test execution for TDD workflow
* **Developer experience**: Good error messages, watch mode, IDE integration
* **Ecosystem**: Compatible with Testing Library patterns
* **SvelteKit integration**: Works with SvelteKit's module resolution and aliases
* **TDD workflow**: Support red-green-refactor cycle efficiently

## Considered Options

* **Vitest + @testing-library/svelte** - Modern test runner with Testing Library
* **Playwright Component Testing** - Browser-based component tests
* **Bun Test** - Bun's built-in test runner
* **Jest + @testing-library/svelte** - Traditional choice

## Decision Outcome

Chosen option: **Vitest + @testing-library/svelte**, because it provides the best combination of speed, Svelte 5 compatibility, and Testing Library's user-centric testing philosophy.

### Consequences

* Good, because Vitest shares Vite's transform pipeline with SvelteKit
* Good, because @testing-library/svelte v5.x has native Svelte 5 support
* Good, because sub-second test execution enables TDD workflow
* Good, because watch mode with HMR provides instant feedback
* Good, because Testing Library encourages testing from user perspective
* Good, because jest-dom matchers provide expressive assertions
* Neutral, because requires jsdom environment configuration for DOM testing
* Bad, because some native Node modules (better-sqlite3) need mocking strategies

### Confirmation

* All component tests pass with `npx vitest run`
* Test coverage reports generated for CI
* Watch mode used during development

## Pros and Cons of the Options

### Vitest + @testing-library/svelte

Modern test runner designed for Vite-based projects.

* Good, because uses same transform pipeline as SvelteKit dev server
* Good, because @testing-library/svelte v5.x supports Svelte 5 natively
* Good, because test execution is extremely fast (~100ms for component tests)
* Good, because excellent VS Code extension support
* Good, because jest-dom matchers work via @testing-library/jest-dom/vitest
* Good, because snapshot testing available when needed
* Neutral, because requires resolve.conditions for browser exports in jsdom
* Bad, because native modules need dependency injection for testability

### Playwright Component Testing

Browser-based component testing with real browser engine.

* Good, because tests run in real browser environment
* Good, because no DOM mocking issues
* Good, because can test visual aspects directly
* Neutral, because slower startup than Vitest
* Bad, because heavier infrastructure (browser process)
* Bad, because less suitable for rapid TDD iteration
* Bad, because Svelte 5 support still maturing

### Bun Test

Bun's built-in test runner.

* Good, because native Bun integration
* Good, because extremely fast execution
* Good, because simple setup
* Bad, because limited ecosystem (no Testing Library integration)
* Bad, because no Svelte-specific tooling
* Bad, because vi.mock hoisting issues with ESM modules
* Bad, because less mature than Vitest

### Jest + @testing-library/svelte

Traditional choice with large ecosystem.

* Good, because largest testing ecosystem
* Good, because extensive documentation
* Good, because mature and stable
* Bad, because slower than Vitest
* Bad, because requires additional configuration for ESM
* Bad, because transform caching issues with Vite projects
* Bad, because separate configuration from Vite dev server

## More Information

### Required Configuration

The vitest.config.ts requires specific configuration for Svelte 5 component testing:

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    // Force browser exports for Svelte in tests
    conditions: ['browser', 'development']
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true
  }
});
```

### Key Insight: resolve.conditions

The `resolve.conditions: ['browser', 'development']` is critical for Svelte 5 testing. Without it, Vitest resolves Svelte to server exports, causing "mount(...) is not available on the server" errors.

### Gotcha: `bun test` vs `bun run test:unit`

**Always use `bun run test:unit`**, never `bun test`:

| Command | Runner | jsdom | Result |
|---------|--------|-------|--------|
| `bun test` | Bun's native | ❌ No | DOM tests fail with "document is not defined" |
| `bun run test:unit` | Vitest | ✅ Yes | Works correctly |

This is a common mistake because `bun test` looks like it should work. Bun's native test runner is fast but lacks jsdom support required for component testing. The justfile recipes use the correct command.

### Test Setup File

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());
vi.stubGlobal('matchMedia', vi.fn().mockImplementation(/* ... */));
```

### References

* [Vitest Documentation](https://vitest.dev/)
* [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro)
* [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
