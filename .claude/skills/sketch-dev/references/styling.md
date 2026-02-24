# Sketch Styling Reference

> Colors, fills, borders, shadows, and visual effects.

## Color System

### Color Format

Sketch uses 8-character hex codes (RGBA):

```javascript
// Format: #RRGGBBAA
const colors = {
  solidRed: '#FF0000FF',      // 100% opacity
  semiTransparent: '#3B82F680', // 50% opacity
  fullyTransparent: '#00000000' // 0% opacity
};
```

### Color Variables

Reusable colors that sync across document:

```javascript
// Creating Color Variables
// In Sketch UI: Components → Color Variables → Create

// Programmatically, colors are applied via fills/strokes
// Color Variables are document-level assets
```

### Design Token Pattern

```javascript
const COLORS = {
  // Base palette
  base: {
    white: '#FFFFFFFF',
    black: '#000000FF',
    transparent: '#00000000'
  },

  // Gray scale
  gray: {
    50: '#F9FAFBFF',
    100: '#F3F4F6FF',
    200: '#E5E7EBFF',
    300: '#D1D5DBFF',
    400: '#9CA3AFFF',
    500: '#6B7280FF',
    600: '#4B5563FF',
    700: '#374151FF',
    800: '#1F2937FF',
    900: '#111827FF'
  },

  // Semantic colors
  primary: '#3B82F6FF',
  success: '#10B981FF',
  warning: '#F59E0BFF',
  error: '#EF4444FF',

  // Status colors
  status: {
    open: '#FFFFFFFF',
    inProgress: '#3B82F6FF',
    review: '#8B5CF6FF',
    done: '#10B981FF',
    closed: '#6B7280FF'
  }
};
```

## Fills

### Single Fill

```javascript
const rectangle = new Rectangle({
  style: {
    fills: [{
      fillType: 'Color',
      color: '#3B82F6FF'
    }]
  }
});
```

### Multiple Fills (Layered)

Fills stack bottom-to-top:

```javascript
style: {
  fills: [
    { color: '#FFFFFFFF' },      // Bottom: white background
    { color: '#3B82F620' },      // Middle: blue tint at 12.5%
    { color: '#00000010' }       // Top: subtle shadow
  ]
}
```

### Gradient Fills

```javascript
style: {
  fills: [{
    fillType: 'Gradient',
    gradient: {
      gradientType: 'Linear',
      stops: [
        { position: 0, color: '#3B82F6FF' },
        { position: 1, color: '#1D4ED8FF' }
      ],
      from: { x: 0, y: 0 },
      to: { x: 1, y: 1 }
    }
  }]
}
```

### Image Fills

```javascript
style: {
  fills: [{
    fillType: 'Pattern',
    patternFillType: 'Fill',  // Fill, Fit, Stretch, Tile
    patternTileScale: 1,
    image: imageData
  }]
}
```

## Borders (Strokes)

### Basic Border

```javascript
style: {
  borders: [{
    color: '#E5E7EBFF',
    thickness: 1,
    position: 'Inside'  // Inside, Center, Outside
  }]
}
```

### Border Position

```
Inside:          Center:          Outside:
┌──────────┐    ┌──────────┐    ┌──────────┐
│▓▓▓▓▓▓▓▓▓▓│    │░░░░░░░░░░│    │          │
│▓        ▓│    │░        ░│    ░░░░░░░░░░░░
│▓        ▓│    │░        ░│    ░          ░
│▓▓▓▓▓▓▓▓▓▓│    │░░░░░░░░░░│    ░░░░░░░░░░░░
└──────────┘    └──────────┘    └──────────┘
```

### Dashed Borders

```javascript
style: {
  borders: [{
    color: '#9CA3AFFF',
    thickness: 2,
    dashPattern: [4, 2]  // [dash length, gap length]
  }]
}
```

### Border Radius

```javascript
// Rectangle with rounded corners
new Rectangle({
  frame: { x: 0, y: 0, width: 200, height: 48 },
  cornerRadius: 8,
  style: { /* ... */ }
});

// Individual corner radii
new Rectangle({
  cornerRadius: {
    topLeft: 8,
    topRight: 8,
    bottomLeft: 0,
    bottomRight: 0
  }
});
```

## Shadows

### Drop Shadow

```javascript
style: {
  shadows: [{
    color: '#00000040',    // 25% black
    offsetX: 0,
    offsetY: 4,
    blurRadius: 12,
    spread: 0
  }]
}
```

### Inner Shadow

```javascript
style: {
  innerShadows: [{
    color: '#00000020',
    offsetX: 0,
    offsetY: 2,
    blurRadius: 4,
    spread: 0
  }]
}
```

### Shadow Tokens

