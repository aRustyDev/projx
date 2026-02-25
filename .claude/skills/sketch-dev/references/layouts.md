# Sketch Layouts Reference

> Frames, Stacks, Grids, and spatial organization.

## Frames

Frames are the primary containers in Sketch, replacing the older "Artboard" terminology.

### Frame vs Artboard
- **Frame**: Modern term, supports nesting, constraints, clipping
- **Artboard**: Legacy term, same underlying object
- Both use the `Artboard` class in MCP API

### Creating Frames

```javascript
// Create a frame programmatically
const frame = new Artboard({
  name: '01-Issue-List-View',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});

// Frame properties
frame.background = {
  enabled: true,
  color: '#FFFFFFFF',
  includedInExport: true
};
```

### Frame Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name in layer list |
| `frame` | object | Position and dimensions |
| `background` | object | Background fill settings |
| `hasBackgroundColor` | boolean | Whether background is visible |
| `isFlippedHorizontal` | boolean | Horizontal flip state |
| `isFlippedVertical` | boolean | Vertical flip state |

### Frame Presets

Common frame sizes for wireframing:

```javascript
const FRAME_PRESETS = {
  desktop: { width: 1440, height: 900 },
  desktopLarge: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 812 },
  modal: { width: 600, height: 400 }
};
```

### Nesting Frames

Frames can be nested for complex layouts:

```javascript
// Parent frame
const pageFrame = new Artboard({
  name: 'Page',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});

// Nested frame (acts as container)
const modalFrame = new Rectangle({
  name: 'Modal Container',
  frame: { x: 420, y: 250, width: 600, height: 400 },
  parent: pageFrame,
  style: { fills: [{ color: '#FFFFFFFF' }] }
});
```

## Stacks (Auto Layout)

Stacks automatically arrange child layers with consistent spacing.

### Creating Stacks

**In Sketch UI:**
1. Select layers to stack
2. Right-click → Stack or use toolbar button
3. Or press `Ctrl+Shift+G` (macOS)

```javascript
// Programmatically, Stacks are represented as Groups with layout properties
// Note: MCP API may have limited Stack support
```

### Stack Properties

| Property | Values | Description |
|----------|--------|-------------|
| `orientation` | `horizontal`, `vertical` | Layout direction |
| `spacing` | number | Gap between items |
| `padding` | number or object | Internal padding |
| `alignment` | `start`, `center`, `end` | Cross-axis alignment |
| `distribution` | `start`, `center`, `end`, `space-between`, `space-around`, `space-evenly` | Main-axis distribution |
| `wrap` | boolean | Allow items to wrap to next line |

### Distribution Modes

```
start:           center:          end:
[A][B][C]        [A][B][C]           [A][B][C]
└────────┘       └────────┘       └────────┘

space-between:   space-around:    space-evenly:
[A]   [B]   [C]   [A]  [B]  [C]   [A]  [B]  [C]
│←───────→│       ←│ ←│  │→ │→     ←→  ←→  ←→
```

### Stack Sizing Options

| Option | Behavior |
|--------|----------|
| **Fixed** | Maintains set dimensions |
| **Hug Contents** | Shrinks to fit children |
| **Fill Container** | Expands to fill parent |

### Wrap Option

When `wrap` is enabled:
- Items flow to next line when container width is exceeded
- Row/column gap applies between wrapped lines
- Useful for tag lists, card grids

```
Without wrap:          With wrap:
[A][B][C][D][E]──→    [A][B][C]
(overflow)             [D][E]
```

### Individual Item Properties

Each item in a stack can have:

| Property | Description |
|----------|-------------|
| Fixed size | Item maintains its dimensions |
| Fill | Item expands to take available space |
| Minimum | Item has a minimum size |
| Maximum | Item has a maximum size |

### Nested Stacks

Combine stacks for complex layouts:

```
Horizontal Stack (outer)
├── Vertical Stack (sidebar)
│   ├── Logo
│   └── Nav Items
└── Vertical Stack (content)
    ├── Header
    └── Main Area
```

## Constraints (Pinning)

Constraints control how layers respond to parent resizing.

### Pin Settings

