# Phase Plans Testing Update Plan

> **Status**: In Progress
> **Related**: [ADR-0019](../../../../docs/src/adrs/0019-testing-strategy-and-conventions.md)

This document outlines the plan for updating all phase plan documents with testing requirements based on the finalized testing strategy.

## Objectives

1. Add test requirements to each task based on task type
2. Include specific acceptance criteria for tests
3. Add commit requirements (atomic, conventional)
4. Update beads issues to reflect changes

---

## Test Type Mapping by Task Category

### Unit Tests (50% of test budget)

**Applicable to**:
- Pure logic classes (ProcessSupervisor, MetricsEngine)
- Utility functions (date parsing, formatting, sorting)
- Store reducers and derived state
- Data transformation functions
- Calculation logic (percentiles, lead time, etc.)

**Template**:
```markdown
**Unit Test Requirements**:
- [ ] `{FileName}.test.ts` with ≥80% coverage for this module
- [ ] Test edge cases: {specific cases}
- [ ] Test error handling: {specific errors}
```

### Component Tests (30% of test budget)

**Applicable to**:
- Individual Svelte components
- UI widgets (buttons, inputs, dropdowns)
- Chart components (render, accessibility)
- Card/List item components

**Template**:
```markdown
**Component Test Requirements** (`{ComponentName}.test.ts`):
- [ ] Renders correctly with default props
- [ ] Renders correctly with various prop combinations
- [ ] Handles user interactions (click, type, select)
- [ ] Calls callback props correctly
- [ ] Accessible (keyboard navigation, ARIA)
```

### Integration Tests (15% of test budget)

**Applicable to**:
- Features involving multiple components
- Store + component interactions
- Real-time update flows
- Drag-and-drop workflows
- Filter + list combinations

**Template**:
```markdown
**Integration Test Requirements** (`{Feature}.integration.test.ts`):
- [ ] Components work together correctly
- [ ] State flows through stores as expected
- [ ] User workflow completes end-to-end (mocked CLI)
```

### E2E Tests (5% of test budget)

**Applicable to**:
- Critical user journeys only
- CRUD operations
- Authentication flows (if applicable)
- Multi-step workflows

**Template**:
```markdown
**E2E Test Requirements** (`e2e/{feature}.spec.ts`):
- [ ] Critical path: {describe journey}
- [ ] Tag with `@smoke` if critical
```

### Visual Tests (Deferred)

**Applicable to**:
- After design system stable
- Key component states
- Empty/loading/error states

**Template**:
```markdown
**Visual Test Requirements** (Deferred to post-MVP):
- [ ] Screenshot baseline for: {states}
```

### API/Contract Tests

**Applicable to**:
- CLI wrapper functions
- Database query functions
- External service integrations

**Template**:
```markdown
**Contract Test Requirements**:
- [ ] Zod schema validates CLI output
- [ ] Schema in `src/lib/schemas/{name}.ts`
```

---

## Commit Requirement Template

Add to EVERY task:

```markdown
**Commit Requirements**:
- [ ] Atomic commit after acceptance tests pass
- [ ] Conventional commit format: `{type}({scope}): {description}`
- [ ] Include test files in same commit as implementation
- [ ] Update beads issue status after commit
```

---

## Task-by-Task Analysis

### Phase 1: MVP Core (16 tasks)

| Task | Unit | Component | Integration | E2E | Contract | Visual |
|------|:----:|:---------:|:-----------:|:---:|:--------:|:------:|
| 1.1 ProcessSupervisor | ✅ | - | ✅ | - | - | - |
| 1.2 Data Access Layer | ✅ | - | ✅ | - | ✅ | - |
| 1.3 Issue List View | - | ✅ | ✅ | ✅ | - | Deferred |
| 1.4 Filter Panel | - | ✅ | ✅ | - | - | - |
| 1.5 Text Search | - | ✅ | - | - | - | - |
| 1.6 Create Issue | - | ✅ | ✅ | ✅ | - | - |
| 1.7 Quick Status Change | - | ✅ | ✅ | ✅ | - | - |
| 1.8 Inline Editing | - | ✅ | ✅ | ✅ | - | - |
| 1.8a Issue Detail View | - | ✅ | - | - | - | Deferred |
| 1.9 Kanban Board | - | ✅ | ✅ | ✅ | - | Deferred |
| 1.10 Epics View | - | ✅ | - | - | - | - |
| 1.11 File Watching | ✅ | - | ✅ | - | - | - |
| 1.12 Keyboard Shortcuts | - | ✅ | ✅ | - | - | - |
| 1.13 Owner/Assignee Filter | - | ✅ | - | - | - | - |
| 1.14 Issue Dependencies | - | ✅ | - | - | - | - |
| 1.15 Global Navigation | - | ✅ | - | - | - | Deferred |

