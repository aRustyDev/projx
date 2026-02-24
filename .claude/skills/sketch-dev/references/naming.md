# Sketch Naming Conventions Reference

> Consistent naming patterns for layers, symbols, colors, and files.

## Layer Naming

### General Principles

| Principle | Example | Anti-Pattern |
|-----------|---------|--------------|
| Descriptive | `HeaderNavigation` | `Group 1` |
| PascalCase or kebab-case | `UserAvatar` or `user-avatar` | `user avatar` |
| Hierarchical | `Card/Header/Title` | `title` |
| No duplicates in same level | `SubmitButton`, `CancelButton` | `Button`, `Button` |

### Frame Naming

Number prefix + descriptive name:

```
✅ Good:
01-Issue-List-View
02-Kanban-Board
03-Issue-Detail-Modal
04-Filter-Panel
05-Create-Issue-Modal

❌ Bad:
Artboard 1
List
board view
Modal
```

### Component Layer Naming

```
Button (Symbol Master)
├── Background
├── Icon (optional)
├── Label
└── HoverState (hidden)

Card (Symbol Master)
├── Container
├── Header
│   ├── Title
│   ├── Subtitle
│   └── Actions
├── Body
│   └── Content
└── Footer
```

### Smart Animate Naming

Layers with matching names animate between frames:

```
Frame A:                    Frame B:
├── Background             ├── Background    ← matches
├── Card                   ├── Card          ← matches (animates)
│   ├── Title             │   ├── Title     ← matches
│   └── Body              │   └── Body      ← matches
└── NavBar                 └── NavBar        ← matches
```

**Tip**: Prefix non-animating layers with `_` (underscore):

```
├── _StaticHeader     ← won't animate
├── AnimatedCard      ← will animate
└── _Background       ← won't animate
```

## Symbol Naming

### Hierarchy Pattern

Use `/` to create menu hierarchy:

```
Components/
├── Buttons/
│   ├── Primary
│   ├── Secondary
│   ├── Ghost
│   └── Icon
├── Forms/
│   ├── Input
│   ├── Select
│   ├── Checkbox
│   └── Radio
├── Navigation/
│   ├── NavBar
│   ├── Sidebar
│   ├── Tabs
│   └── Breadcrumbs
└── Feedback/
    ├── Alert
    ├── Toast
    └── Modal
```

### Variant Naming

Include variant in name:

```
Components/Buttons/Primary/Default
Components/Buttons/Primary/Hover
Components/Buttons/Primary/Disabled
Components/Buttons/Primary/Loading

Components/Forms/Input/Empty
Components/Forms/Input/Filled
Components/Forms/Input/Error
Components/Forms/Input/Disabled
```

### Size Variants

```
Components/Buttons/Primary/Small
Components/Buttons/Primary/Medium
Components/Buttons/Primary/Large

OR

Components/Buttons/Primary-SM
Components/Buttons/Primary-MD
Components/Buttons/Primary-LG
```

### State Naming

| State | Suffix |
|-------|--------|
| Default | (none) or `/Default` |
| Hover | `/Hover` |
| Active/Pressed | `/Active` |
| Focused | `/Focus` |
| Disabled | `/Disabled` |
| Loading | `/Loading` |
| Error | `/Error` |
| Success | `/Success` |

## Color Variable Naming

### Semantic Naming

```
✅ Semantic (preferred):
color/primary
color/primary-hover
color/secondary
color/success
color/error
color/warning
color/background
color/surface
color/text
color/text-secondary

❌ Literal (avoid):
blue
blue-500
red
light-gray
```

### Hierarchical Color System

```
color/
├── base/
│   ├── white
│   ├── black
│   └── transparent
├── gray/
│   ├── 50
│   ├── 100
│   ├── 200
│   └── ...900
├── primary/
│   ├── default
│   ├── hover
│   ├── active
│   └── disabled
├── semantic/
│   ├── success
│   ├── warning
│   ├── error
│   └── info
└── surface/
    ├── background
    ├── card
    ├── modal
    └── overlay
```