```javascript
const SHADOWS = {
  sm: {
    offsetX: 0, offsetY: 1,
    blurRadius: 2, spread: 0,
    color: '#00000010'
  },
  md: {
    offsetX: 0, offsetY: 4,
    blurRadius: 6, spread: -1,
    color: '#00000010'
  },
  lg: {
    offsetX: 0, offsetY: 10,
    blurRadius: 15, spread: -3,
    color: '#00000010'
  },
  xl: {
    offsetX: 0, offsetY: 20,
    blurRadius: 25, spread: -5,
    color: '#00000010'
  }
};
```

## Blur Effects

### Background Blur

```javascript
style: {
  blur: {
    blurType: 'Background',
    radius: 20,
    enabled: true
  }
}
```

### Gaussian Blur

```javascript
style: {
  blur: {
    blurType: 'Gaussian',
    radius: 10,
    enabled: true
  }
}
```

## Opacity

### Layer Opacity

```javascript
layer.style.opacity = 0.5;  // 50% visible
```

### Fill vs Layer Opacity

```javascript
// Fill opacity (only affects fill)
fills: [{ color: '#3B82F680' }]  // AA = 50%

// Layer opacity (affects entire layer including children)
layer.style.opacity = 0.5;
```

## Text Styling

### Font Properties

```javascript
const text = new Text({
  text: 'Hello World',
  style: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: 500,
    lineHeight: 24,
    letterSpacing: 0,
    textColor: '#111827FF',
    alignment: 'left'  // left, center, right, justify
  }
});
```

### Text Decoration

```javascript
style: {
  textUnderline: 'single',  // none, single, double
  textStrikethrough: 'single'
}
```

### Text Shadows

```javascript
style: {
  textShadows: [{
    color: '#00000040',
    offsetX: 0,
    offsetY: 1,
    blurRadius: 2
  }]
}
```

## Shared Styles

Reusable style presets:

### Layer Styles

```javascript
// Create shared style for buttons
// Components → Layer Styles → Create

// Apply shared style
layer.sharedStyleId = sharedStyleId;
```

### Text Styles

```javascript
// Create text style
// Components → Text Styles → Create

// Typography scale
const TEXT_STYLES = {
  h1: { fontSize: 36, fontWeight: 700, lineHeight: 44 },
  h2: { fontSize: 30, fontWeight: 600, lineHeight: 38 },
  h3: { fontSize: 24, fontWeight: 600, lineHeight: 32 },
  body: { fontSize: 16, fontWeight: 400, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: 400, lineHeight: 16 }
};
```

## Wireframe Style Patterns

### Container Styles

```javascript
const WIREFRAME_STYLES = {
  card: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#E5E7EBFF', thickness: 1, position: 'Inside' }],
    shadows: [{ color: '#00000010', offsetX: 0, offsetY: 1, blurRadius: 3 }],
    cornerRadius: 8
  },

  modal: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#E5E7EBFF', thickness: 1, position: 'Inside' }],
    shadows: [{ color: '#00000040', offsetX: 0, offsetY: 25, blurRadius: 50 }],
    cornerRadius: 12
  },

  overlay: {
    fills: [{ color: '#111827E6' }]  // 90% dark overlay
  },

  input: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#D1D5DBFF', thickness: 1, position: 'Inside' }],
    cornerRadius: 6
  }
};
```

### Button Styles

```javascript
const BUTTON_STYLES = {
  primary: {
    fills: [{ color: '#3B82F6FF' }],
    borders: [],
    cornerRadius: 6,
    textColor: '#FFFFFFFF'
  },

  secondary: {
    fills: [{ color: '#FFFFFFFF' }],
    borders: [{ color: '#D1D5DBFF', thickness: 1 }],
    cornerRadius: 6,
    textColor: '#374151FF'
  },

  ghost: {
    fills: [],
    borders: [],
    cornerRadius: 6,
    textColor: '#3B82F6FF'
  }
};
```

### Status Badge Styles

```javascript
const STATUS_BADGES = {
  open: {
    fills: [{ color: '#F3F4F6FF' }],
    textColor: '#4B5563FF'
  },
  inProgress: {
    fills: [{ color: '#DBEAFEFF' }],
    textColor: '#1D4ED8FF'
  },
  review: {
    fills: [{ color: '#EDE9FEFF' }],
    textColor: '#6D28D9FF'
  },
  done: {
    fills: [{ color: '#D1FAE5FF' }],
    textColor: '#047857FF'
  },
  critical: {
    fills: [{ color: '#FEE2E2FF' }],
    textColor: '#B91C1CFF'
  },
  warning: {
    fills: [{ color: '#FEF3C7FF' }],
    textColor: '#B45309FF'
  }
};
```

## Best Practices

### Do
- Use 8px grid for spacing consistency
- Define color tokens upfront
- Create shared styles for repeated patterns
- Use semantic color names (not "blue-500")
- Keep shadows subtle for wireframes

### Don't
- Hardcode colors throughout
- Use too many shadow variations
- Mix opacity methods inconsistently
- Ignore accessibility contrast

## Related References
- [Layouts & Frames](./layouts.md)
- [Symbols & Components](./symbols.md)
- [MCP API Patterns](./mcp-api.md)
