# Phase 2: Analytics & Timeline

**Duration**: 3 weeks
**Theme**: Lean metrics and Gantt visualization

## Objectives

1. Port metrics engine from beads-dashboard
2. Implement CFD, Lead Time, Throughput, and Aging WIP charts
3. Add health status badges (RAG indicators)
4. Build Gantt chart with date prefix parsing
5. Add progress indicators and percentile calculations

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Metrics calculation | < 500ms for 1000 issues |
| Chart rendering | < 200ms for CFD with 30 days |
| Lead time accuracy | Matches `bd` CLI calculations |
| Gantt rendering | Renders 50 items in < 200ms |
| Health badges | Correctly show RAG status |

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

**Priority**: Should-Have | **Complexity**: 4 | **Source**: beads-pm-ui

Interactive Gantt bar manipulation.

**Deliverables**:
- [ ] Drag bar to change dates
- [ ] Resize bar to change duration
- [ ] Update issue via `bd update --due`
- [ ] Visual feedback during drag

**Acceptance Criteria**:
- Drag snaps to day/week grid
- Resize handles at bar ends
- Update persists via CLI
- Optimistic update with rollback

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

Using Chart.js or D3.js for visualizations:

```typescript
// src/lib/charts/config.ts
const chartConfig = {
  leadTime: {
    type: 'scatter',
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { annotation: { /* percentile lines */ } }
    }
  },
  cfd: {
    type: 'line',
    options: {
      fill: true,
      stacked: true
    }
  }
};
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/lead-time` | GET | Lead time data with percentiles |
| `/api/metrics/throughput` | GET | Throughput by period |
| `/api/metrics/cfd` | GET | CFD data for date range |
| `/api/metrics/aging-wip` | GET | Current aging WIP data |

---

## Dependencies

### From Phase 1
- Data Access Layer
- Issue Store
- ProcessSupervisor

### New Libraries
| Library | Purpose |
|---------|---------|
| `chart.js` | Charting library |
| `date-fns` | Date manipulation |
| `simple-statistics` | Percentile calculations |

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

### Unit Tests
- Metrics calculations with known datasets
- Date prefix parser edge cases
- Percentile accuracy
- Health status logic

### Integration Tests
- Metrics API endpoints
- Chart data formatting
- Filter impact on metrics

### E2E Tests
- Dashboard loads with charts
- Date range selection
- Gantt interactions
- Export functionality

---

## Deliverables Checklist

| Component | Priority | Status |
|-----------|----------|--------|
| Metrics Engine | Must-Have | Pending |
| Lead Time Chart | Must-Have | Pending |
| Throughput Chart | Must-Have | Pending |
| CFD Chart | Must-Have | Pending |
| Aging WIP Chart | Must-Have | Pending |
| Percentile Calculations | Must-Have | Pending |
| Health Badges | Must-Have | Pending |
| Progress Bars | Should-Have | Pending |
| Date Prefix Parsing | Must-Have | Pending |
| Hierarchical Sorting | Should-Have | Pending |
| Gantt Chart (Basic) | Must-Have | Pending |
| Gantt Drag/Resize | Should-Have | Pending |
| Due Date Management | Should-Have | Pending |
| Quick Filters | Should-Have | Pending |

---

## Time Estimates

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Metrics | Engine, Lead Time, Throughput, Percentiles |
| 2 | Charts | CFD, Aging WIP, Health Badges, Progress |
| 3 | Timeline | Date Prefix, Gantt Basic, Gantt Interactions |

---

## Exit Criteria

- [ ] Metrics dashboard displays all 4 charts
- [ ] Lead time shows P50/P85 percentile lines
- [ ] CFD accurately reflects workflow
- [ ] Aging WIP highlights stale items
- [ ] Health badges show on cards
- [ ] Gantt chart renders issues with date prefixes
- [ ] Drag/resize updates due dates
- [ ] All "Must-Have" features complete
- [ ] Metrics calculations verified against `bd` CLI

---

## References

- [Metrics Spec](../spec/metrics.md)
- [Gantt Spec](../spec/gantt.md)
- [beads-dashboard Metrics](../references/beads-dashboard/README.md)
- [beads-pm-ui Wireframes](../references/beads-pm-ui/src/components/wireframes/)
- [Date Prefix Documentation](../references/requirements.md)
