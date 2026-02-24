# Sketch MCP API Reference

> Programmatic design manipulation via Model Context Protocol.

## Overview

The Sketch MCP server enables Claude to interact with Sketch directly via JavaScript code execution.

### Available Tools

| Tool | Purpose |
|------|---------|
| `get_selection_as_image` | Capture visual of selected layers |
| `run_code` | Execute JavaScript in Sketch context |

## Setup

### Client Configuration

```json
{
  "mcpServers": {
    "sketch": {
      "command": "npx",
      "args": ["-y", "@anthropic/sketch-mcp-server"]
    }
  }
}
```

### Prerequisites

- Sketch must be running
- Document must be open
- Sketch MCP plugin installed

## Core Objects

### Global Context

```javascript
// Available in run_code context:
const document = sketch.getSelectedDocument();  // Current document
const page = document.selectedPage;             // Active page
const selection = document.selectedLayers;      // Selected layers
```

### Document Methods

```javascript
// Get all pages
const pages = document.pages;

// Get all symbols in document
const symbols = document.getSymbols();

// Find symbol by ID
const symbol = document.getSymbolMasterWithID(symbolId);

// Get libraries
const libraries = document.getLibraries();
```

### Page Methods

```javascript
// Get layers on page
const layers = page.layers;

// Find layers by type
const frames = page.layers.filter(l => l.type === 'Artboard');
const texts = page.layers.filter(l => l.type === 'Text');
const shapes = page.layers.filter(l => l.type === 'ShapePath');
```

## Creating Layers

### Artboard (Frame)

```javascript
const frame = new Artboard({
  name: '01-Issue-List',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page
});

// With background
frame.background = {
  enabled: true,
  color: '#FFFFFFFF',
  includedInExport: true
};
```

### Rectangle

```javascript
const rect = new Rectangle({
  name: 'Background',
  frame: { x: 0, y: 0, width: 200, height: 100 },
  parent: targetParent,
  style: {
    fills: [{ color: '#3B82F6FF' }],
    borders: [{ color: '#1D4ED8FF', thickness: 1 }]
  },
  cornerRadius: 8
});
```

### Text

```javascript
const text = new Text({
  text: 'Hello World',
  frame: { x: 20, y: 20, width: 200, height: 24 },
  parent: targetParent,
  style: {
    textColor: '#111827FF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: 500,
    alignment: 'left'
  }
});
```

### Group

```javascript
const group = new Group({
  name: 'CardGroup',
  layers: [rect, text],  // Child layers
  parent: targetParent
});
```

### Symbol Master

```javascript
// ⚠️ Do NOT use SymbolMaster.fromGroup() - it doesn't exist!

// Create Symbol Master directly
const symbolMaster = new SymbolMaster({
  name: 'Components/Button/Primary',
  frame: { x: -2000, y: 0, width: 120, height: 40 },
  parent: symbolsPage
});

// Add children to the master
const bg = new Rectangle({
  name: 'Background',
  frame: { x: 0, y: 0, width: 120, height: 40 },
  parent: symbolMaster,
  style: { fills: [{ color: '#3B82F6FF' }] },
  cornerRadius: 6
});
```

### Symbol Instance

```javascript
// Find the master
const master = document.getSymbols().find(s => s.name === 'Components/Button/Primary');

// Create instance
const instance = master.createNewInstance();
instance.frame = { x: 100, y: 100, width: 120, height: 40 };
instance.parent = targetFrame;
```

### HotSpot (Prototype Link)

```javascript
const hotspot = new HotSpot({
  name: 'Navigate to Detail',
  frame: { x: 0, y: 0, width: 300, height: 50 },
  parent: sourceFrame,
  flow: {
    targetId: targetFrame.id,
    animationType: 'slideFromRight'  // or 'instant', 'dissolve'
  }
});
```

## Layer Manipulation

### Position and Size

