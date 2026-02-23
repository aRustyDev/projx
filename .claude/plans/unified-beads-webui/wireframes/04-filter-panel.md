# Filter Panel - ASCII Wireframe

## Overview
Advanced filtering interface for issue list and board views. Supports multiple filter types, saved filter presets, and URL-synced state.

---

## Inline Filter Bar (Default)

```asciidoc
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search issues...                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Filter Dropdown

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│           ┌──────────────────┐                                                          │
│           │ ☑ Bug            │                                                          │
│           │ ☑ Feature        │                                                          │
│           │ ☑ Task           │                                                          │
│           │ ☐ Epic           │                                                          │
│           │ ☐ Chore          │                                                          │
│           ├──────────────────┤                                                          │
│           │ [Select All]     │                                                          │
│           │ [Clear]          │                                                          │
│           └──────────────────┘                                                          │
```

---

## Status Filter Dropdown

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                    ┌──────────────────┐                                                 │
│                    │ ☑ ⚪ Open         │                                                 │
│                    │ ☑ 🔵 In Progress │                                                 │
│                    │ ☐ 🟣 Review      │                                                 │
│                    │ ☐ 🟢 Done        │                                                 │
│                    │ ☐ ⚫ Closed      │                                                 │
│                    ├──────────────────┤                                                 │
│                    │ [Active Only]    │  ← Quick preset                                 │
│                    │ [All]            │                                                 │
│                    └──────────────────┘                                                 │
```

---

## Priority Filter Dropdown

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                               ┌──────────────────┐                                      │
│                               │ ☑ 🔴 P1 Critical │                                      │
│                               │ ☑ 🟡 P2 High     │                                      │
│                               │ ☐ 🔵 P3 Medium   │                                      │
│                               │ ☐ ⚪ P4 Low      │                                      │
│                               │ ☐    None        │                                      │
│                               ├──────────────────┤                                      │
│                               │ [High Priority]  │  ← P1+P2                             │
│                               └──────────────────┘                                      │
```

---

## Assignee Filter Dropdown (Searchable)

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                                            ┌───────────────────────┐                    │
│                                            │ 🔍 Search users...    │                    │
│                                            ├───────────────────────┤                    │
│                                            │ ☑ 👤 Me (@adam)       │                    │
│                                            │ ☐ 👤 @alice           │                    │
│                                            │ ☐ 👤 @bob             │                    │
│                                            │ ☐ 👤 @charlie         │                    │
│                                            │ ☐    Unassigned       │                    │
│                                            ├───────────────────────┤                    │
│                                            │ [My Issues]           │                    │
│                                            │ [Unassigned]          │                    │
│                                            └───────────────────────┘                    │
```

---

## Labels Filter Dropdown

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                                                         ┌───────────────────────┐       │
│                                                         │ 🔍 Search labels...   │       │
│                                                         ├───────────────────────┤       │
│                                                         │ ☑ auth                │       │
│                                                         │ ☑ backend             │       │
│                                                         │ ☐ frontend            │       │
│                                                         │ ☐ ui                  │       │
│                                                         │ ☐ docs                │       │
│                                                         │ ☐ api                 │       │
│                                                         │ ☐ performance         │       │
│                                                         │     ... (12 more)     │       │
│                                                         └───────────────────────┘       │
```

---

## Active Filters Display

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│                                                                                         │
│  ┌─ Active Filters ─────────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │  Type: Bug, Feature  [×]                                                          │  │
│  │  Status: Open, In Progress  [×]                                                   │  │
│  │  Priority: P1, P2  [×]                                                            │  │
│  │  Assignee: @alice  [×]                                                            │  │
│  │  Labels: auth, backend  [×]                                                       │  │
│  │                                                                                   │  │
│  │                                                    [Clear All]  [Save Filter]     │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Advanced Filter Panel (Expanded)

