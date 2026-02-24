# Testing Strategy Proposal

> **Status**: ✅ Finalized - See [ADR-0019](../../../../docs/src/adrs/0019-testing-strategy-and-conventions.md)
> **Date**: 2026-02-24

This document captures the comprehensive testing strategy decisions for projx-ui. Each section includes reasoning, alternatives considered, and the final decision.

---

## Table of Contents

1. [Test Pyramid & Ratios](#1-test-pyramid--ratios)
2. [Test Types & Responsibilities](#2-test-types--responsibilities)
3. [Coverage Thresholds](#3-coverage-thresholds)
4. [CI Pipeline Stages](#4-ci-pipeline-stages)
5. [Test File Organization](#5-test-file-organization)
6. [Test Data Management](#6-test-data-management)
7. [Mocking Strategy](#7-mocking-strategy)
8. [Visual Regression Testing](#8-visual-regression-testing)
9. [API Contract Testing](#9-api-contract-testing)

---

## 1. Test Pyramid & Ratios

### ✅ Decision: Traditional Pyramid (50/30/15/5)

```
                    ┌───────────┐
                    │   E2E     │  5%   (~10-20 tests)
                    │  Tests    │
                ┌───┴───────────┴───┐
                │   Integration     │  15%  (~30-50 tests)
                │      Tests        │
            ┌───┴───────────────────┴───┐
            │     Component Tests       │  30%  (~100-150 tests)
            │   (Testing Library)       │
        ┌───┴───────────────────────────┴───┐
        │          Unit Tests               │  50%  (~200+ tests)
        │    (Pure functions, utilities)    │
        └───────────────────────────────────┘
```

| Test Type | Ratio | Approximate Count | Run Time Target |
|-----------|-------|-------------------|-----------------|
| Unit | 50% | 200+ | < 5 seconds |
| Component | 30% | 100-150 | < 30 seconds |
| Integration | 15% | 30-50 | < 2 minutes |
| E2E | 5% | 10-20 | < 5 minutes |

### Reasoning

Current application is data-display focused with most logic in the CLI rather than the web UI. Unit tests provide fast feedback for utilities, stores, and data transformation.

### When to Shift to Testing Trophy

Shift toward Testing Trophy (30/60/10) ratios when:
1. Bug escape rate increases in component integration points
2. Component count exceeds 20-30
3. State shared across 3+ components
4. External service integrations multiply

---

## 2. Test Types & Responsibilities

### ✅ Decision: Hybrid Integration Test Location

- **Component integration tests**: Co-located with source (`*.integration.test.ts`)
- **Cross-cutting integration tests**: Separate directory (`tests/integration/`)

### Test Type Boundaries

| Type | Scope | What's Mocked | What's Real |
|------|-------|---------------|-------------|
| **Unit** | Single component/function | All children, external services | Component's own logic |
| **Integration** | Multiple components | External services (CLI, API) | All components in the flow |
| **E2E** | Full application | Nothing | Everything including backend |

### ✅ Decision: Tag E2E Tests for Smoke

```typescript
test.describe('Smoke Tests', { tag: '@smoke' }, () => {
  test('app loads and displays issue list', async ({ page }) => {
    // Critical path test
  });
});
```

Run with: `playwright test --grep @smoke`

### ✅ Decision: Inline Regression Tests

Every bug fix includes a test with issue reference:

```typescript
it('handles null status gracefully (regression: #projx-xyz)', () => {
  // Test for specific bug
});
```

---

## 3. Coverage Thresholds

### ✅ Decision: Moderate Thresholds (70/65/75/70)

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Functions | 65% |
| Branches | 75% |
| Statements | 70% |

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 65,
    branches: 75,
    statements: 70
  }
}
```

---

## 4. CI Pipeline Stages

### ✅ Decision: E2E Required on PRs

| Stage | Tests Run | Trigger |
|-------|-----------|---------|
| Pre-commit | Affected unit/integration tests | Git commit |
| PR | All unit, integration, E2E | Pull request |
| Main | Full suite + smoke verification | Merge to main |

### ✅ Decision: Affected Tests on Pre-commit

Pre-commit hooks run tests for changed files only (~10-30s).

---

## 5. Test File Organization

### ✅ Decision: `*.test.ts` with Type Suffix

| Type | Pattern | Example |
|------|---------|---------|
| Unit/Component | `*.test.ts` | `formatters.test.ts` |
| Integration | `*.integration.test.ts` | `IssueList.integration.test.ts` |
| E2E | `*.spec.ts` | `crud.spec.ts` |

### Directory Structure

```
src/
├── lib/
│   ├── components/
│   │   └── issues/
│   │       ├── StatusDropdown.svelte
│   │       ├── StatusDropdown.test.ts           # Unit test
│   │       ├── StatusDropdown.integration.test.ts  # Integration test
│   │       └── ...
│   ├── stores/
│   │   ├── issues.ts
│   │   └── issues.test.ts
│   └── utils/
│       ├── formatters.ts
│       └── formatters.test.ts
└── tests/
    ├── setup.ts
    ├── fixtures/
    ├── mocks/
    └── helpers/

tests/
└── integration/                    # Cross-cutting integration tests
    └── issue-workflow.test.ts

e2e/
├── smoke/
│   └── critical-paths.spec.ts
└── issues/
    └── crud.spec.ts
```

---

## 6. Test Data Management

### ✅ Decision: Faker with Fixed Seed

Use `@faker-js/faker` with fixed seed for reproducibility:

```typescript
import { faker } from '@faker-js/faker';

// Set in test setup for deterministic runs
faker.seed(12345);

export function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: faker.string.alphanumeric(8),
    title: faker.lorem.sentence(),
    status: 'open',
    priority: faker.number.int({ min: 1, max: 5 }),
    created_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

---

## 7. Mocking Strategy

### ✅ Decision: Mock Complex Children in Unit Tests

| Test Type | Children | Stores | External Services |
|-----------|----------|--------|-------------------|
| Unit | Mock complex (charts, terminal) | Mock | Mock |
| Integration | Real | Real | Mock |
| E2E | Real | Real | Real |

"Complex children" = components that are slow, have external dependencies, or have significant visual weight (charts, terminal emulator, graph visualizations).

---

## 8. Visual Regression Testing

### ✅ Decision: Defer Until Design System Stable

**Rationale**: UI is still evolving in Phase 1. Visual tests are high maintenance during active design changes.

**When ready**: Use Playwright's built-in screenshot comparison:

```typescript
test('issue list matches baseline', async ({ page }) => {
  await page.goto('/issues');
  await expect(page).toHaveScreenshot('issue-list.png', {
    maxDiffPixels: 100,
  });
});
```

---

## 9. API Contract Testing

### ✅ Decision: TypeScript + Zod Runtime Validation

Since the app uses CLI for writes and direct SQL for reads (ADR-0005), traditional REST API contract testing doesn't apply.

**Approach**: Zod schemas validate CLI output at runtime:

```typescript
import { z } from 'zod';

const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['open', 'in_progress', 'review', 'done', 'closed']),
  priority: z.number().int().min(1).max(5),
  created_at: z.string().datetime(),
});

// Validate CLI output in integration tests
const issues = JSON.parse(result.stdout);
z.array(IssueSchema).parse(issues);
```

---

## Summary of Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Test pyramid ratio | Traditional (50/30/15/5) |
| 2 | Integration test location | Hybrid (component co-located, cross-cutting in `tests/integration/`) |
| 3 | Smoke test approach | Tag E2E tests with `@smoke` |
| 4 | Regression test approach | Inline with issue reference |
| 5 | Coverage thresholds | 70/65/75/70 |
| 6 | E2E on PRs | Yes, required |
| 7 | Pre-commit hooks | Affected tests only |
| 8 | Test file naming | `*.test.ts` with `.integration.test.ts` suffix |
| 9 | Test data | Faker with fixed seed |
| 10 | Component mocking | Mock complex children in unit, real in integration |
| 11 | Visual regression | Defer until design system stable |
| 12 | Contract testing | TypeScript + Zod runtime validation |

---

## References

- [ADR-0019: Testing Strategy and Conventions](../../../../docs/src/adrs/0019-testing-strategy-and-conventions.md)
- [ADR-0008: Use Vitest with Testing Library](../../../../docs/src/adrs/0008-use-vitest-with-testing-library-for-component-testing.md)
- [ADR-0010: Use Dependency Injection for Testability](../../../../docs/src/adrs/0010-use-dependency-injection-for-testability.md)
