# Sketch SKILL Gap Analysis

> Comparison between official Sketch documentation and current SKILL coverage.

## Summary

This document identifies features in official Sketch documentation that are missing or underrepresented in the SKILL reference materials.

| Category | Coverage | Priority | Notes |
|----------|----------|----------|-------|
| Data Tool | ❌ Missing | High | Linked data, JSON, data plugins |
| Graphics Container | ❌ Missing | Medium | Icon grouping, proportional resize |
| Stack Layout (Advanced) | ⚠️ Partial | Medium | Wrap, distribution modes, sizing |
| Overlay Triggers | ⚠️ Partial | Medium | Hover, press, toggle, outside click |
| Color Variables (Advanced) | ⚠️ Partial | Medium | Find/replace, tokens export |
| Frame Features (Advanced) | ⚠️ Partial | Low | Auto-pin, edit mode, templates |
| Symbol Features (Advanced) | ⚠️ Partial | Low | Override hiding, component panel |
| Scrolling & Fixed Elements | ⚠️ Partial | Medium | hasScrolling, isFixedToViewport |
| Tints | ❌ Missing | Low | Layer tinting feature |
| Inner Shadows | ✅ Covered | - | In styling.md |
| Smart Animate | ✅ Covered | - | In prototyping.md |

---

## Missing Features (High Priority)

### 1. Data Tool

**Official docs**: https://www.sketch.com/docs/designing/data/

**Not covered in SKILL:**
- Linked Data feature (connecting text/images to data sources)
- Data JSON format specification
- Data Suppliers and plugins (DataSupplier API)
- Refresh and disconnect operations
- Custom data formats and CSV import

**Recommended addition**: Create `references/data.md` covering:
```javascript
// Example MCP code for data operations
const dataSupplier = sketch.DataSupplier;

// Supply text data
DataSupplier.supplyDataAtIndex(context.data.key, 'Hello World', 0);

// Supply image data
DataSupplier.supplyImageAtIndex(context.data.key, imageUrl, 0);
```

### 2. Graphics Container

**Official docs**: Mentioned in layer types

**Not covered in SKILL:**
- Creating Graphics containers (press G with selection)
- Proportional resize behavior
- Icon organization use case
- Difference from Groups

**Recommended addition**: Add to `references/layouts.md` or create section in `references/shapes.md`:
```javascript
// Graphics containers are represented as Groups with specific properties
// They maintain aspect ratio when resizing
```

---

## Partial Coverage (Medium Priority)

### 3. Stack Layout (Advanced Features)

**Current coverage**: `layouts.md` lines 78-108

**Missing details:**
- **Wrap option**: Allow items to wrap to next line
- **Distribution modes**: `space-between`, `space-around`, `space-evenly`
- **Layer sizing in stacks**: How individual layers resize
- **Nested stacks**: Best practices for complex layouts
- **Stack shortcut**: Ctrl+Shift+G or right-click → Stack

**MCP API gap:**
```javascript
// Stack properties that may need documentation
stack.wrap = true;  // Enable wrapping
stack.distribution = 'space-between';  // Distribution mode
```

### 4. Overlay Triggers

**Current coverage**: `prototyping.md` lines 95-139

**Missing details:**
- **Outside interaction**: Setting to allow/prevent background clicks
- **Trigger types**: `hover`, `press`, `toggle` (not just click)
- **Manual overlay positioning**: Precise x/y placement
- **Multiple overlays**: Stacking behavior

**Recommended additions:**
```javascript
flow: {
  type: 'overlay',
  trigger: 'hover',  // or 'press', 'toggle'
  overlaySettings: {
    outsideInteraction: 'allowAll',  // or 'preventAll'
    position: 'manual',
    offsetX: 100,
    offsetY: 50
  }
}
```

### 5. Color Variables (Advanced)

**Current coverage**: `styling.md` lines 20-31 (brief mention)

