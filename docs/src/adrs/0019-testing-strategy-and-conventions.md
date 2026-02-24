---
number: 19
title: Testing Strategy and Conventions
status: accepted
date: 2026-02-24
tags:
  - testing
  - conventions
  - infrastructure
deciders:
  - aRustyDev
---

# Testing Strategy and Conventions

## Context and Problem Statement

The project needs a comprehensive testing strategy that balances quality, velocity, and maintainability. Key questions include: What ratio of test types should we target? How should tests be organized? What coverage thresholds should be enforced? When should different testing approaches be introduced?

## Decision Drivers

* **Fast feedback**: Developers need quick feedback on changes
* **Bug prevention**: Tests should catch real bugs before production
* **Maintainability**: Test suite should be easy to maintain as codebase grows
* **CI performance**: Test pipeline should complete in reasonable time
* **Current scope**: MVP is focused (single user, single project, data-display heavy)
* **Future growth**: Architecture should support shift to more complex testing needs

## Considered Options

* **Traditional Test Pyramid** (50% unit, 30% integration, 15% E2E, 5% manual)
* **Testing Trophy** (30% unit, 60% integration, 10% E2E)
* **Hybrid** (40% unit, 40% integration, 15% E2E, 5% manual)

## Decision Outcome

Chosen option: **Traditional Test Pyramid**, because the current application is data-display focused with most logic in the CLI rather than the web UI. Unit tests for utilities, stores, and data transformation provide fast feedback. As the application grows more complex (rich components, multiple integrations), we will shift toward Testing Trophy ratios.

### Consequences

* Good, because fast test execution during development
* Good, because clear boundaries between test types
* Good, because matches current application complexity
* Neutral, because requires monitoring for when to shift strategy
* Bad, because unit tests may miss integration issues

### Confirmation

* Test pyramid ratios reviewed quarterly via coverage reports
* Shift to Testing Trophy when: bug escape rate increases in integration points, component count exceeds 30, or state shared across 3+ components

## Testing Conventions

### Test Organization

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit | Co-located with source | `*.test.ts` |
| Integration (component) | Co-located with source | `*.integration.test.ts` |
| Integration (cross-cutting) | `tests/integration/` | `*.test.ts` |
| E2E | `tests/e2e/` | `*.spec.ts` |
| Smoke | E2E tests tagged `@smoke` | - |

### Component Mocking Strategy

* **Unit tests**: Mock complex children (charts, terminals, heavy components)
* **Integration tests**: Render real children, mock only external services (CLI, API)
* **Rationale**: Unit tests verify component logic in isolation; integration tests verify components work together

### Coverage Thresholds

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

### CI Pipeline

| Stage | Tests Run | Trigger |
|-------|-----------|---------|
| Pre-commit | Affected unit/integration tests | Git commit |
| PR | All unit, integration, E2E | Pull request |
| Main | Full suite + smoke verification | Merge to main |

### Test Data

* Use `@faker-js/faker` with fixed seed for reproducibility
* Seed set in test setup for deterministic test runs
* Factories for common entities (Issue, Project, etc.)

### Regression Tests

* Add test case inline with fix, include comment linking to issue
* Example: `// Regression: fixes #123 - null status crash`

### Contract Testing

* TypeScript types define expected shapes
* Zod schemas validate CLI output at runtime
* Catches drift between frontend expectations and CLI changes

### Visual Regression

* Introduce after design system stabilizes
* Use Playwright screenshot comparison
* Not required for MVP phase

## More Information

### When to Revisit This ADR

Shift toward Testing Trophy ratios when:
1. Bug escape rate increases in component integration points
2. Component count exceeds 20-30
3. State shared across 3+ components
4. External service integrations multiply

### References

* [ADR-0008: Use Vitest with Testing Library](./0008-use-vitest-with-testing-library-for-component-testing.md)
* [ADR-0010: Use Dependency Injection for Testability](./0010-use-dependency-injection-for-testability.md)
* [Testing Strategy Proposal](../../.claude/plans/unified-beads-webui/docs/testing-strategy-proposal.md)