### Phase 2: Analytics (17 tasks)

| Task | Unit | Component | Integration | E2E | Contract | Visual |
|------|:----:|:---------:|:-----------:|:---:|:--------:|:------:|
| 2.1 Metrics Engine | ✅ | - | - | - | - | - |
| 2.2 Lead Time Scatterplot | ✅ | ✅ | - | - | - | Deferred |
| 2.3 Throughput Chart | ✅ | ✅ | - | - | - | Deferred |
| 2.4 CFD | ✅ | ✅ | - | - | - | Deferred |
| 2.5 Aging WIP Scatterplot | ✅ | ✅ | - | - | - | Deferred |
| 2.6 Percentile Calculations | ✅ | - | - | - | - | - |
| 2.7 Health Status Badges | - | ✅ | - | - | - | - |
| 2.8 Progress Bars | - | ✅ | - | - | - | - |
| 2.9 Date Prefix Parsing | ✅ | - | - | - | - | - |
| 2.10 Hierarchical Sorting | ✅ | - | - | - | - | - |
| 2.11 Gantt Chart Basic | ✅ | ✅ | - | - | - | Deferred |
| 2.12 Gantt Drag/Resize | - | ✅ | ✅ | - | - | - |
| 2.13 Due Date Management | - | ✅ | ✅ | - | - | - |
| 2.14 Quick Filters | - | ✅ | - | - | - | - |
| 2.15 Aging Items View | - | ✅ | - | - | - | - |
| 2.16 Aging Threshold Config | - | ✅ | - | - | - | - |
| 2.17 Configuration View | - | ✅ | - | - | - | - |

### Phase 3: Git Integration (13 tasks)

| Task | Unit | Component | Integration | E2E | Contract | Visual |
|------|:----:|:---------:|:-----------:|:---:|:--------:|:------:|
| 3.1 Worktree Listing | - | ✅ | - | - | ✅ | - |
| 3.2 Branch Panel | - | ✅ | - | - | - | - |
| 3.3 Dependency Graph | ✅ | ✅ | - | - | - | Deferred |
| 3.4 Graph Interactions | - | ✅ | - | - | - | - |
| 3.5 PR Listing | - | ✅ | ✅ | - | ✅ | - |
| 3.6 PR Preview | - | ✅ | - | - | - | - |
| 3.7 PR Actions | - | ✅ | ✅ | ✅ | - | - |
| 3.8 CI Status Display | - | ✅ | - | - | ✅ | - |
| 3.9 CI Details Modal | - | ✅ | - | - | - | - |
| 3.10 Commit Message Helper | - | ✅ | - | - | - | - |
| 3.11 Branch Sync | - | ✅ | ✅ | - | - | - |
| 3.12 Merge Conflict UI | - | ✅ | - | - | - | - |
| 3.13 History View | - | ✅ | - | - | - | - |

### Phase 4: Agent Orchestration (11 tasks)

