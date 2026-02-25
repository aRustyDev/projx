---
number: 24
title: Design System Architecture and Design-to-Code Pipeline
status: proposed
date: 2026-02-25
tags:
  - design-system
  - sketch
  - tokens
deciders:
  - adam
---

# Design System Architecture and Design-to-Code Pipeline

## Context and Problem Statement

The project uses Sketch for wireframing and prototyping, and Tailwind CSS for styling in code. Currently, design tokens are defined in JavaScript (`style-tokens.js`) but not applied to the Sketch document, leading to:
- Zero color swatches, layer styles, or text styles in Sketch
- Duplicated token definitions across multiple scripts
- No automated sync between design files and codebase
- Manual translation of design decisions to code

How should we structure the design system to maintain consistency between Sketch designs and Tailwind CSS code while enabling efficient workflows?

## Decision Drivers

* **Consistency**: Design tokens must be single-source-of-truth across Sketch and code
* **Efficiency**: Minimize manual translation between design and implementation
* **Maintainability**: Changes to design system should propagate automatically
* **Tooling maturity**: Prefer well-maintained, open-source tools where possible
* **Compatibility**: Must work with Sketch MCP API and existing scripts

## Considered Options

* **Option A: Plugin-based sync** - Use existing Sketch plugins for token management
* **Option B: Custom MCP scripts** - Build custom scripts using Sketch MCP API
* **Option C: Hybrid approach** - Combine plugins for import with custom scripts for export

## Decision Outcome

Chosen option: **"Hybrid approach"**, because it leverages mature plugins for well-solved problems (icon libraries, dark mode generation) while using custom MCP scripts for project-specific needs (Tailwind export, component generation).

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Design System Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ Tailwind CSS │ ──────► │ style-tokens │ ◄───── Source of    │
│  │   Config     │ import  │     .js      │        Truth        │
│  └──────────────┘         └──────┬───────┘                     │
│                                  │                              │
│              ┌───────────────────┼───────────────────┐         │
│              ▼                   ▼                   ▼         │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  Sketch Colors   │  │  Sketch Styles  │  │ Code Vars    │  │
│  │    (Swatches)    │  │  (Text/Layer)   │  │ (CSS Custom) │  │
│  └──────────────────┘  └─────────────────┘  └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Adoption

| Purpose | Plugin | Status |
|---------|--------|--------|
| Icon library | **Iconify** | Adopt - 100K+ icons, open-source |
| Token application | **Puzzle Tokens** | Adopt - applies tokens to layers |
| Color migration | **Color Variables Migrator** | Adopt - creates swatches |
| Dark mode | **DarkModeSystem** | Adopt - generates dark variants |
| Charts | **chart** | Adopt - 16 chart types for wireframes |
| Consistency check | **Design System Validator** | Adopt - validates styles |

### Custom MCP Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `style-tokens.js` | Token definitions | Refactor - single source of truth |
| `apply-tokens.js` | Apply tokens to Sketch | Create - MCP-based application |
| `export-tailwind.js` | Export to Tailwind config | Create - replaces unmaintained plugin |
| `create-component-library.js` | Component generation | Extend - add chart components |

### Icon Strategy

Standardize on **Lucide** icons (via Iconify) for UI elements and **Material Design Icons** for system icons. Document conventions in design system guide.

### Consequences

* Good, because plugins handle well-solved problems (icons, validation)
* Good, because custom scripts enable project-specific workflows
* Good, because single token source prevents drift
* Good, because Iconify provides 100K+ production-ready icons
* Neutral, because requires plugin installation on designer machines
* Bad, because hybrid approach has more moving parts than pure solutions
* Bad, because sketch-tailwind plugin is unmaintained (must fork or reimplement)

### Confirmation

* Sketch document has >0 color swatches after token application
* Token values match between `style-tokens.js` and Tailwind config
* Design System Validator reports no style inconsistencies
* Iconify plugin successfully imports icons from chosen sets

## Pros and Cons of the Options

### Option A: Plugin-based sync

Use only existing plugins (Puzzle Tokens, sketch-tailwind, etc.) without custom code.

* Good, because less code to maintain
* Good, because plugins have established workflows
* Neutral, because requires learning multiple plugin interfaces
* Bad, because sketch-tailwind is unmaintained
* Bad, because plugins may not integrate with our MCP-based approach
* Bad, because less control over export format

### Option B: Custom MCP scripts

Build everything using Sketch MCP API, no plugins.

* Good, because full control over behavior
* Good, because integrates naturally with existing MCP workflow
* Good, because no external dependencies
* Neutral, because requires implementing solutions that already exist
* Bad, because duplicates work that plugins already do well
* Bad, because more development time for solved problems

### Option C: Hybrid approach

Combine plugins for import/validation with custom scripts for export/generation.

* Good, because leverages best of both approaches
* Good, because plugins handle complex tasks (icons, dark mode)
* Good, because custom scripts fit project-specific needs
* Neutral, because requires coordination between tools
* Bad, because more moving parts to manage
* Bad, because debugging spans multiple systems

## More Information

### Related Issues

- projx-p0x: Apply design tokens to Sketch
- projx-0z5: Create design system library
- projx-6nu: Tailwind config importer
- projx-9yx: Design tokens export

### Related ADRs

- ADR-0003: Use SvelteKit as Frontend Framework
- ADR-0007: Borrow Components from gastown_ui

### Implementation Notes

1. Install plugins via Sketch Plugin Manager
2. Run `apply-tokens.js` to populate Sketch document
3. Export via custom script to Tailwind config
4. Validate with Design System Validator
