# Test Strategy

This document defines the testing approach for the Unified Beads WebUI.

## Overview

Testing is structured in three tiers to balance coverage, speed, and maintenance:

1. **Unit Tests** - Fast, isolated component/function tests
2. **Integration Tests** - API routes and data layer validation
3. **E2E Tests** - Critical user journeys through the full application

---

## Testing Stack

| Tool | Purpose | Version |
|------|---------|---------|
| Vitest | Unit and integration tests | 2.x |
| @testing-library/svelte | Component testing | Latest |
| Playwright | E2E browser testing | Latest |
| MSW | API mocking | 2.x |

---

## Unit Tests

### Coverage Targets

| Area | Coverage | Priority |
|------|----------|----------|
| Stores (Svelte) | 90% | High |
| Utility functions | 95% | High |
| Data transformations | 90% | High |
| Components (logic) | 80% | Medium |
| Components (rendering) | 60% | Low |

### What to Test

**Always test:**
- State management logic (stores, runes)
- Data transformation functions
- Error handling paths
- ProcessSupervisor command building
- Filter/sort logic

**Selectively test:**
- Component rendering (focus on conditional logic)
- Event handlers with side effects

**Skip testing:**
- Pure presentation components
- Third-party library wrappers
- CSS/styling

### Example: Store Test

```typescript
// src/lib/stores/issues.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createIssueStore } from './issues.svelte';

describe('issueStore', () => {
  it('filters issues by status', () => {
    const store = createIssueStore();
    store.setIssues([
      { id: 'bd-1', status: 'open' },
      { id: 'bd-2', status: 'closed' },
    ]);

    store.setFilter({ status: ['open'] });

    expect(store.filtered).toHaveLength(1);
    expect(store.filtered[0].id).toBe('bd-1');
  });

  it('handles empty filter gracefully', () => {
    const store = createIssueStore();
    store.setIssues([{ id: 'bd-1', status: 'open' }]);
    store.setFilter({});

    expect(store.filtered).toHaveLength(1);
  });
});
```

### Example: ProcessSupervisor Test

```typescript
// src/lib/cli/supervisor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ProcessSupervisor } from './supervisor';

describe('ProcessSupervisor', () => {
  it('builds correct bd create command', () => {
    const supervisor = new ProcessSupervisor({ dryRun: true });

    const command = supervisor.buildCommand('bd', [
      'create', 'My Issue', '--priority', '1'
    ]);

    expect(command).toEqual(['bd', 'create', 'My Issue', '--priority', '1']);
  });

  it('respects circuit breaker when open', async () => {
    const supervisor = new ProcessSupervisor();
    supervisor.tripCircuitBreaker();

    await expect(supervisor.execute('bd', ['list']))
      .rejects.toThrow('Circuit breaker open');
  });
});
```

---

## Integration Tests

### Scope

Integration tests validate the interaction between:
- API routes and data layer
- ProcessSupervisor and CLI execution
- WebSocket handlers and file watcher
- Database queries (SQLite/Dolt)

### Test Database Strategy

```typescript
// vitest.setup.ts
import { beforeEach, afterEach } from 'vitest';
import Database from 'bun:sqlite';

let testDb: Database;

beforeEach(() => {
  // Create in-memory database for each test
  testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      priority INTEGER DEFAULT 2
    );
  `);
});

afterEach(() => {
  testDb.close();
});
```

### Example: API Route Test

```typescript
// src/routes/api/issues/+server.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './+server';
import { createMockRequest } from '$lib/test-utils';

describe('GET /api/issues', () => {
  it('returns paginated issues', async () => {
    const request = createMockRequest({
      url: '/api/issues?limit=10&offset=0'
    });

    const response = await GET({ request });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
  });

  it('filters by status', async () => {
    const request = createMockRequest({
      url: '/api/issues?status=open,in_progress'
    });

    const response = await GET({ request });
    const data = await response.json();

    data.data.forEach((issue: Issue) => {
      expect(['open', 'in_progress']).toContain(issue.status);
    });
  });
});