**Missing details:**
- **Find and Replace**: Replace colors across document
- **Tokens Export**: Export to CSS variables or JSON
- **Grouping**: Organizing colors by folders/namespaces
- **Linking**: Connecting to external color systems

**Recommended additions:**
```javascript
// Export color variables to CSS
// File → Export → Color Variables → CSS/JSON

// Find and replace color
// Edit → Find and Replace Color (Cmd+Shift+F)
```

### 6. Scrolling & Fixed Elements

**Current coverage**: `prototyping.md` lines 302-319

**Missing details:**
- Detailed MCP API for scrolling
- Fixed header/footer patterns
- Scroll containers within artboards
- Horizontal scrolling

**Recommended additions:**
```javascript
// Configure frame scrolling
frame.hasScrolling = true;
frame.scrollDirection = 'vertical';  // or 'horizontal', 'both'
frame.scrollOrigin = { x: 0, y: 0 };

// Fixed layer (stays in place during scroll)
layer.isFixedToViewport = true;
```

---

## Partial Coverage (Low Priority)

### 7. Frame Features (Advanced)

**Current coverage**: `layouts.md` lines 5-76

**Missing details:**
- **Auto-pin**: Automatic constraint detection
- **Edit mode**: Double-click to enter frame for editing
- **Frame templates**: Preset frame sizes and configurations
- **Clip contents**: Whether content outside frame bounds is visible

```javascript
// Frame clipping
frame.clippingMaskMode = 'ClipToBounds';  // or 'None'

// Frame templates are UI-only, no MCP equivalent
```

### 8. Symbol Features (Advanced)

**Current coverage**: `symbols.md` (comprehensive)

**Missing details:**
- **Override hiding**: Hide specific overrides from instances
- **Component panel**: UI organization features
- **Symbol source**: Editing source location
- **Default overrides**: Pre-set override values

### 9. Tints

**Not covered:**
- Layer tinting (single-color overlay on images)
- Tint vs Fill distinction
- Programmatic tint application

```javascript
// Tint properties
layer.style.tint = {
  color: '#FF0000',
  opacity: 0.5
};
```

---

## Already Well Covered ✅

The following Sketch features are adequately documented:

- **Frames/Artboards**: `layouts.md`
- **Shapes**: `shapes.md`
- **Text styling**: `styling.md`
- **Fills & borders**: `styling.md`
- **Shadows**: `styling.md`
- **Blur effects**: `styling.md`
- **Symbols basics**: `symbols.md`
- **Smart Animate**: `prototyping.md`
- **Hotspots & links**: `prototyping.md`
- **Layer naming**: `naming.md`
- **Export presets**: `handoff.md`
- **Version history**: `versioning.md`

---

## Recommended Actions

### Immediate (High Priority)
1. Create `references/data.md` for Data tool documentation
2. Add Graphics container section to `shapes.md`

### Short-term (Medium Priority)
3. Expand Stack Layout section in `layouts.md`
4. Add overlay trigger details to `prototyping.md`
5. Expand Color Variables section in `styling.md`
6. Add scrolling/fixed element details to `prototyping.md`

### Long-term (Low Priority)
7. Add advanced Frame features to `layouts.md`
8. Add override hiding to `symbols.md`
9. Document Tints in `styling.md`

---

## Research Notes

### Documentation Sources Used
- https://www.sketch.com/docs/designing/
- https://www.sketch.com/docs/designing/stack-layout/
- https://www.sketch.com/docs/designing/data/
- https://www.sketch.com/docs/designing/overlays/
- https://www.sketch.com/docs/designing/color-variables/
- https://www.sketch.com/docs/designing/frames/
- https://www.sketch.com/docs/designing/symbols/

### Pages That Returned 404
- Smart Animate (may have been reorganized)
- Links and Hotspots (may have been reorganized)
- Animations (may have been reorganized)

These features are likely covered elsewhere in the docs under different URLs.
