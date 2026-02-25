# Sketch Development Skill

> Comprehensive patterns for programmatic Sketch design via MCP integration.

## Overview

This skill enables Claude to create, modify, and manage Sketch designs programmatically using the Sketch MCP server. It covers symbols, prototyping, styling, layout, and workflow patterns derived from real-world wireframing experience.

## Quick Reference

### MCP Tools Available

| Tool | Purpose |
|------|---------|
| `mcp__sketch__run_code` | Execute JavaScript in Sketch |
| `mcp__sketch__get_selection_as_image` | Capture selected layers as image |

### Essential Objects

```javascript
const document = sketch.getSelectedDocument();
const page = document.selectedPage;
const selection = document.selectedLayers;
```

## Core Patterns

### Creating Frames

```javascript
const frame = new Artboard({
  name: '01-View-Name',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});
```

### Creating Shapes

```javascript
const rect = new Rectangle({
  name: 'Container',
  frame: { x: 0, y: 0, width: 200, height: 100 },
  parent: targetFrame,
  style: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#E5E7EBFF', thickness: 1 }]
  },
  cornerRadius: 8
});
```

### Creating Text

```javascript
const text = new Text({
  text: 'Label',
  frame: { x: 0, y: 0, width: 100, height: 24 },
  parent: targetFrame,
  style: {
    textColor: '#111827FF',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 500
  }
});
```

### Creating Symbols

```javascript
// ⚠️ CRITICAL: Do NOT use SymbolMaster.fromGroup() - it doesn't exist!
const master = new SymbolMaster({
  name: 'Components/Button/Primary',
  frame: { x: -2000, y: 0, width: 120, height: 40 },
  parent: symbolsPage
});

// Add children to master
new Rectangle({ name: 'Background', parent: master, /* ... */ });
new Text({ text: 'Label', parent: master, /* ... */ });
```

### Inserting Symbol Instances

```javascript
const master = document.getSymbols().find(s => s.name.includes('Button'));
const instance = master.createNewInstance();
instance.frame = { x: 100, y: 100, width: 120, height: 40 };
instance.parent = targetFrame;
```

### Creating Prototype Links

```javascript
new HotSpot({
  name: 'nav-to-detail',
  frame: { x: 0, y: 0, width: 200, height: 50 },
  parent: sourceFrame,
  flow: {
    targetId: targetFrame.id,
    animationType: 'slideFromRight'  // instant, dissolve, slideFrom*
  }
});
```

## Design Tokens

### Colors

```javascript
const COLORS = {
  gray: {
    50: '#F9FAFBFF', 100: '#F3F4F6FF', 200: '#E5E7EBFF',
    300: '#D1D5DBFF', 400: '#9CA3AFFF', 500: '#6B7280FF',
    600: '#4B5563FF', 700: '#374151FF', 800: '#1F2937FF',
    900: '#111827FF'
  },
  primary: '#3B82F6FF',
  success: '#10B981FF',
  warning: '#F59E0BFF',
  error: '#EF4444FF'
};
```

### Typography

```javascript
const TEXT = {
  h1: { fontSize: 36, fontWeight: 700 },
  h2: { fontSize: 24, fontWeight: 600 },
  h3: { fontSize: 18, fontWeight: 600 },
  body: { fontSize: 14, fontWeight: 400 },
  caption: { fontSize: 12, fontWeight: 400 }
};
```

### Spacing

```javascript
const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const RADIUS = { sm: 4, md: 8, lg: 12 };
```

## Layout Patterns

### Standard Wireframe Layout

```
1440 x 900 desktop frame:
┌─────────────────────────────────────────────────┐
│ Header (56px)                                   │
├───────────┬─────────────────────────────────────┤
│ Sidebar   │ Content Area                        │
│ (240px)   │ (1200px)                            │
│           │                                     │
│           │                                     │
└───────────┴─────────────────────────────────────┘
```

### Modal Overlay

```javascript
// Dark overlay (90% opacity)
new Rectangle({
  name: 'Overlay',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: frame,
  style: { fills: [{ color: '#111827E6' }] }
});

// Centered modal
new Rectangle({
  name: 'Modal',
  frame: { x: 420, y: 250, width: 600, height: 400 },
  parent: frame,
  style: { fills: [{ color: '#FFFFFFFF' }] },
  cornerRadius: 12
});
```

## Symbol Organization

### Naming Convention

