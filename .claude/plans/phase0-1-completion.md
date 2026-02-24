# Phase 0+1 Completion Plan (Revised)

## Status Assessment

### What's Working
- **All 278 unit/component tests pass** with `bun run test:unit`
- ProcessSupervisor: 18/19 tests pass (1 minor issue)
- Data Access Layer: 8/8 tests pass
- All component tests pass with jsdom
- Test setup file works correctly

### What Needs Fixing
1. **TypeScript errors** (31 errors) - Type mismatches in test files and 1 in component
2. **Missing @faker-js/faker** - For reproducible test data
3. **Missing Phase 1 components** - 4 components not created
4. **No E2E tests** - e2e directory is empty
5. **justfile test command** - Uses `bun test` instead of `bun run test:unit`

---

## Part 1: Fix Infrastructure Issues

### 1.1 Install Missing Dependencies

```bash
bun add -d @faker-js/faker
```

### 1.2 Fix TypeScript Errors

**Errors to fix**:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| CreateIssueModal.test.ts | 121, 135 | Mock type mismatch | Type the mock properly |
| DependenciesModal.test.ts | 237 | HTMLElement possibly undefined | Add null check |
| StatusDropdown.svelte | 50 | string possibly undefined | Add fallback |
| KanbanBoard.test.ts | 123 | HTMLElement possibly undefined | Add null check |
| useRealtime.test.ts | multiple | Object possibly undefined | Add null checks |

### 1.3 Fix Justfile Test Command

Update `justfile` test recipe to use `bun run test:unit` instead of `bun test`.

### 1.4 Add Faker to Test Setup

```typescript
// src/tests/setup.ts
import { faker } from '@faker-js/faker';
faker.seed(12345);

export { faker };
```

---

## Part 2: Create Missing Phase 1 Components

### 2.1 InlineEdit Component (Task 1.8)

**Files**:
- `src/lib/components/common/InlineEdit.svelte`
- `src/lib/components/common/InlineEdit.test.ts`

**Test cases** (from Phase 1 spec):
- Renders value as text by default (view mode)
- Renders input when clicked (edit mode)
- Shows save/cancel buttons in edit mode
- Enters edit mode on click
- Enters edit mode on Enter key when focused
- Pre-populates input with current value
- Focuses input automatically
- Saves on Enter key
- Saves on blur (unless cancelled)
- Calls onsave with new value
- Exits edit mode after save
- Cancels on Escape key
- Restores original value on cancel
- Shows new value immediately (optimistic)
- Reverts on save failure
- Shows error indicator on failure
- Maintains focus after mode transitions
- Input has associated label

### 2.2 EpicsView Component (Task 1.10)

**Files**:
- `src/lib/components/epics/EpicsView.svelte`
- `src/lib/components/epics/EpicsView.test.ts`

**Test cases**:
- Displays only issues with type="epic"
- Shows epic title and ID
- Shows child count (done/total)
- Shows progress bar with correct percentage
- Renders expand/collapse toggle
- Expands to show child issues on click
- Collapses when toggled again
- Calculates progress from child statuses
- Calls onselect when epic row clicked
- Shows "No epics" message when empty
- Rows have role="row"
- Progress bar has aria-valuenow/min/max

### 2.3 KeyboardShortcuts (Task 1.12)

**Files**:
- `src/lib/shortcuts/ShortcutManager.ts`
- `src/lib/shortcuts/ShortcutManager.test.ts`
- `src/lib/components/common/KeyboardHelp.svelte`
- `src/lib/components/common/KeyboardHelp.test.ts`

**Shortcuts to implement**:
| Shortcut | Action |
|----------|--------|
| `j` / `k` | Move selection down/up |
| `Enter` | Open selected issue |
| `c` / `n` | Create new issue |
| `e` | Edit selected issue |
| `Escape` | Close modal/cancel |
| `/` | Focus search |
| `?` | Show keyboard shortcuts |