describe('POST /api/issues', () => {
  it('creates issue via CLI', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { title: 'Test Issue', priority: 1 }
    });

    const response = await POST({ request });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toMatch(/^bd-/);
  });

  it('returns 400 for missing title', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { priority: 1 }
    });

    const response = await POST({ request });

    expect(response.status).toBe(400);
  });
});
```

### Mocking CLI Execution

```typescript
// src/lib/test-utils/mock-supervisor.ts
import { vi } from 'vitest';

export function createMockSupervisor() {
  return {
    execute: vi.fn().mockImplementation(async (cmd, args) => {
      if (cmd === 'bd' && args[0] === 'create') {
        return { stdout: 'bd-test123', stderr: '', exitCode: 0 };
      }
      if (cmd === 'bd' && args[0] === 'list') {
        return {
          stdout: JSON.stringify([
            { id: 'bd-1', title: 'Test', status: 'open' }
          ]),
          stderr: '',
          exitCode: 0
        };
      }
      throw new Error(`Unmocked command: ${cmd} ${args.join(' ')}`);
    }),
  };
}
```

---

## E2E Tests

### Critical Journeys

These user journeys must always pass:

| Journey | Priority | Frequency |
|---------|----------|-----------|
| Create issue | P0 | Every PR |
| Update issue status | P0 | Every PR |
| View Kanban board | P0 | Every PR |
| Filter/search issues | P1 | Every PR |
| View metrics dashboard | P1 | Daily |
| Drag-and-drop Kanban | P2 | Weekly |
| Terminal interaction | P2 | Weekly |

### Example: Create Issue Journey

```typescript
// e2e/create-issue.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create Issue', () => {
  test('creates issue via modal', async ({ page }) => {
    await page.goto('/');

    // Open create modal
    await page.click('[data-testid="create-issue-button"]');
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible();

    // Fill form
    await page.fill('[data-testid="issue-title"]', 'E2E Test Issue');
    await page.selectOption('[data-testid="issue-type"]', 'task');
    await page.selectOption('[data-testid="issue-priority"]', '2');

    // Submit
    await page.click('[data-testid="submit-issue"]');

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('text=E2E Test Issue')).toBeVisible();
  });

  test('shows validation error for empty title', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="create-issue-button"]');
    await page.click('[data-testid="submit-issue"]');

    await expect(page.locator('[data-testid="title-error"]')).toHaveText(
      'Title is required'
    );
  });
});
```

### Example: Kanban Drag-and-Drop

```typescript
// e2e/kanban-dnd.spec.ts
import { test, expect } from '@playwright/test';

test('moves issue between columns', async ({ page }) => {
  await page.goto('/kanban');

  const card = page.locator('[data-testid="issue-card-bd-1"]');
  const targetColumn = page.locator('[data-testid="column-in_progress"]');

  // Drag card to new column
  await card.dragTo(targetColumn);

  // Verify card moved
  await expect(targetColumn.locator('[data-testid="issue-card-bd-1"]')).toBeVisible();

  // Verify status updated
  await expect(card.locator('[data-status]')).toHaveAttribute('data-status', 'in_progress');
});
```

### E2E Test Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Data Management

### Fixtures

```typescript
// src/lib/test-utils/fixtures.ts
export const fixtures = {
  issues: {
    open: {
      id: 'bd-fixture-1',
      title: 'Open Test Issue',
      status: 'open',
      priority: 2,
      issue_type: 'task',
      created_at: '2026-02-20T10:00:00Z',
    },
    inProgress: {
      id: 'bd-fixture-2',
      title: 'In Progress Issue',
      status: 'in_progress',
      priority: 1,
      assignee: 'alice',
    },
    blocked: {
      id: 'bd-fixture-3',
      title: 'Blocked Issue',
      status: 'blocked',
      blocked_by: ['bd-fixture-1'],
    },
  },

  epics: {
    withChildren: {
      id: 'bd-epic-1',
      title: 'Test Epic',
      issue_type: 'epic',
      children_count: 3,
    },
  },
};
```

### Database Seeding (E2E)

```typescript
// e2e/setup/seed.ts
import { execSync } from 'child_process';

