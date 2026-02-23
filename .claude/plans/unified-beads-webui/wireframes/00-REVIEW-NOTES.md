# Wireframe Review Notes

> Feedback and enhancements from review session (2026-02-23)
> Items marked [MVP] should be addressed before Phase 1 implementation
> Items marked [POST-MVP] are deferred

---

## Global UI Elements [MVP]

### Navigation Bar
- Dark/Light Toggle button
- Days/Hours Toggle (swap between Xh vs Xd Yh)
- New Issue button
- New Epic button
- Configuration button
- Density selector (Compact/Standard/Wide)

### Configurability Notes
> The following are constant-mapped for MVP, revisit post-MVP:
- RAG indicator colors/thresholds
- Dark/Light color schemes
- Aging thresholds (warning vs critical)
- Card displayed content fields

---

## 01-Issue-List-View [MVP]

### Configurable Columns
Issue records should support configurable columns:
- id
- title
- epic (parent link)
- type
- priority
- status
- created
- assignee
- updated
- cycle-time
- age
- actions

### Links
- Each issue row should link to Issue Detail Modal
- Click on ID or title opens modal

---

## 02-Kanban-Board [MVP]

### Column Features
- Columns should be hideable
- Columns should be collapsible

### Card Features
- Cards link to Issue Detail Modal (click)
- Cards have context menu on right-click
- Card displayed content is configurable (constant for MVP)

### Board-Level Filters
- Standard filters apply at board level

---

## 03-Issue-Detail-Modal [MVP]

### Display
- Pop-up as overlay (already implemented)

### Tabs
Update tabs to include:
- Description
- Design (new)
- Acceptance (new)

### Links
- "Show Dependencies" link → opens Dependencies Modal

---

## 04-Issue-Dependencies-Modal [NEW]

> New wireframe needed

### Requirements
- Pop-up as overlay
- Sibling/child of Issue Detail Modal
- Shows blocking/blocked-by relationships
- Graph visualization of dependencies

---

## 05-Epics-View [MVP]

### Configurable Columns
Epic records should support configurable columns:
- id
- title
- children (count + expandable)
- type
- priority
- status
- assignee
- created
- updated
- cycle-time
- age
- actions

---

## 06-Graph-View [NEW]

> New wireframe needed

### Requirements
- Dependency graph visualization
- Issue relationship mapping
- Filter by epic, status, assignee
- Zoom and pan controls

---

## 07-Dashboard-View [NEW]

> New wireframe needed

### Time Scale
- Configurable: hourly, 4h, 8h, daily

### Metrics Widgets
- Average work age
- Active WIP count
- Stale items count (staleness threshold configurable)
- Days tracked (configurable time window)

### Charts
- Lead-time scatter-plot
- Aging WIP chart
- Cumulative Flow Diagram (CFD)
- Work-age distribution
- Daily throughput

---

## 08-Aging-Items-View [NEW]

> New wireframe needed

### Sections
- Warning items list
- Critical items list

### Thresholds
- Warning threshold (configurable, constant for MVP)
- Critical threshold (configurable, constant for MVP)

### Filters
- Warning vs Critical toggle
- Assignee
- Epic
- Priority
- Updated date range

---

## 09-Aging-Threshold-Config-Modal [NEW]

> New wireframe needed

### Controls
- Bool toggle: "Auto-calculate threshold from historical data"
- Warning threshold config (integer + scale)
- Critical threshold config (integer + scale)

### Preview
- Show which items would be flagged based on current config

---

## 10-Configuration-View [NEW]

> New wireframe needed

### Sections
- Display settings (density, theme, time format)
- RAG thresholds
- Aging thresholds
- Column configurations
- Keyboard shortcuts preview

---

## Summary of New Wireframes Needed

| Wireframe                      | Priority   | Complexity | Status |
| ------------------------------ | ---------- | ---------- | ------ |
| 07-issue-dependencies-modal.md | Must-Have  | Medium     | ✅ Done |
| 08-graph-view.md               | Should-Have| High       | ✅ Done |
| 09-dashboard-view.md           | Must-Have  | High       | ✅ Done |
| 10-aging-items-view.md         | Should-Have| Medium     | ✅ Done |
| 11-aging-threshold-config.md   | Could-Have | Low        | ✅ Done |
| 12-configuration-view.md       | Could-Have | Medium     | ✅ Done |

---

## Updates to Existing Wireframes

| Wireframe             | Updates Needed                                    | Status  |
| --------------------- | ------------------------------------------------- | ------- |
| 01-issue-list-view    | Add configurable columns section, global nav      | ✅ Done |
| 02-kanban-board       | Add column hide/collapse, right-click menu        | ✅ Done |
| 03-issue-detail-modal | Add Design/Acceptance tabs, dependencies link     | ✅ Done |
| 06-epics-view         | Add configurable columns section, global nav      | ✅ Done |
