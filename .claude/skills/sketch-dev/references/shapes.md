# Shapes & Boolean Operations Reference

> Creating shapes, path editing, and combining shapes with boolean operations.

## Basic Shapes

### Shape Types

| Shape | Shortcut | Description |
|-------|----------|-------------|
| Rectangle | `R` | Four-sided shape with optional corner radius |
| Oval/Ellipse | `O` | Circular or elliptical shape |
| Line | `L` | Straight line between two points |
| Arrow | `Shift+L` | Line with arrowhead |
| Polygon | - | Multi-sided shape (triangle, pentagon, etc.) |
| Star | - | Star shape with configurable points |
| Rounded Rectangle | - | Rectangle preset with radius |

### Creating Shapes Programmatically

```javascript
// Rectangle
const rect = new Rectangle({
  name: 'Card Background',
  frame: { x: 0, y: 0, width: 300, height: 200 },
  parent: targetFrame,
  style: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#E5E7EBFF', thickness: 1 }]
  },
  cornerRadius: 8
});

// Individual corner radii
const customRadius = new Rectangle({
  name: 'Tab',
  frame: { x: 0, y: 0, width: 100, height: 40 },
  parent: targetFrame,
  cornerRadius: {
    topLeft: 8,
    topRight: 8,
    bottomLeft: 0,
    bottomRight: 0
  }
});
```

### Shape Properties

```javascript
// Common shape properties
shape.frame = { x: 0, y: 0, width: 100, height: 100 };
shape.rotation = 45;  // Degrees
shape.isFlippedHorizontal = false;
shape.isFlippedVertical = false;
shape.cornerRadius = 8;  // For rectangles
```

## Paths

### Path Anatomy

Paths consist of:
- **Points** - Anchor locations
- **Segments** - Lines/curves between points
- **Handles** - Control bezier curves

```
       Handle
         ○
          \
Point ●────●────● Point
          /
         ○
       Handle
```

### Path Types

| Type | Description |
|------|-------------|
| **Straight** | Direct line between points |
| **Mirrored** | Symmetric bezier handles |
| **Asymmetric** | Independent bezier handles |
| **Disconnected** | Handles move independently |

### Creating Custom Paths

```javascript
// Create a path shape
const path = new ShapePath({
  name: 'Custom Arrow',
  frame: { x: 0, y: 0, width: 100, height: 50 },
  parent: targetFrame,
  style: {
    fills: [{ color: '#3B82F6FF' }],
    borders: []
  }
});

// Path points are defined in the shape's coordinate system
// Access via path.points for manipulation
```

### Pen Tool Patterns

| Action | Result |
|--------|--------|
| Click | Add corner point |
| Click + drag | Add curve point with handles |
| Double-click point | Toggle straight/curved |
| Option + click handle | Break handle symmetry |

## Boolean Operations

Boolean operations combine multiple shapes into a single complex shape.

### Operation Types

```
Union (⌘):           Subtract (⌥):        Intersect (⌃):       Difference (⇧):
┌───┬───┐            ┌───┐                    ┌───┐                ┌───┬───┐
│ A │ B │  →  ███    │ A │░░░  →  ███        │░A░│  →    ██       │ A │░B░│  →  █ █
│   │   │     ███    │   │███     █          │███│       ██       │   │   │     █ █
└───┴───┘     ███    └───┴───┘               └───┘                └───┴───┘
All combined         A minus B overlap    Only overlap       Non-overlapping
```

### Union

Combines all shapes into one, keeping all filled areas.

**Use cases:**
- Merging multiple shapes into single icon
- Creating complex silhouettes
- Simplifying grouped shapes

```javascript
// Select shapes and perform union
// Result: Single shape with all areas
```

### Subtract

Cuts the top shape out of the bottom shape.

**Use cases:**
- Creating cutouts/holes
- Badge with notification dot removed
- Icon with negative space

```
Before:                  After (Subtract):
┌─────────────┐          ┌─────────────┐
│  ┌─────┐    │          │  ┌─────┐    │
│  │ Cut │    │    →     │  │     │    │
│  └─────┘    │          │  └─────┘    │
└─────────────┘          └─────────────┘
                         (hole where "Cut" was)
```

### Intersect

Keeps only the overlapping area of all shapes.

**Use cases:**
- Masking shapes
- Creating intersection patterns
- Venn diagram centers

### Difference

Keeps only the non-overlapping areas (XOR).

**Use cases:**
- Creating frame outlines
- Ring shapes
- Exclusion patterns

### Performing Boolean Operations

**In Sketch UI:**
1. Select two or more shapes
2. Layer → Combine → [Operation]
3. Or use toolbar boolean buttons

**Keyboard Shortcuts:**
| Operation | Shortcut |
|-----------|----------|
| Union | `Cmd+Opt+U` |
| Subtract | `Cmd+Opt+S` |
| Intersect | `Cmd+Opt+I` |
| Difference | `Cmd+Opt+X` |

### Boolean Groups

Boolean results create a "Combined Shape" group:

```
Combined Shape (Union)
├── Rectangle
├── Oval
└── Triangle
```

You can:
- Edit individual shapes within
- Change boolean operation type
- Add/remove shapes from combination

## Flattening