```javascript
// Get position
const x = layer.frame.x;
const y = layer.frame.y;
const width = layer.frame.width;
const height = layer.frame.height;

// Set position (modify frame object)
layer.frame = {
  x: 100,
  y: 200,
  width: layer.frame.width,
  height: layer.frame.height
};

// Or update individual properties
layer.frame.x = 100;
layer.frame.y = 200;
```

### Style Updates

```javascript
// Update fills (replace array)
layer.style.fills = [
  { color: '#FF0000FF' }
];

// Update borders
layer.style.borders = [
  { color: '#000000FF', thickness: 2, position: 'Inside' }
];

// Add shadow
layer.style.shadows = [{
  color: '#00000040',
  offsetX: 0,
  offsetY: 4,
  blurRadius: 8,
  spread: 0
}];
```

### Layer Order

```javascript
// Move to front/back
layer.moveToFront();
layer.moveToBack();

// Move relative to another layer
layer.moveAbove(otherLayer);
layer.moveBelow(otherLayer);
```

### Selection

```javascript
// Get current selection
const selected = document.selectedLayers.layers;

// Set selection
document.selectedLayers.layers = [layer1, layer2];

// Clear selection
document.selectedLayers.clear();
```

## Symbol Operations

### Create From Existing Layers

```javascript
// Select layers first, then:
const selectedLayers = document.selectedLayers.layers;

// Create symbol from selection (UI action simulation)
// Note: May not be directly available via API
// Alternative: Create SymbolMaster and copy properties
```

### Override Management

```javascript
// Get overrides on instance
const overrides = instance.overrides;

// Set text override
const textOverride = overrides.find(o => o.property === 'stringValue');
if (textOverride) {
  instance.setOverrideValue(textOverride, 'New Label');
}

// Set nested symbol override
const symbolOverride = overrides.find(o => o.property === 'symbolID');
if (symbolOverride) {
  instance.setOverrideValue(symbolOverride, newSymbolId);
}
```

### Detach Instance

```javascript
// Convert instance to regular group
instance.detach();
```

## Page Operations

### Create Page

```javascript
const newPage = new Page({
  name: 'New Page',
  parent: document
});
```

### Navigate Pages

```javascript
// Switch to page
document.selectedPage = targetPage;

// Find page by name
const page = document.pages.find(p => p.name === 'Wireframes');
```

## Iteration Patterns

### Process All Frames

```javascript
const frames = page.layers.filter(l => l.type === 'Artboard');

frames.forEach((frame, index) => {
  // Rename with index
  frame.name = `${String(index + 1).padStart(2, '0')}-${frame.name}`;
});

return `Processed ${frames.length} frames`;
```

### Find and Modify

```javascript
// Find all text layers with specific content
const findTextLayers = (parent, searchText) => {
  const results = [];

  const search = (layers) => {
    layers.forEach(layer => {
      if (layer.type === 'Text' && layer.text.includes(searchText)) {
        results.push(layer);
      }
      if (layer.layers) {
        search(layer.layers);
      }
    });
  };

  search(parent.layers || []);
  return results;
};

const matches = findTextLayers(page, 'TODO');
matches.forEach(text => {
  text.style.textColor = '#EF4444FF';  // Highlight in red
});
```

### Recursive Layer Search

```javascript
const findLayersByName = (root, name) => {
  const results = [];

  const traverse = (layers) => {
    for (const layer of layers) {
      if (layer.name === name) {
        results.push(layer);
      }
      if (layer.layers) {
        traverse(layer.layers);
      }
    }
  };

  traverse(root.layers || [root]);
  return results;
};
```

## Common Patterns

### Create Wireframe Structure

