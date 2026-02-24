# Phase 2: Analytics & Timeline

**Duration**: 4 weeks
**Theme**: Lean metrics, Gantt visualization, and configuration

## Objectives

1. Port metrics engine from beads-dashboard
2. Implement CFD, Lead Time, Cycle Time, Throughput, and Aging WIP charts
3. Add health status badges (RAG indicators)
4. Build Gantt chart with date prefix parsing
5. Add progress indicators and percentile calculations

---

## Phase 1 Entry Gate

Before starting Phase 2, verify Phase 1 completion:

- [ ] All Phase 1 Must-Have features complete
- [ ] ProcessSupervisor tested and documented
- [ ] Data Access Layer supports both SQLite and Dolt
- [ ] Issue Store API stable
- [ ] WebSocket infrastructure working
- [ ] Unit test coverage > 70%

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Metrics calculation | < 500ms for 1000 issues | Performance benchmark |
| Chart rendering | < 200ms for CFD with 30 days | Lighthouse audit |
| Lead time accuracy | Matches `bd` CLI calculations | Unit tests with known data |
| Gantt rendering | Renders 50 items in < 200ms | Performance benchmark |
| Health badges | Correctly show RAG status | Visual regression test |
| Accessibility | WCAG 2.1 AA compliant | axe-core audit |
| Test coverage | > 70% for metrics engine | Vitest coverage |

---

## Chart Library Decision

**Selected**: **Layerchart** (Svelte-native, built on D3)

| Consideration | Recharts | Chart.js | D3.js | Layerchart |
|---------------|----------|----------|-------|------------|
| Svelte support | React only | Good | Manual | Native |
| Bundle size | Large | Medium | Large | Medium |
| Customization | Limited | Good | Full | Good |
| Learning curve | Low | Low | High | Low |
| SSR support | No | Limited | Yes | Yes |

**Decision**: Use Layerchart for Svelte-native charting with D3 foundations.

```bash
bun add layerchart d3-scale d3-shape d3-array
```

---

## Complexity Scale

| Score | Effort | Description |
|-------|--------|-------------|
| 1 | 0.5-1 day | Simple component or utility |
| 2 | 1-2 days | Component with state/logic |
| 3 | 2-4 days | Complex component or integration |
| 4 | 4-7 days | Major feature or system |
| 5 | 1-2 weeks | Large cross-cutting feature |

---

## Observability Requirements

All Phase 2 implementations must include telemetry per [ADR-0011](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md).

### Acceptance Criteria

- [ ] Metrics calculations traced with span including calculation type and issue count
- [ ] Chart render operations traced with span including chart type and data points
- [ ] Errors include span ID for correlation
- [ ] Metrics: `metrics.calculation.duration`, `chart.render.duration`

### Per-Feature Requirements

| Feature | Traces | Metrics | Logs |
|---------|--------|---------|------|
| Metrics Engine | `metrics.calculate` span with type | `metrics.calculation.duration` | Calculation errors |
| Charts | `chart.render` span with chart type | `chart.render.duration` | Render failures |

### References

- [Spec: Observability Architecture](../spec/observability.md)
- [ADR-0011: Use OpenTelemetry](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)

---

## Features

### 2.1 Metrics Engine

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-dashboard

Core calculation engine for lean/kanban metrics.

```typescript
// src/lib/metrics/engine.ts
interface MetricsEngine {
  calculateLeadTime(issues: Issue[]): LeadTimeData;
  calculateCycleTime(issues: Issue[]): CycleTimeData;
  calculateThroughput(issues: Issue[], period: 'day' | 'week'): ThroughputData;
  calculateCFD(issues: Issue[], days: number): CFDData;
  calculateAgingWIP(issues: Issue[]): AgingWIPData;
  calculatePercentiles(values: number[], percentiles: number[]): PercentileData;
}
```