**Test cases**:
- Registers shortcuts with handlers
- Unregisters shortcuts
- Prevents duplicate registrations
- Handles modifier keys (Ctrl, Alt, Shift)
- j/k moves selection down/up
- Ignores shortcuts when typing in input
- Help modal displays all shortcuts
- Shortcuts don't conflict with screen reader keys

### 2.4 AssigneeFilter Component (Task 1.13)

**Files**:
- `src/lib/components/issues/AssigneeFilter.svelte`
- `src/lib/components/issues/AssigneeFilter.test.ts`

**Test cases**:
- Renders assignee dropdown/combobox
- Shows "Assignee" placeholder when empty
- Opens dropdown on focus
- Filters users as user types
- Includes "Me" option at top
- Includes "Unassigned" option
- Selects user on click/Enter
- Calls onchange with selected user
- Arrow keys navigate options
- Escape closes dropdown
- Has role="combobox"

---

## Part 3: Write E2E Tests

### 3.1 Directory Structure

```
e2e/
├── fixtures/
│   ├── test-data.ts          # Test data factories
│   └── helpers.ts            # Common test helpers
├── issues/
│   ├── list.spec.ts          # @smoke
│   ├── create.spec.ts        # @smoke
│   ├── edit.spec.ts          # @smoke
│   └── status.spec.ts        # @smoke
├── kanban/
│   └── board.spec.ts         # @smoke
├── navigation/
│   └── shortcuts.spec.ts
└── accessibility/
    └── a11y.spec.ts
```

### 3.2 E2E Test Specs

**e2e/issues/list.spec.ts** (`@smoke`):
```typescript
test('displays issue list on page load')
test('can sort by clicking column headers')
test('can select and open issue detail')
test('can filter by status')
```

**e2e/issues/create.spec.ts** (`@smoke`):
```typescript
test('opens modal with keyboard shortcut (c)')
test('can fill form and submit')
test('new issue appears in list')
test('shows validation error for empty title')
```

**e2e/issues/edit.spec.ts** (`@smoke`):
```typescript
test('can edit title inline')
test('edit persists after save')
test('escape cancels edit')
```

**e2e/issues/status.spec.ts** (`@smoke`):
```typescript
test('can change status via dropdown')
test('status persists after page refresh')
```

**e2e/kanban/board.spec.ts** (`@smoke`):
```typescript
test('board displays columns for each status')
test('can drag card between columns')
test('status updates after drop')
```

**e2e/accessibility/a11y.spec.ts**:
```typescript
test('issue list page has no critical a11y violations')
test('kanban board has no critical a11y violations')
test('create modal has no critical a11y violations')
```

---

## Implementation Order

### Phase A: Infrastructure (30 min)
1. Install @faker-js/faker
2. Fix TypeScript errors in test files
3. Fix TypeScript error in StatusDropdown.svelte
4. Update justfile test recipe
5. Update test setup with faker
6. Verify `bun run check` passes

### Phase B: Missing Components (4-5 hours)
1. ShortcutManager + tests
2. KeyboardHelp + tests
3. InlineEdit + tests
4. AssigneeFilter + tests
5. EpicsView + tests

### Phase C: E2E Tests (2-3 hours)
1. Create fixtures and helpers
2. Write smoke tests (5 spec files)
3. Write accessibility tests
4. Verify all E2E tests pass

---

## Success Criteria

- [ ] `bun run check` passes with 0 errors
- [ ] `bun run test:unit` passes (all tests green)
- [ ] All 4 missing components created with tests
- [ ] `bun run test:e2e` passes (smoke tests green)
- [ ] E2E accessibility audit passes

---

## Gaps Addressed (from review)

1. **Integration tests** - Component tests already serve as integration tests per ADR-0019
2. **DensitySelector** - Part of GlobalNav, already exists (verified in ThemeToggle area)
3. **Test factories** - Adding faker with seed for reproducibility
4. **CI considerations** - Existing CI workflow uses correct test commands

## Extensions Identified (future work)

1. Visual regression testing with Storybook + Chromatic
2. Contract tests for API responses
3. Performance benchmarks for list rendering