### Flatten to Single Path

Layer → Flatten Selection

Converts:
- Boolean groups → Single path
- Text → Outlines
- Grouped shapes → Merged path

**When to flatten:**
- Before exporting SVG
- To reduce file complexity
- When boolean editing is complete

### Outline Stroke

Layer → Convert to Outlines

Converts strokes to filled shapes:

```
Before:                 After (Outline):
━━━━━━━━━━━            ████████████
(stroke)                (filled shape)
```

## Common Patterns

### Creating Icons

```javascript
// Example: Checkmark icon using path
const checkmark = new ShapePath({
  name: 'Checkmark',
  frame: { x: 0, y: 0, width: 24, height: 24 },
  parent: targetFrame,
  style: {
    fills: [],
    borders: [{
      color: '#10B981FF',
      thickness: 2,
      position: 'Center'
    }]
  }
});
// Path points would define the checkmark shape
```

### Creating Badges with Cutouts

```javascript
// 1. Create main badge shape
const badge = new Rectangle({
  name: 'Badge',
  frame: { x: 0, y: 0, width: 100, height: 32 },
  cornerRadius: 16
});

// 2. Create cutout shape
const cutout = new Oval({
  name: 'Cutout',
  frame: { x: 80, y: -8, width: 24, height: 24 }
});

// 3. Select both and apply Subtract
// Result: Badge with notch for notification dot
```

### Creating Ring/Donut Shape

```javascript
// 1. Create outer circle
const outer = new Oval({
  frame: { x: 0, y: 0, width: 100, height: 100 }
});

// 2. Create inner circle (centered)
const inner = new Oval({
  frame: { x: 20, y: 20, width: 60, height: 60 }
});

// 3. Subtract inner from outer
// Result: Ring shape
```

### Progress Ring

```javascript
// Use arc path or combine oval with rotated rectangle subtract
// More complex - requires path manipulation
```

## Vector Editing Mode

### Entering Edit Mode

- Double-click shape to edit points
- Press `Enter` on selected shape
- Or Layer → Edit Shape

### Point Operations

| Action | Description |
|--------|-------------|
| Click point | Select point |
| Drag point | Move point |
| Double-click point | Change point type |
| Click segment | Add point |
| Delete | Remove selected point |
| Cmd+click | Toggle point type |

### Handle Operations

| Action | Description |
|--------|-------------|
| Drag handle | Adjust curve |
| Option+drag | Break symmetry |
| Double-click | Reset to straight |

## Shape Transforms

### Rotate

```javascript
shape.rotation = 45;  // Degrees, clockwise
// Or Layer → Transform → Rotate
```

### Flip

```javascript
shape.isFlippedHorizontal = true;
shape.isFlippedVertical = true;
// Or Layer → Transform → Flip
```

### Scale

```javascript
// Resize frame (maintains aspect if shift held in UI)
shape.frame = {
  ...shape.frame,
  width: shape.frame.width * 1.5,
  height: shape.frame.height * 1.5
};
```

## Best Practices

### Do
- Use boolean operations for complex icons
- Flatten when editing is complete
- Keep original shapes in a hidden group for editing
- Use consistent stroke widths for icon sets

### Don't
- Over-complicate with too many boolean operations
- Flatten before design is finalized
- Mix filled and stroked elements inconsistently
- Forget to outline text before merging

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Boolean result unexpected | Check layer order (top affects bottom) |
| Can't edit combined shape | Double-click to enter edit mode |
| Path looks jagged | Increase export resolution |
| Stroke not outlining | Select shape, not stroke |
| Flatten losing detail | Check for overlapping paths |

## Graphics Container

A Graphics container is a special layer type optimized for icons and vector artwork.

### Creating Graphics

1. Select one or more layers
2. Press `G` or Layer → Create Graphics
3. The layers are wrapped in a Graphics container

### Properties

| Property | Behavior |
|----------|----------|
| **Proportional resize** | Maintains aspect ratio when scaled |
| **Vector rendering** | Optimized for crisp vector display |
| **Icon organization** | Groups related icon parts |

### Graphics vs Groups

| Feature | Graphics | Group |
|---------|----------|-------|
| Resize behavior | Proportional (aspect ratio locked) | Free resize |
| Use case | Icons, logos, vector art | General organization |
| Scaling | Contents scale together | Contents independent |

### Creating Icons with Graphics

```javascript
// After creating icon elements, group as Graphics
// In UI: Select shapes → Press G

// Graphics containers in MCP appear as Groups
// with specific scaling behavior

const iconGroup = new Group({
  name: 'Icons/Check',
  layers: [checkmarkPath, circleBg],
  parent: targetFrame
});
// Note: MCP may not distinguish Graphics from Groups
```

### Best Practices

- Use Graphics for all icon components
- Keep icons at consistent base sizes (24x24, 32x32)
- Export Graphics with proper scaling (1x, 2x, 3x)
- Name Graphics with icon category prefix

## Related References
- [Styling & Colors](./styling.md)
- [MCP API Patterns](./mcp-api.md)
- [Developer Handoff](./handoff.md)
- [Troubleshooting](./troubleshooting.md) - Shape issues
- [Glossary](./glossary.md) - Shape terminology