**Deliverables**:
- [ ] Lead time calculation (created → closed)
- [ ] Cycle time calculation (in_progress → closed)
- [ ] Throughput calculation (items closed per period)
- [ ] CFD data aggregation
- [ ] Aging WIP calculation (current age of open items)
- [ ] Percentile calculation (P50, P85, P95)
- [ ] Unit tests with known datasets

**Acceptance Criteria**:
- Calculations match beads-dashboard output
- Handles missing dates gracefully
- Excludes wisps from calculations
- Performance < 500ms for 1000 issues

**Testing Requirements**:

*Unit Tests* (`metricsEngine.test.ts`):
- [ ] Calculates lead time correctly (created → closed)
- [ ] Calculates cycle time correctly (in_progress → closed)
- [ ] Calculates throughput per day/week
- [ ] Aggregates CFD data by status and date
- [ ] Calculates aging for open items
- [ ] Handles missing created_at dates
- [ ] Handles missing closed_at dates
- [ ] Excludes items with type="wisp"
- [ ] Calculates P50, P85, P95 percentiles accurately
- [ ] Performance: < 500ms for 1000 issues

*Test Data*:
- Use `@faker-js/faker` with fixed seed
- Create known test datasets with predictable outputs
- Include edge cases: empty arrays, single item, null dates

**Commit**: `feat(metrics): add MetricsEngine with lean calculations`

---

### 2.2 Lead Time Scatterplot

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-dashboard

Visualize lead time distribution over time.

**Deliverables**:
- [ ] `LeadTimeChart.svelte` component
- [ ] X-axis: close date
- [ ] Y-axis: lead time (days)
- [ ] Point size by issue type
- [ ] Hover tooltip with issue details
- [ ] Percentile lines (P50, P85)
- [ ] Date range selector

**Acceptance Criteria**:
- Points clickable to view issue
- Percentile lines update with filter
- Can zoom/pan date range
- Export to PNG/SVG

**Testing Requirements**:

*Component Tests* (`LeadTimeChart.test.ts`):
- [ ] Renders chart container
- [ ] Plots points for each closed issue
- [ ] Shows tooltip on hover with issue details
- [ ] Displays P50 and P85 percentile lines
- [ ] Calls onclick when point clicked
- [ ] Supports date range filtering
- [ ] Has accessible chart markup (role="img", aria-label)

**Commit**: `feat(metrics): add LeadTimeChart with percentile lines`

---

### 2.3 Throughput Chart

**Priority**: Must-Have | **Complexity**: 2 | **Source**: beads-dashboard

Bar chart showing items completed per time period.

**Deliverables**:
- [ ] `ThroughputChart.svelte` component
- [ ] Daily or weekly aggregation toggle
- [ ] Stacked by issue type (optional)
- [ ] Trend line overlay
- [ ] Hover shows count

**Acceptance Criteria**:
- Toggle between daily/weekly view
- Can filter by issue type
- Shows rolling average trend
- Export to PNG/SVG

**Testing Requirements**:

*Component Tests* (`ThroughputChart.test.ts`):
- [ ] Renders bar chart with throughput data
- [ ] Toggles between daily/weekly aggregation
- [ ] Shows stacked bars by issue type when enabled
- [ ] Displays trend line overlay
- [ ] Shows count on hover

**Commit**: `feat(metrics): add ThroughputChart with daily/weekly toggle`

---

### 2.4 Cumulative Flow Diagram (CFD)

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-dashboard

Area chart showing work item flow through states.

**Deliverables**:
- [ ] `CFDChart.svelte` component
- [ ] Stacked areas by status
- [ ] X-axis: date
- [ ] Y-axis: cumulative count
- [ ] Color coding by status
- [ ] Date range selector

**Acceptance Criteria**:
- Areas stack correctly (no gaps)
- Status order matches workflow
- Hover shows count per status
- Identifies bottlenecks visually

---

### 2.5 Aging WIP Scatterplot

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-dashboard

Visualize age of currently open work items.