Use forward slashes for hierarchy:
```
Components/Buttons/Primary
Components/Forms/Input
Components/Navigation/NavBar
```

### Component Library Layout

Place Symbol Masters at x: -2000 (left of main wireframes):
```
x: -2000                    x: 0
│                           │
│  ═══ COMPONENT LIBRARY    │  [Wireframes...]
│                           │
│  ── Navigation ──         │
│  [NavBar] [Sidebar]       │
│                           │
│  ── Forms ──              │
│  [Input] [Button]         │
```

## Prototyping

### Animation Types

| Value | Effect |
|-------|--------|
| `'instant'` | No animation |
| `'dissolve'` | Crossfade |
| `'slideFromRight'` | Slide in from right |
| `'slideFromLeft'` | Slide in from left |
| `'slideFromBottom'` | Slide in from bottom |
| `'slideFromTop'` | Slide in from top |

### Common Flows

- **Navigation**: `instant` for tab/menu switches
- **Drill-down**: `slideFromRight` for detail views
- **Modals**: `dissolve` with overlay
- **Back**: `slideFromLeft` to return

## Known Issues & Workarounds

| Issue | Solution |
|-------|----------|
| `SymbolMaster.fromGroup()` doesn't exist | Use `new SymbolMaster({...})` directly |
| Can't access library management | Use `document.getSymbols()` |
| No console.log visibility | Return debug info from script |
| Complex async limited | Use synchronous patterns |

## Workflow Tips

1. **Frame naming**: Use `01-`, `02-` prefixes for ordering
2. **Symbol placement**: Keep masters at x: -2000
3. **Return values**: Always return operation results
4. **Incremental changes**: Prefer small scripts over large ones
5. **Type checking**: Verify `layer.type` before operations

## Reference Documentation

| Topic | Reference |
|-------|-----------|
| Symbols & Components | [symbols.md](./references/symbols.md) |
| Layouts & Frames | [layouts.md](./references/layouts.md) |
| Prototyping & Flows | [prototyping.md](./references/prototyping.md) |
| Styling & Colors | [styling.md](./references/styling.md) |
| Shapes & Booleans | [shapes.md](./references/shapes.md) |
| Data & Linked Content | [data.md](./references/data.md) |
| Developer Handoff | [handoff.md](./references/handoff.md) |
| Workflow & Organization | [workflow.md](./references/workflow.md) |
| Naming Conventions | [naming.md](./references/naming.md) |
| Versioning & History | [versioning.md](./references/versioning.md) |
| MCP API Patterns | [mcp-api.md](./references/mcp-api.md) |
| Troubleshooting | [troubleshooting.md](./references/troubleshooting.md) |
| Glossary | [glossary.md](./references/glossary.md) |
| Gap Analysis | [gap-analysis.md](./references/gap-analysis.md) |

## Scripts Library

| Script | Purpose |
|--------|---------|
| [create-wireframe.js](./scripts/create-wireframe.js) | Standard frame with layout |
| [create-symbol.js](./scripts/create-symbol.js) | Symbol Master creation |
| [create-component-library.js](./scripts/create-component-library.js) | Full component library |
| [add-prototype-links.js](./scripts/add-prototype-links.js) | Batch prototype linking |
| [export-frames.js](./scripts/export-frames.js) | Export artboards with presets |
| [style-tokens.js](./scripts/style-tokens.js) | Design token definitions |
| [batch-rename.js](./scripts/batch-rename.js) | Pattern-based layer renaming |

## Usage Examples

### Create Complete Wireframe

```javascript
// See scripts/create-wireframe.js for full implementation
const frame = createWireframeFrame('Dashboard', 0, 0);
addHeader(frame);
addSidebar(frame);
addContentArea(frame);
```

### Batch Link Frames

```javascript
// Link all frames for prototype navigation
const frames = page.layers.filter(l => l.type === 'Artboard');
linkFramesForPrototype(frames, { animation: 'slideFromRight' });
```

### Create Component Library

```javascript
// Generate symbol masters with consistent styling
const components = ['NavBar', 'Sidebar', 'Button', 'Input'];
components.forEach((name, i) => {
  createSymbolMaster(name, { y: i * 100 });
});
```

## Integration Notes

### Prerequisites
- Sketch application running
- Document open
- Sketch MCP server configured

### Best Practices
- Always verify document/page existence
- Use try-catch for error handling
- Return meaningful operation results
- Test with small changes first