## Text Style Naming

### Typography Scale

```
text/
├── heading/
│   ├── h1
│   ├── h2
│   ├── h3
│   └── h4
├── body/
│   ├── large
│   ├── default
│   └── small
├── label/
│   ├── default
│   └── small
└── caption/
    └── default
```

### Weight Variants

```
text/body/default          (400 regular)
text/body/default-medium   (500 medium)
text/body/default-bold     (700 bold)
```

## Layer Style Naming

### Pattern

`category/component/variant`

```
styles/
├── card/
│   ├── default
│   ├── elevated
│   └── outlined
├── button/
│   ├── primary
│   ├── secondary
│   └── ghost
├── input/
│   ├── default
│   ├── focus
│   └── error
└── shadow/
    ├── sm
    ├── md
    ├── lg
    └── xl
```

## File Naming

### Project Files

```
✅ Good:
project-wireframes.sketch
project-design-system.sketch
project-mobile-v2.sketch

❌ Bad:
wireframes.sketch
final.sketch
FINAL_v2_REAL.sketch
```

### Versioned Files

```
project-wireframes-v1.0.sketch
project-wireframes-v1.1.sketch
project-wireframes-v2.0.sketch
```

### Environment/Context Files

```
project-wireframes-desktop.sketch
project-wireframes-mobile.sketch
project-wireframes-tablet.sketch
```

## Page Naming

### Numbered Pages

```
00-Cover
01-Wireframes
02-Components
03-Prototypes
04-Archive
```

### Descriptive Pages

```
📄 Cover
📄 User Flows
📄 Dashboard
📄 Settings
📄 Components
📄 Symbols (auto)
```

## Export Naming

### Asset Exports

Configure export naming in export dialog:

```
Pattern: [name]@[scale]x.[extension]

Examples:
icon-close@1x.png
icon-close@2x.png
icon-close@3x.png

OR with folder:
icons/close@2x.png
```

### Slice Naming

Name slices for their export purpose:

```
export/icon-close
export/hero-image
export/logo-dark
export/logo-light
```

## Hotspot Naming

For prototyping links:

```
Descriptive action:
link-to-[destination]
open-[modal/overlay]
close-[modal]
nav-[destination]

Examples:
link-to-detail-view
open-filter-panel
close-modal
nav-dashboard
back-to-list
```

## Reserved Prefixes

| Prefix | Meaning |
|--------|---------|
| `_` | Hidden/non-exported |
| `#` | Slice for export |
| `@` | Override point |

```
_Helper-Grid          ← Not exported, utility layer
#export-icon         ← Marked for export
@avatar-slot         ← Override insertion point
```

## Batch Renaming

### Rename It Plugin Patterns

```
Find and Replace:
- Find: "Artboard"
- Replace: "Frame"

Sequential:
- Pattern: "%N%-View"
- Result: "01-View", "02-View", etc.

Uppercase:
- Convert layer names to UPPERCASE
```

### MCP Batch Rename

```javascript
// Rename all frames with number prefix
const frames = page.layers.filter(l => l.type === 'Artboard');
frames.forEach((frame, i) => {
  const num = String(i + 1).padStart(2, '0');
  const cleanName = frame.name.replace(/^\d+-/, '');
  frame.name = `${num}-${cleanName}`;
});
```

## Anti-Patterns to Avoid

| Bad | Good | Why |
|-----|------|-----|
| `Group` | `CardContainer` | Descriptive |
| `Artboard 1` | `01-Dashboard` | Numbered + named |
| `blue` | `color/primary` | Semantic |
| `Rectangle` | `Background` | Purpose-based |
| `Copy` | `DuplicateButton` | Intentional name |
| `final` | `v1.0` | Versioned |

## Related References
- [Symbols & Components](./symbols.md)
- [Styling & Colors](./styling.md)
- [Workflow & Organization](./workflow.md)