**Deliverables**:
- [ ] `AgingWIPChart.svelte` component
- [ ] X-axis: current status
- [ ] Y-axis: age in days
- [ ] Point color by priority
- [ ] Danger zone shading (above P85)
- [ ] Click to view issue

**Acceptance Criteria**:
- Shows only open items
- Danger zone highlights aging items
- Sorted by status workflow order
- Filters by priority/type

---

### 2.6 Percentile Calculations

**Priority**: Must-Have | **Complexity**: 2 | **Source**: beads-dashboard

Statistical percentile calculations for predictability.

**Deliverables**:
- [ ] P50 (median) calculation
- [ ] P85 calculation
- [ ] P95 calculation
- [ ] Display in charts as lines
- [ ] Summary statistics panel

**Acceptance Criteria**:
- Percentiles calculated correctly
- Displayed on Lead Time chart
- Used for "likely completion" estimates
- Recalculates on filter change

---

### 2.7 Health Status (RAG) Badges

**Priority**: Must-Have | **Complexity**: 2 | **Source**: beads-dashboard, beads-pm-ui

Red/Amber/Green indicators for issue health.

```typescript
// src/lib/metrics/health.ts
type HealthStatus = 'green' | 'amber' | 'red';

interface HealthIndicator {
  status: HealthStatus;
  reason: string;
  metric: string;
  value: number;
  threshold: number;
}

function calculateHealth(issue: Issue): HealthIndicator;
```

**Deliverables**:
- [ ] `HealthBadge.svelte` component
- [ ] Health calculation logic
- [ ] Configurable thresholds
- [ ] Tooltip explaining status

**Acceptance Criteria**:
- Red: age > P95 or overdue
- Amber: age > P85 or due soon
- Green: healthy
- Badge shows on cards and list

---

### 2.8 Progress Bars

**Priority**: Should-Have | **Complexity**: 1 | **Source**: beads-dashboard, Kanban-UI

Visual progress indicators for epics and groups.

**Deliverables**:
- [ ] `ProgressBar.svelte` component
- [ ] Percentage complete (done/total)
- [ ] Color gradient (red → green)
- [ ] Tooltip with details

**Acceptance Criteria**:
- Shows on epic rows
- Updates in real-time
- Accessible (has aria attributes)

---

### 2.9 Date Prefix Parsing

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-pm-ui

Parse date prefixes from issue titles for timeline placement.

```typescript
// src/lib/utils/date-prefix.ts
interface DatePrefix {
  type: 'quarter' | 'half' | 'month' | 'week' | 'day';
  year: number;
  period: number;  // Q1=1, H1=1, Jan=1, W1=1
  startDate: Date;
  endDate: Date;
}

function parseDatePrefix(title: string): DatePrefix | null;
```

**Supported Formats**:
- `[Q1]` → Quarter 1 (Jan-Mar)
- `[Q2 2025]` → Quarter 2, 2025
- `[H1]` → Half 1 (Jan-Jun)
- `[W12]` → Week 12
- `[Jan]` → January
- `[2025-03-15]` → Specific date

**Deliverables**:
- [ ] Date prefix parser
- [ ] Start/end date calculation
- [ ] Year inference (current if omitted)
- [ ] Unit tests for all formats

**Acceptance Criteria**:
- Parses all documented formats
- Handles year rollover correctly
- Returns null for invalid formats
- Extracts prefix from any position in title

---

### 2.10 Hierarchical Sorting

**Priority**: Should-Have | **Complexity**: 2 | **Source**: beads-pm-ui

Sort issues by date prefix, then by hierarchy.

**Deliverables**:
- [ ] Sort comparator function
- [ ] Sort by parsed date
- [ ] Sub-sort by parent/child
- [ ] Sub-sort by priority

**Acceptance Criteria**:
- Earlier dates sort first
- Children follow parents
- Maintains stable sort order

---

### 2.11 Gantt Chart (Basic)

