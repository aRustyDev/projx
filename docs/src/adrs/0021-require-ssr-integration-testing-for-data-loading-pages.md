---
number: 21
title: Require SSR Integration Testing for Data-Loading Pages
status: accepted
date: 2026-02-25
tags:
  - testing
  - ssr
  - integration
deciders:
  - adam
---

# Require SSR Integration Testing for Data-Loading Pages

## Context and Problem Statement

During v0.0.6 development, the WebUI shipped with a critical gap: pages rendered correctly in unit tests but showed no data in production builds. The root cause was that data loading happened in `onMount()` (client-side only) but required server-side modules (`better-sqlite3`) that cannot run in browsers. Unit tests with mocks passed, but the actual server→client data flow was never tested.

How do we prevent similar "seam bugs" where isolated unit tests pass but integrated production builds fail?

## Decision Drivers

* Unit tests with mocks hide integration failures at server/client boundaries
* SvelteKit's SSR architecture requires explicit server-side data loading via `+page.server.ts`
* Native Node modules (better-sqlite3, fs, etc.) cannot be dynamically imported client-side
* Production builds behave differently than dev mode hot-reloading
* Manual QA of every page is error-prone and doesn't scale

## Considered Options

* **Option 1**: Add SSR smoke tests to CI that verify data flows through production builds
* **Option 2**: Rely on E2E tests (Playwright) to catch integration issues
* **Option 3**: Add BDD-style feature tests with Cucumber/Gherkin
* **Option 4**: Manual QA checklist before releases

## Decision Outcome

Chosen option: **Option 1 + Option 2 combined** - Add SSR smoke tests AND require E2E tests for data-loading pages.

SSR smoke tests verify the server→client data contract quickly in CI, while E2E tests verify complete user journeys. Together they provide defense-in-depth against seam bugs.

### Consequences

* Good, because seam bugs are caught before release
* Good, because tests document expected data flow behavior
* Good, because CI feedback is fast (smoke tests) and comprehensive (E2E)
* Bad, because additional test infrastructure requires maintenance
* Bad, because E2E tests are slower than unit tests

### Confirmation

Compliance is confirmed by:

1. **CI pipeline check**: SSR smoke test job must pass before merge
2. **Test coverage requirement**: Pages with `+page.server.ts` must have corresponding E2E test
3. **Code review checklist**: Reviewer verifies data loading tests exist for new pages

## Implementation

### 1. SSR Smoke Tests

Create `tests/ssr/smoke.test.ts` that:
- Builds the production app
- Starts the server
- Fetches each data-loading route
- Verifies response contains expected data markers

```typescript
// tests/ssr/smoke.test.ts
test('issues page returns server-rendered data', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();

  // Verify server-rendered content exists (not just client shell)
  expect(html).toContain('data-testid="issue-table"');
  expect(html).not.toContain('No issues found'); // Unless DB is empty
});
```

### 2. E2E Test Requirement

For each page with `+page.server.ts`, require a Playwright test:

```typescript
// tests/e2e/issues.spec.ts
test('issues page displays database issues', async ({ page }) => {
  await page.goto('/');

  // Wait for server-rendered content
  await expect(page.getByTestId('issue-table')).toBeVisible();

  // Verify actual data appears (not empty state)
  const rows = page.getByRole('row');
  await expect(rows).toHaveCount.greaterThan(1);
});
```

### 3. CI Pipeline Addition

```yaml
# .github/workflows/ci.yml
jobs:
  ssr-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run test:ssr
```

## Pattern: Server-Side Data Loading

All pages that require database access MUST follow this pattern:

```
+page.server.ts  →  loads data server-side
       ↓
+page.svelte     →  receives data via `data` prop
       ↓
client           →  hydrates with server data, no client-side fetch needed
```

**Anti-pattern** (what caused the bug):
```
+page.svelte     →  onMount() tries to import server modules
       ↓
client           →  import fails silently, data is empty
```

## More Information

- **Incident**: v0.0.6 WebUI showed empty issues list despite database containing data
- **Root cause**: `app.svelte.ts` dynamically imported `$lib/server/db/dal.js` in browser context
- **Fix**: Added `+page.server.ts` files to load data server-side
- **Related**: SvelteKit docs on [Loading Data](https://kit.svelte.dev/docs/load)