```
┌─────────────────────────────┐
│  ☐ Top    ☐ Right           │
│  ☐ Left   ☐ Bottom          │
│                             │
│  Width:  ○ Fixed  ○ Resize  │
│  Height: ○ Fixed  ○ Resize  │
└─────────────────────────────┘
```

### Common Patterns

| Pattern | Pins | Use Case |
|---------|------|----------|
| Fixed position | Top + Left | Static elements |
| Stretch width | Left + Right | Full-width bars |
| Stretch both | All four | Background layers |
| Center | None + Fixed | Centered content |
| Bottom-right | Bottom + Right | FAB buttons |

## Grid Systems

### Layout Grid

```javascript
// Sketch's built-in grid settings
// View → Canvas → Show Grid (Ctrl+G)

const gridSettings = {
  gridSize: 8,        // Base unit
  thickGridTimes: 8,  // Major gridlines every N units
  isEnabled: true
};
```

### Column Grid (Layout Settings)

For responsive design frameworks:

```
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  │  │  │  │  │  │  12 columns
├──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┤
│           Gutter: 24px             │
│           Margin: 72px             │
│           Column: 88px             │
└────────────────────────────────────┘
```

## Coordinate System

### Origin Point
- **Document**: Top-left is (0, 0)
- **Frame**: Each frame has its own coordinate system
- **Nested**: Children use parent-relative coordinates

### Position Properties

```javascript
// Absolute position (document coordinates)
layer.frame.x  // X from document origin
layer.frame.y  // Y from document origin

// Relative to parent
// Calculate manually: layer.frame.x - parent.frame.x
```

## Layout Patterns

### Sidebar + Content

```javascript
const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 56;

// Sidebar
new Rectangle({
  frame: { x: 0, y: 0, width: SIDEBAR_WIDTH, height: 900 },
  // Pin: Top + Left + Bottom
});

// Header
new Rectangle({
  frame: { x: SIDEBAR_WIDTH, y: 0, width: 1200, height: HEADER_HEIGHT },
  // Pin: Top + Left + Right
});

// Content
new Rectangle({
  frame: { x: SIDEBAR_WIDTH, y: HEADER_HEIGHT, width: 1200, height: 844 },
  // Pin: All four (stretch)
});
```

### Card Grid

```javascript
const CARD_WIDTH = 300;
const CARD_HEIGHT = 200;
const GAP = 24;
const COLS = 3;

for (let i = 0; i < 9; i++) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);

  new Rectangle({
    name: `Card ${i + 1}`,
    frame: {
      x: col * (CARD_WIDTH + GAP),
      y: row * (CARD_HEIGHT + GAP),
      width: CARD_WIDTH,
      height: CARD_HEIGHT
    }
  });
}
```

### Modal Overlay

```javascript
// Full-screen overlay
new Rectangle({
  name: 'Overlay',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  style: { fills: [{ color: '#111827E6' }] } // 90% opacity
});

// Centered modal
const modalWidth = 600;
const modalHeight = 400;
new Rectangle({
  name: 'Modal',
  frame: {
    x: (1440 - modalWidth) / 2,
    y: (900 - modalHeight) / 2,
    width: modalWidth,
    height: modalHeight
  }
});
```

## Z-Order (Layer Order)

Layers are ordered in the layer list:
- **Top of list** = Front (visible)
- **Bottom of list** = Back (behind)

```javascript
// Move layer to front
layer.moveToFront();

// Move layer to back
layer.moveToBack();

// Move relative to another layer
layer.moveAbove(otherLayer);
layer.moveBelow(otherLayer);
```

## Best Practices

### Frame Organization
1. Use consistent naming: `01-ViewName`, `02-ViewName`
2. Arrange frames left-to-right for user flows
3. Group related frames by vertical position
4. Leave space between frames (100-200px)

### Layout Tokens
```javascript
const LAYOUT = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16
  }
};
```

## Related References
- [Prototyping & Flows](./prototyping.md)
- [Styling & Colors](./styling.md)
- [MCP API Patterns](./mcp-api.md)
- [Glossary](./glossary.md) - Layout terminology