```asciidoc
│  Filters: [Type ▼] [Status ▼] [Priority ▼] [Assignee ▼] [Labels ▼] [+ Filter]          │
│           ↓                                                                             │
│  ┌─ Advanced Filters ───────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │  │
│  │  │ Created         │  │ Updated         │  │ Text Search     │                   │  │
│  │  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                   │  │
│  │  │ [Any time    ▼] │  │ [Last 7 days ▼] │  │ [Title only  ▼] │                   │  │
│  │  │                 │  │                 │  │                 │                   │  │
│  │  │ ○ Any time      │  │ ○ Any time      │  │ ○ Title only    │                   │  │
│  │  │ ○ Today         │  │ ● Last 7 days   │  │ ○ Description   │                   │  │
│  │  │ ○ Last 7 days   │  │ ○ Last 30 days  │  │ ● Title + Desc  │                   │  │
│  │  │ ○ Last 30 days  │  │ ○ Last 90 days  │  │ ○ Comments too  │                   │  │
│  │  │ ○ Custom range  │  │ ○ Custom range  │  │                 │                   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                        │  │
│  │  │ Has Comments    │  │ Has Parent      │                                        │  │
│  │  ├─────────────────┤  ├─────────────────┤                                        │  │
│  │  │ ○ Any           │  │ ○ Any           │                                        │  │
│  │  │ ○ Yes           │  │ ○ Yes (subtask) │                                        │  │
│  │  │ ○ No            │  │ ○ No (top-level)│                                        │  │
│  │  └─────────────────┘  └─────────────────┘                                        │  │
│  │                                                                                   │  │
│  │                                          [Reset]  [Apply]  [Save as Preset]      │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Saved Filter Presets

```asciidoc
│  Filters: [Type ▼] [Status ▼] ... [+ Filter]  │  Presets: [My Bugs ▼]                   │
│                                                          ┌────────────────────────┐     │
│                                                          │ ⭐ My Bugs             │     │
│                                                          │    My Open Issues      │     │
│                                                          │    High Priority       │     │
│                                                          │    Needs Review        │     │
│                                                          │    Unassigned          │     │
│                                                          ├────────────────────────┤     │
│                                                          │ [+ Save Current]       │     │
│                                                          │ [Manage Presets...]    │     │
│                                                          └────────────────────────┘     │
```

---

## Save Filter Dialog

```asciidoc
│  ┌─────────────────────────────────────────────┐                                        │
│  │  Save Filter Preset                    [×]  │                                        │
│  │                                             │                                        │
│  │  Name:                                      │                                        │
│  │  ┌─────────────────────────────────────┐   │                                        │
│  │  │ High priority auth bugs             │   │                                        │
│  │  └─────────────────────────────────────┘   │                                        │
│  │                                             │                                        │
│  │  Current filters:                           │                                        │
│  │  • Type: Bug                                │                                        │
│  │  • Priority: P1, P2                         │                                        │
│  │  • Labels: auth                             │                                        │
│  │                                             │                                        │
│  │  ☐ Set as default view                      │                                        │
│  │                                             │                                        │
│  │              [Cancel]  [Save]               │                                        │
│  │                                             │                                        │
│  └─────────────────────────────────────────────┘                                        │
```

---

## Component Breakdown

### Filter Bar
- Row of dropdown buttons
- Each button shows current selection count if filtered
- [+ Filter] opens advanced panel

### Filter Dropdown
- Multi-select checkboxes
- Search input for large lists (Assignee, Labels)
- Quick preset buttons
- Select All / Clear actions

### Active Filters
- Horizontal list of filter chips
- Each chip: filter name + values + remove [×]
- Clear All button
- Save Filter button

### Advanced Panel
- Date range filters (Created, Updated)
- Search scope selector
- Boolean filters (Has Comments, Has Parent)
- Apply / Reset buttons

### Presets
- Dropdown of saved filters
- Star icon for favorites
- Save current / Manage options

---

## Filter State URL Sync

Filters sync to URL query parameters:
```
/issues?type=bug,feature&status=open,in_progress&priority=p1,p2&assignee=alice&labels=auth,backend
```

Benefits:
- Shareable filter links
- Browser back/forward works
- Bookmarkable views

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Filter dropdown | Click | Open multi-select menu |
| Checkbox | Click | Toggle filter value |
| [×] on chip | Click | Remove that filter |
| [Clear All] | Click | Remove all filters |
| [+ Filter] | Click | Open advanced panel |
| [Apply] | Click | Apply advanced filters |
| [Save Filter] | Click | Open save dialog |
| Preset | Click | Load saved filter |
| Search input | Type | Filter dropdown options |

---

## Filter Logic

- Multiple values within same filter: OR
  - `status=open,in_progress` → Open OR In Progress
- Different filters: AND
  - `status=open&priority=p1` → Open AND P1
- Labels: AND (all must match)
  - `labels=auth,backend` → has auth AND backend

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search input |
| `f` | Open filter panel |
| `Escape` | Close dropdowns/panel |
| `Enter` | Apply filter (in dropdown) |

---

## Design Tokens

```css
/* Filter chips */
--filter-chip-bg: #e0f2fe
--filter-chip-text: #0369a1
--filter-chip-hover: #bae6fd

/* Dropdown */
--dropdown-bg: #ffffff
--dropdown-border: #e5e7eb
--dropdown-shadow: 0 4px 12px rgba(0,0,0,0.1)
--dropdown-item-hover: #f3f4f6

/* Checkboxes */
--checkbox-checked: #3b82f6
--checkbox-unchecked: #d1d5db
```

---

## Accessibility

- Dropdowns have `role="listbox"`
- Checkboxes properly labeled
- Active filters announced on change
- Filter count in button label for screen readers
- Keyboard navigation within dropdowns

---

## Related Wireframes
- [01-issue-list-view.md](01-issue-list-view.md) - Filter bar location
- [02-kanban-board.md](02-kanban-board.md) - Filter applies to board