export async function seedTestDatabase() {
  // Create test issues via CLI
  execSync('bd create "E2E Test Issue 1" --priority 1 --type task');
  execSync('bd create "E2E Test Issue 2" --priority 2 --type feature');
  execSync('bd create "E2E Test Epic" --type epic');
}

export async function cleanTestDatabase() {
  // Close all test issues
  execSync('bd sql "DELETE FROM issues WHERE title LIKE \'E2E%\'"');
}
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test:unit

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test:integration

  e2e:
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
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Test Organization

```
src/
├── lib/
│   ├── stores/
│   │   ├── issues.svelte.ts
│   │   └── issues.test.ts          # Co-located unit tests
│   ├── cli/
│   │   ├── supervisor.ts
│   │   └── supervisor.test.ts
│   └── test-utils/
│       ├── fixtures.ts
│       ├── mock-supervisor.ts
│       └── render.ts
├── routes/
│   └── api/
│       └── issues/
│           ├── +server.ts
│           └── +server.test.ts     # Co-located API tests
e2e/
├── create-issue.spec.ts
├── kanban-dnd.spec.ts
├── metrics.spec.ts
└── setup/
    ├── global-setup.ts
    └── seed.ts
```

---

## Accessibility Testing

### Tools

| Tool | Purpose | When |
|------|---------|------|
| axe-core | Automated a11y checks | Unit/Integration |
| @axe-core/playwright | E2E a11y testing | E2E tests |
| Lighthouse CI | Performance + a11y audit | CI pipeline |
| Storybook a11y addon | Component-level checks | Development |

### Unit/Integration: axe-core

```typescript
// src/lib/test-utils/a11y.ts
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/svelte';

expect.extend(toHaveNoViolations);

export async function checkA11y(component: any, props?: Record<string, unknown>) {
  const { container } = render(component, { props });
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
```

```typescript
// Button.test.ts
import { checkA11y } from '$lib/test-utils/a11y';
import Button from './Button.svelte';

test('Button has no a11y violations', async () => {
  await checkA11y(Button, { children: 'Click me' });
});

test('Disabled button has no a11y violations', async () => {
  await checkA11y(Button, { children: 'Click me', disabled: true });
});
```

### E2E: @axe-core/playwright

```typescript
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('Home page has no a11y violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Kanban board has no a11y violations', async ({ page }) => {
    await page.goto('/kanban');

    const results = await new AxeBuilder({ page })
      .exclude('[data-testid="terminal-drawer"]') // Exclude xterm
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Create issue modal has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="create-issue-button"]');

    const results = await new AxeBuilder({ page })
      .include('[data-testid="create-modal"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true

      - name: Check a11y score
        run: |
          SCORE=$(cat .lighthouseci/lhr-*.json | jq '.categories.accessibility.score')
          if (( $(echo "$SCORE < 0.9" | bc -l) )); then
            echo "Accessibility score $SCORE is below 0.9 threshold"
            exit 1
          fi
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "bun run preview",
      "url": ["http://localhost:4173/", "http://localhost:4173/kanban"]
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.8 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Storybook a11y Addon

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-a11y', // Add this
  ],
};
```

```typescript
// Button.stories.ts
export const Default: Story = {
  args: { variant: 'default' },
  parameters: {
    a11y: {
      // Configure per-story
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};
```

### WCAG 2.1 AA Checklist

| Criterion | Automated | Manual Required |
|-----------|-----------|-----------------|
| 1.1.1 Non-text Content | axe-core | Complex images |
| 1.3.1 Info and Relationships | axe-core | Semantic review |
| 1.4.3 Contrast (Minimum) | axe-core | - |
| 2.1.1 Keyboard | Playwright | Tab order review |
| 2.4.3 Focus Order | Playwright | Logical flow |
| 2.4.7 Focus Visible | axe-core | Visual check |
| 4.1.2 Name, Role, Value | axe-core | Custom widgets |

### Package Scripts (Updated)

```json
{
  "scripts": {
    "test:a11y": "playwright test e2e/a11y.spec.ts",
    "lighthouse": "lhci autorun",
    "storybook:a11y": "storybook dev -p 6006 -- --docs"
  }
}
```

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro)
- [Svelte 5 Testing Patterns](https://svelte.dev/docs/testing)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