| Task | Unit | Component | Integration | E2E | Contract | Visual |
|------|:----:|:---------:|:-----------:|:---:|:--------:|:------:|
| 4.1 Terminal Drawer | - | ✅ | ✅ | - | - | - |
| 4.2 Terminal Emulator | - | ✅ | ✅ | - | - | - |
| 4.3 Session Management | ✅ | ✅ | ✅ | - | - | - |
| 4.4 Output Parsing | ✅ | - | - | - | - | - |
| 4.5 Agent Commands | - | ✅ | ✅ | ✅ | - | - |
| 4.6 Session History | - | ✅ | - | - | - | - |
| 4.7 Multi-session View | - | ✅ | ✅ | - | - | - |
| 4.8 Session Templates | - | ✅ | - | - | - | - |
| 4.9 Agent Output Panel | - | ✅ | - | - | - | - |
| 4.10 Kill/Restart Controls | - | ✅ | ✅ | - | - | - |
| 4.11 Session Persistence | ✅ | - | ✅ | - | - | - |

### Phase 5: Gas-Town Integration (12 tasks)

| Task | Unit | Component | Integration | E2E | Contract | Visual |
|------|:----:|:---------:|:-----------:|:---:|:--------:|:------:|
| 5.1 Gas-Town Detection | ✅ | - | - | - | ✅ | - |
| 5.2 gt CLI Integration | ✅ | - | ✅ | - | ✅ | - |
| 5.3 Agent Dashboard | - | ✅ | ✅ | - | - | Deferred |
| 5.4 Convoy Tracking | - | ✅ | - | - | - | - |
| 5.5 Mail System | - | ✅ | ✅ | - | - | - |
| 5.6 Sling Visualization | - | ✅ | - | - | - | Deferred |
| 5.7 Knowledge Panel | - | ✅ | - | - | - | - |
| 5.8 SQL Explorer | - | ✅ | - | - | ✅ | - |
| 5.9 Polecat Logs | - | ✅ | - | - | - | - |
| 5.10 Rig Management | - | ✅ | ✅ | - | - | - |
| 5.11 Project Tags | - | ✅ | - | - | - | - |
| 5.12 WebSocket Subscriptions | ✅ | - | ✅ | - | - | - |

---

## Execution Plan

### Step 1: Update Phase 0 (Development Setup)
- Add testing infrastructure setup verification
- Add commit workflow documentation

### Step 2: Update Phase 1 (MVP Core)
- Add test requirements to all 16 tasks
- Add commit requirements template
- Flag tasks needing E2E smoke tests

### Step 3: Update Phase 2 (Analytics)
- Add unit test requirements for calculation logic
- Add component test requirements for charts
- Add visual regression notes (deferred)

### Step 4: Update Phase 3 (Git Integration)
- Add contract test requirements for gh CLI
- Add integration test requirements for PR workflows

### Step 5: Update Phase 4 (Agent Orchestration)
- Add integration test requirements for terminal
- Add session management unit tests

### Step 6: Update Phase 5 (Gas-Town)
- Add contract tests for gt CLI
- Add detection/fallback unit tests

### Step 7: Update Beads Issues
- Sync phase changes to beads issue descriptions
- Add test-related labels where applicable

---

## Templates for Phase Updates

### Standard Test Section (add after Acceptance Criteria)

```markdown
**Testing Requirements**:

*Unit Tests* (`{file}.test.ts`):
- [ ] {specific test case}
- [ ] {specific test case}

*Component Tests* (`{Component}.test.ts`):
- [ ] Renders with default props
- [ ] {interaction test}
- [ ] {accessibility test}

*Integration Tests* (`{feature}.integration.test.ts`):
- [ ] {workflow test}

**Commit Requirements**:
- [ ] Atomic commit after all tests pass
- [ ] Format: `feat({scope}): {description}`
- [ ] Include test files in same commit
```

---

## Summary Counts

| Phase | Tasks | Unit | Component | Integration | E2E | Contract |
|-------|-------|------|-----------|-------------|-----|----------|
| 1 | 16 | 4 | 15 | 9 | 5 | 1 |
| 2 | 17 | 8 | 15 | 2 | 0 | 0 |
| 3 | 13 | 1 | 13 | 3 | 1 | 3 |
| 4 | 11 | 3 | 10 | 6 | 1 | 0 |
| 5 | 12 | 4 | 10 | 5 | 0 | 4 |
| **Total** | **69** | **20** | **63** | **25** | **7** | **8** |