```javascript
// Standard wireframe frame setup
const createWireframe = (name, x, y) => {
  const frame = new Artboard({
    name: name,
    frame: { x: x, y: y, width: 1440, height: 900 },
    parent: page
  });

  // Add header
  new Rectangle({
    name: 'Header',
    frame: { x: 0, y: 0, width: 1440, height: 56 },
    parent: frame,
    style: { fills: [{ color: '#F9FAFBFF' }] }
  });

  // Add sidebar
  new Rectangle({
    name: 'Sidebar',
    frame: { x: 0, y: 56, width: 240, height: 844 },
    parent: frame,
    style: { fills: [{ color: '#F3F4F6FF' }] }
  });

  // Add content area
  new Rectangle({
    name: 'Content',
    frame: { x: 240, y: 56, width: 1200, height: 844 },
    parent: frame,
    style: { fills: [{ color: '#FFFFFFFF' }] }
  });

  return frame;
};
```

### Add Modal Overlay

```javascript
const addModalOverlay = (frame, modalWidth, modalHeight) => {
  // Dark overlay
  new Rectangle({
    name: 'Overlay',
    frame: { x: 0, y: 0, width: frame.frame.width, height: frame.frame.height },
    parent: frame,
    style: { fills: [{ color: '#111827E6' }] }  // 90% opacity
  });

  // Modal container
  const modal = new Rectangle({
    name: 'Modal',
    frame: {
      x: (frame.frame.width - modalWidth) / 2,
      y: (frame.frame.height - modalHeight) / 2,
      width: modalWidth,
      height: modalHeight
    },
    parent: frame,
    style: { fills: [{ color: '#FFFFFFFF' }] },
    cornerRadius: 12
  });

  return modal;
};
```

### Link All Frames

```javascript
// Create navigation hotspots between frames
const frames = page.layers.filter(l => l.type === 'Artboard');

frames.forEach(sourceFrame => {
  frames.forEach(targetFrame => {
    if (sourceFrame.id !== targetFrame.id) {
      // Create hotspot in nav area
      new HotSpot({
        name: `nav-to-${targetFrame.name}`,
        frame: { x: 0, y: 0, width: 100, height: 30 },
        parent: sourceFrame,
        flow: {
          targetId: targetFrame.id,
          animationType: 'instant'
        }
      });
    }
  });
});
```

## Error Handling

### Safe Property Access

```javascript
// Check before accessing
const color = layer.style?.fills?.[0]?.color || '#000000FF';

// Type checking
if (layer.type === 'Text') {
  layer.text = 'Updated text';
}
```

### Return Values

Always return meaningful data for verification:

```javascript
// Good - returns actionable info
return {
  framesCreated: newFrames.length,
  symbolsCreated: symbols.length,
  frameNames: newFrames.map(f => f.name)
};

// Bad - no feedback
// (nothing returned)
```

## Debugging

### Inspect Layer Structure

```javascript
const inspectLayer = (layer, depth = 0) => {
  const indent = '  '.repeat(depth);
  let output = `${indent}${layer.type}: ${layer.name}\n`;

  if (layer.layers) {
    layer.layers.forEach(child => {
      output += inspectLayer(child, depth + 1);
    });
  }

  return output;
};

return inspectLayer(page);
```

### Log to Return

```javascript
// Since console.log may not be visible, return debug info
const debug = [];

frames.forEach(frame => {
  debug.push(`Processing: ${frame.name}`);
  // ... operations
  debug.push(`  - Added ${count} layers`);
});

return debug.join('\n');
```

## Limitations

### Known Constraints

| Limitation | Workaround |
|------------|------------|
| `SymbolMaster.fromGroup()` doesn't exist | Create SymbolMaster directly with constructor |
| No direct library management | Use document.getSymbols() |
| Limited undo support | Make incremental changes |
| Async operations limited | Avoid complex promises |

### Best Practices

1. **Small operations**: Prefer multiple small scripts over one large one
2. **Return feedback**: Always return status information
3. **Check existence**: Verify layers exist before modification
4. **Use try-catch**: Wrap operations for error handling
5. **Preserve originals**: Clone before destructive changes

## Related References
- [Symbols & Components](./symbols.md)
- [Layouts & Frames](./layouts.md)
- [Prototyping](./prototyping.md)