**Priority**: Must-Have | **Complexity**: 4 | **Source**: beads-pm-ui

Timeline visualization with bars for date ranges.

**Deliverables**:
- [ ] `GanttChart.svelte` component
- [ ] `GanttBar.svelte` component
- [ ] Time axis (weeks/months)
- [ ] Issue rows with bars
- [ ] Scroll/zoom for large ranges
- [ ] Today marker

**Acceptance Criteria**:
- Bars positioned by date prefix
- Bar length reflects duration
- Scroll horizontally for time
- Scroll vertically for issues
- Today line visible

---

### 2.12 Gantt Drag/Resize

**Priority**: Deferred | **Complexity**: 4 | **Source**: beads-pm-ui

**⚠️ DEFERRED TO PHASE 3** - Interactive Gantt bar manipulation requires more polish time and is not critical for initial analytics.

See [Phase 3: Git Integration](./03-git-integration.md#313-gantt-dragresize) for full specification.

---

### 2.13 Due Date Management

**Priority**: Should-Have | **Complexity**: 2 | **Source**: beads-dashboard, beads-pm-ui

Set and display due dates on issues.

**Deliverables**:
- [ ] Due date picker in edit form
- [ ] Due date display on cards
- [ ] Overdue indicator (red)
- [ ] Due soon indicator (amber)

**Acceptance Criteria**:
- Date picker with calendar
- Relative dates supported (+7d)
- Overdue items highlighted
- Sort by due date

---

### 2.14 Quick Filters (Presets)

**Priority**: Should-Have | **Complexity**: 2 | **Source**: beads-dashboard, Kanban-UI

Predefined filter combinations for common queries.

**Deliverables**:
- [ ] "My Issues" preset
- [ ] "Overdue" preset
- [ ] "Due This Week" preset
- [ ] "Stale" preset (no updates in 7d)
- [ ] Save custom presets

**Acceptance Criteria**:
- One-click filter application
- Visual indicator of active preset
- Presets persist in local storage

---

### 2.15 Aging Items View

**Priority**: Should-Have | **Complexity**: 2 | **Source**: New
**Wireframe**: [10-aging-items-view.md](../wireframes/10-aging-items-view.md)

Dedicated view for monitoring aging/stale work items.

**Deliverables**:
- [ ] `AgingItemsView.svelte` component
- [ ] Warning items section (approaching threshold)
- [ ] Critical items section (exceeding threshold)
- [ ] Filter by assignee, epic, priority
- [ ] Link to aging threshold configuration

**Acceptance Criteria**:
- Items grouped by warning vs critical status
- Each item links to issue detail
- Shows age in days and status
- Threshold configuration accessible from view

---

### 2.16 Aging Threshold Configuration

**Priority**: Could-Have | **Complexity**: 1 | **Source**: New
**Wireframe**: [11-aging-threshold-config.md](../wireframes/11-aging-threshold-config.md)

Modal for configuring aging thresholds.

**Deliverables**:
- [ ] `AgingThresholdConfigModal.svelte` component
- [ ] Warning threshold input (days)
- [ ] Critical threshold input (days)
- [ ] Auto-calculate toggle (from historical data)
- [ ] Preview affected items

**Acceptance Criteria**:
- Thresholds saved to configuration store
- Preview shows which items would be flagged
- Auto-calculate option uses P85/P95

---

### 2.17 Configuration View

**Priority**: Should-Have | **Complexity**: 2 | **Source**: New
**Wireframe**: [12-configuration-view.md](../wireframes/12-configuration-view.md)

Central configuration hub for all application settings.

**Deliverables**:
- [ ] `ConfigurationView.svelte` component
- [ ] Display settings section (density, theme, time format)
- [ ] RAG thresholds section
- [ ] Aging thresholds section
- [ ] Column configurations section
- [ ] Keyboard shortcuts preview

**Acceptance Criteria**:
- All settings persist in localStorage
- Changes apply immediately (no restart)
- Sections collapsible
- Reset to defaults option

---

## Technical Architecture

### Metrics Data Flow

```
┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│ Data Access     │────▶│ Metrics       │────▶│ Chart           │
│ Layer           │     │ Engine        │     │ Components      │
│ (SQL queries)   │     │ (calculations)│     │ (visualization) │
└─────────────────┘     └───────────────┘     └─────────────────┘
```

### Chart Library

Using **Layerchart** (Svelte-native, built on D3) for all analytics visualizations:

```svelte
<!-- Example: Lead Time Scatterplot with Layerchart -->
<script lang="ts">
  import { Chart, Svg, Axis, Scatter, Tooltip } from 'layerchart';
  import { scaleTime, scaleLinear } from 'd3-scale';

  let { data, percentiles } = $props<{
    data: LeadTimePoint[];
    percentiles: { p50: number; p85: number };
  }>();
</script>

<Chart {data} x="closeDate" y="leadTimeDays">
  <Svg>
    <Axis placement="bottom" format={(d) => d.toLocaleDateString()} />
    <Axis placement="left" label="Lead Time (days)" />
    <Scatter radius={4} class="fill-primary" />
    <!-- Percentile reference lines -->
    <Rule y={percentiles.p50} class="stroke-amber-500" />
    <Rule y={percentiles.p85} class="stroke-red-500" />
  </Svg>
  <Tooltip />
</Chart>
```

**Note**: Dependency graph visualization (Phase 3) uses D3 directly (`d3-force`) since Layerchart doesn't support force-directed network graphs.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/lead-time` | GET | Lead time data with percentiles |
| `/api/metrics/throughput` | GET | Throughput by period |
| `/api/metrics/cfd` | GET | CFD data for date range |
| `/api/metrics/aging-wip` | GET | Current aging WIP data |

### API Request/Response Specifications

#### GET `/api/metrics/lead-time`

**Request Parameters:**
```typescript
interface LeadTimeRequest {
  startDate?: string;  // ISO date, default: 30 days ago
  endDate?: string;    // ISO date, default: today
  issueTypes?: string[];  // Filter by type
  excludeWisps?: boolean; // Default: true
}
```

**Response:**
```typescript
interface LeadTimeResponse {
  points: Array<{
    issueId: string;
    title: string;
    closeDate: string;  // ISO date
    leadTimeDays: number;
    issueType: string;
  }>;
  percentiles: {
    p50: number;
    p85: number;
    p95: number;
  };
  stats: {
    count: number;
    mean: number;
    stdDev: number;
  };
}
```

#### GET `/api/metrics/throughput`

**Request Parameters:**
```typescript
interface ThroughputRequest {
  startDate?: string;
  endDate?: string;
  period: 'day' | 'week';  // Aggregation period
  groupBy?: 'type' | 'none';
}
```

**Response:**
```typescript
interface ThroughputResponse {
  buckets: Array<{
    periodStart: string;  // ISO date
    periodEnd: string;
    count: number;
    byType?: Record<string, number>;  // If groupBy='type'
  }>;
  trend: {
    slope: number;  // Items per period change
    direction: 'up' | 'down' | 'stable';
  };
}
```

#### GET `/api/metrics/cfd`

**Request Parameters:**
```typescript
interface CFDRequest {
  startDate?: string;
  endDate?: string;
  statuses?: string[];  // Filter/order statuses
}
```

**Response:**
```typescript
interface CFDResponse {
  dates: string[];  // ISO dates
  series: Array<{
    status: string;
    color: string;
    values: number[];  // Cumulative count per date
  }>;
}
```

#### GET `/api/metrics/aging-wip`

**Request Parameters:**
```typescript
interface AgingWIPRequest {
  statuses?: string[];  // Filter by status
  includeBlocked?: boolean;
}
```

**Response:**
```typescript
interface AgingWIPResponse {
  items: Array<{
    issueId: string;
    title: string;
    status: string;
    ageDays: number;
    priority: string;
    isBlocked: boolean;
  }>;
  thresholds: {
    p85: number;  // Days - amber zone starts
    p95: number;  // Days - red zone starts
  };
}
```

---

## Dependencies

### From Phase 1
- Data Access Layer
- Issue Store
- ProcessSupervisor

### New Libraries
| Library | Purpose |
|---------|---------|
| `layerchart` | Svelte-native charting (built on D3) |
| `d3-scale` | Scale functions (included with layerchart) |
| `d3-shape` | Shape generators (included with layerchart) |
| `d3-array` | Array utilities including quantile (included with layerchart) |
| `date-fns` | Date manipulation |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large dataset performance | Incremental loading, caching |
| Date prefix ambiguity | Clear documentation, validation |
| Gantt complexity | Start simple, iterate |
| Chart library size | Tree-shaking, lazy loading |

---

## Testing Strategy

> **Reference**: [ADR-0019: Testing Strategy and Conventions](../../../../docs/src/adrs/0019-testing-strategy-and-conventions.md)

### Test Distribution

| Type | Focus |
|------|-------|
| Unit (50%) | Metrics engine calculations, date parsing, percentiles |
| Component (30%) | Chart components, badges, progress bars |
| Integration (15%) | Dashboard data flow, filter → chart updates |
| E2E (5%) | Dashboard loading, Gantt interactions |

### Unit Tests (Priority for Phase 2)
- Metrics calculations with known datasets
- Date prefix parser edge cases
- Percentile accuracy
- Health status logic (RAG)
- Hierarchical sorting

### Component Tests
- Chart rendering with mock data
- Badge state variations
- Progress bar calculations
- Gantt item rendering

### Integration Tests
- Metrics API endpoints
- Chart data formatting
- Filter impact on metrics
- Real-time updates to charts

### E2E Tests
- Dashboard loads with charts
- Date range selection
- Gantt interactions
- Export functionality

### Visual Regression (Deferred)
- Chart baseline screenshots after design stable
- Badge color states
- Gantt layout

### Commit Workflow (Required)

ALL tasks must follow this workflow:

1. All acceptance tests pass
2. Lint and type check pass
3. Atomic commit: `{type}({scope}): {description}`
4. Include test files in same commit
5. Update beads issue status after commit

---

## Deliverables Checklist

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| Metrics Engine | Must-Have | 3 | 3 days | Pending |
| Lead Time Chart | Must-Have | 3 | 2 days | Pending |
| Throughput Chart | Must-Have | 2 | 1.5 days | Pending |
| CFD Chart | Must-Have | 3 | 2 days | Pending |
| Aging WIP Chart | Must-Have | 3 | 2 days | Pending |
| Percentile Calculations | Must-Have | 2 | 1 day | Pending |
| Health Badges | Must-Have | 2 | 1.5 days | Pending |
| Progress Bars | Should-Have | 1 | 0.5 day | Pending |
| Date Prefix Parsing | Must-Have | 3 | 2 days | Pending |
| Hierarchical Sorting | Should-Have | 2 | 1 day | Pending |
| Gantt Chart (Basic) | Must-Have | 4 | 3 days | Pending |
| Gantt Drag/Resize | Deferred | 4 | - | Moved to Phase 3 |
| Due Date Management | Should-Have | 2 | 1.5 days | Pending |
| Quick Filters | Should-Have | 2 | 1 day | Pending |
| Aging Items View | Should-Have | 2 | 1.5 days | Pending |
| Aging Threshold Config | Could-Have | 1 | 0.5 day | Pending |
| Configuration View | Should-Have | 2 | 2 days | Pending |

**Total Effort**: ~29 days (Must-Have: ~18 days, Should-Have: ~9 days, Could-Have: ~2 days)

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Metrics | Engine (3d), Lead Time (2d), Throughput (1.5d), Percentiles (1d) | 7.5 |
| 2 | Charts | CFD (2d), Aging WIP (2d), Health Badges (1.5d), Progress (0.5d), Aging Items View (1.5d) | 7.5 |
| 3 | Timeline | Date Prefix (2d), Gantt Basic (3d), Due Dates (1.5d) | 6.5 |
| 4 | Configuration | Configuration View (2d), Aging Threshold Config (0.5d), Quick Filters (1d), buffer (0.5d) | 4 |

**Note**: Gantt Drag/Resize moved to Phase 3. Added Week 4 for configuration and polish.

---

## Accessibility Requirements

All chart and visualization components must meet WCAG 2.1 AA standards:

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | Charts include text alternatives via `aria-label` and data tables |
| Keyboard navigation | All interactive chart elements focusable and operable via keyboard |
| Color independence | Data conveyed by shape/pattern in addition to color |
| Focus indicators | Visible focus ring on chart elements and controls |
| Motion | Respect `prefers-reduced-motion` for chart animations |

### Component-Specific A11y

| Component | Requirements |
|-----------|--------------|
| Charts | Hidden data table alternative, describedby for complex visualizations |
| Health Badges | Tooltip text, not color-only status |
| Progress Bars | `role="progressbar"`, `aria-valuenow/min/max` |
| Gantt Chart | Keyboard-operable bars, grid navigation |
| Date Pickers | `role="dialog"`, arrow key navigation |

---

## Rollback Strategy

### Feature Flags

```bash
# Disable features if issues arise
DISABLE_METRICS_ENGINE=true    # Fall back to CLI-only metrics
DISABLE_CHARTS=true            # Show data tables instead of charts
DISABLE_GANTT=true             # Hide Gantt, show list with dates
DISABLE_HEALTH_BADGES=true     # Hide badges, show raw data
```

### Component Rollback

| Component | Rollback Procedure |
|-----------|-------------------|
| Metrics Engine | Use `bd` CLI for all metrics calculations |
| Charts | Replace with formatted data tables |
| Gantt Chart | Replace with date-sorted list view |
| Health Badges | Show age in days as plain text |
| Date Prefix | Disable parsing, show raw titles |

### Data Rollback

```bash
# If metrics calculations are incorrect
bd metrics --recalculate  # Re-run metrics from source data
```

---

## Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| Metrics Engine | > 90% | Critical path - all calculations must be tested |
| Chart Components | > 70% | Vitest component tests |
| Date Prefix Parser | > 95% | All documented formats + edge cases |
| Health Calculation | > 85% | All RAG thresholds tested |
| Overall Phase 2 | > 70% | Vitest coverage report |

---

## Exit Criteria

- [ ] Metrics dashboard displays all 4 charts
- [ ] Lead time shows P50/P85 percentile lines
- [ ] CFD accurately reflects workflow
- [ ] Aging WIP highlights stale items
- [ ] Health badges show on cards
- [ ] Gantt chart renders issues with date prefixes
- [ ] All "Must-Have" features complete
- [ ] Metrics calculations verified against `bd` CLI
- [ ] Accessibility audit passes (0 critical violations)
- [ ] Unit test coverage > 70%

---

## References

- [Metrics Spec](../spec/metrics.md)
- [Gantt Spec](../spec/gantt.md)
- [beads-dashboard Metrics](../references/beads-dashboard/README.md)
- [beads-pm-ui Wireframes](../references/beads-pm-ui/src/components/wireframes/)
- [Date Prefix Documentation](../references/requirements.md)
- **Wireframes**:
  - [09-dashboard-view.md](../wireframes/09-dashboard-view.md)
  - [10-aging-items-view.md](../wireframes/10-aging-items-view.md)
  - [11-aging-threshold-config.md](../wireframes/11-aging-threshold-config.md)
  - [12-configuration-view.md](../wireframes/12-configuration-view.md)
