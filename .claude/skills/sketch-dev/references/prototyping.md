# Sketch Prototyping Reference

> Interactive links, animations, and user flow prototypes.

## Core Concepts

### Prototype Flow
A connected sequence of frames showing user navigation paths.

### Hotspot
An invisible interactive area that triggers navigation.

### Link
Connection between a hotspot and target frame.

### Starting Point
The first frame in a prototype flow (marked with play icon).

## Creating Hotspots

### Via MCP API

```javascript
// Create a HotSpot for clickable area
const hotspot = new HotSpot({
  name: 'Navigate to Detail',
  frame: { x: 100, y: 200, width: 300, height: 50 },
  parent: sourceFrame,
  flow: {
    targetId: targetFrame.id,
    animationType: 'slideFromRight'
  }
});
```

### Hotspot Properties

| Property | Type | Description |
|----------|------|-------------|
| `frame` | object | Position and size of clickable area |
| `flow` | object | Link configuration |
| `flow.targetId` | string | Destination frame ID |
| `flow.animationType` | string | Transition animation |

## Animation Types

### Transition Options

| Animation | Value | Description |
|-----------|-------|-------------|
| **Instant** | `'instant'` | No animation, immediate switch |
| **Dissolve** | `'dissolve'` | Crossfade between frames |
| **Slide Left** | `'slideFromLeft'` | New frame slides in from left |
| **Slide Right** | `'slideFromRight'` | New frame slides in from right |
| **Slide Up** | `'slideFromBottom'` | New frame slides in from bottom |
| **Slide Down** | `'slideFromTop'` | New frame slides in from top |
| **Smart Animate** | `'smartAnimate'` | Animates matching layers |

### Smart Animate

Automatically animates layers with matching names between frames:

```
Source Frame:                Target Frame:
┌─────────────────┐          ┌─────────────────┐
│  ┌─────┐        │          │        ┌─────┐  │
│  │Card │ ←──────┼──────────┼───────→│Card │  │
│  └─────┘        │          │        └─────┘  │
│                 │          │                 │
└─────────────────┘          └─────────────────┘

Layers named "Card" will animate position, size, opacity
```

**Smart Animate Requirements:**
- Layers must have identical names
- Works with position, size, rotation, opacity
- Can interpolate between different property values

## Triggers

### Click/Tap
Default trigger - activates on click/tap.

### Mouse Events (Desktop)
- **On Click**: Standard click action
- **On Hover**: Trigger on mouse enter
- **On Mouse Leave**: Trigger on mouse exit

### Scroll Position
Trigger when scrolling to a specific position.

## Overlays

Display frames as floating layers over current view.

### Creating Overlays

```javascript
const hotspot = new HotSpot({
  name: 'Open Modal',
  frame: { x: 100, y: 100, width: 120, height: 40 },
  parent: sourceFrame,
  flow: {
    targetId: modalFrame.id,
    animationType: 'dissolve',
    type: 'overlay',
    overlaySettings: {
      position: 'center',
      backgroundDismiss: true,
      backgroundColor: '#00000080'
    }
  }
});
```

### Overlay Settings

| Setting | Description |
|---------|-------------|
| `position` | Where overlay appears (center, top, bottom, etc.) |
| `backgroundDismiss` | Close by clicking outside |
| `backgroundColor` | Scrim/backdrop color |

### Closing Overlays

Link back to previous frame or use "Close Overlay" action:

```javascript
// Close overlay hotspot (within the overlay frame)
const closeButton = new HotSpot({
  name: 'Close Modal',
  frame: { x: 540, y: 20, width: 40, height: 40 },
  parent: modalFrame,
  flow: {
    action: 'closeOverlay'  // Special action
  }
});
```

## Flow Organization

### Starting Points

Mark frames as prototype entry points:

```javascript
frame.flow = {
  isStartPoint: true
};
```

### Naming Flows

Organize multiple flows:
- `Flow 1: Onboarding`
- `Flow 2: Issue Creation`
- `Flow 3: Settings`

## Common Patterns

### Navigation Bar Links

```javascript
const navItems = [
  { name: 'Issues', target: '01-Issue-List-View' },
  { name: 'Board', target: '02-Kanban-Board' },
  { name: 'Dashboard', target: '09-Dashboard-View' }
];

navItems.forEach((item, i) => {
  const targetFrame = frames.find(f => f.name === item.target);

  new HotSpot({
    name: `Nav: ${item.name}`,
    frame: { x: 200 + (i * 120), y: 16, width: 100, height: 24 },
    parent: sourceFrame,
    flow: {
      targetId: targetFrame.id,
      animationType: 'instant'
    }
  });
});
```

### Modal Dialog Flow

```javascript
// 1. Open button → Modal (overlay)
new HotSpot({
  name: 'Open Create Modal',
  frame: { x: 1300, y: 16, width: 120, height: 40 },
  parent: listView,
  flow: {
    targetId: createModal.id,
    type: 'overlay',
    animationType: 'dissolve'
  }
});

// 2. Close button → Back (close overlay)
new HotSpot({
  name: 'Close Modal',
  frame: { x: 550, y: 20, width: 32, height: 32 },
  parent: createModal,
  flow: { action: 'closeOverlay' }
});

// 3. Submit button → Success view (replace)
new HotSpot({
  name: 'Submit',
  frame: { x: 450, y: 340, width: 100, height: 40 },
  parent: createModal,
  flow: {
    targetId: successView.id,
    animationType: 'slideFromRight'
  }
});
```

### Dropdown Menu

```javascript
// Trigger button → Dropdown (overlay, anchored)
new HotSpot({
  name: 'Open Dropdown',
  frame: { x: 100, y: 50, width: 120, height: 32 },
  parent: mainView,
  flow: {
    targetId: dropdownFrame.id,
    type: 'overlay',
    overlaySettings: {
      position: 'manual',  // Position at hotspot
      offsetX: 0,
      offsetY: 36,  // Below trigger
      backgroundDismiss: true
    }
  }
});
```

### Tab Navigation

```javascript
const tabs = [
  { name: 'Open', frameId: openTabFrame.id },
  { name: 'Closed', frameId: closedTabFrame.id },
  { name: 'All', frameId: allTabFrame.id }
];

tabs.forEach((tab, i) => {
  new HotSpot({
    name: `Tab: ${tab.name}`,
    frame: { x: 20 + (i * 80), y: 100, width: 70, height: 32 },
    parent: containerFrame,
    flow: {
      targetId: tab.frameId,
      animationType: 'instant'  // Tabs switch instantly
    }
  });
});
```

## Prototype Preview

### In Sketch
- Press `Cmd+P` or click Play button
- Click hotspots to navigate
- Press `Escape` to exit

### Sharing
- Share via Sketch Cloud
- Export as HTML (with Anima plugin)
- Record with screen capture

## Debugging Prototypes

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Link not working | Hotspot below other layers | Move hotspot to front |
| Wrong animation | Incorrect `animationType` | Check animation value |
| Overlay not closing | Missing close hotspot | Add close action |
| Smart Animate jerky | Mismatched layer names | Verify layer names match |

### Visualizing Links

View → Canvas → Show Prototyping Links (Cmd+Shift+P)

```
Shows blue connection lines:
┌─────────┐         ┌─────────┐
│ Frame A │───────→ │ Frame B │
└─────────┘         └─────────┘
    │                    │
    └───────→┌─────────┐←┘
             │ Frame C │
             └─────────┘
```

## Mobile Prototyping

### Fixed Elements

For headers/footers that stay visible during scroll:

```javascript
// Mark layer as fixed position
navBar.isFixedToViewport = true;
```

### Scrollable Content

Enable vertical scrolling within frames:

```javascript
frame.hasScrolling = true;
frame.scrollDirection = 'vertical';
```

## Best Practices

### Do
- Create a clear starting point
- Use consistent animations for similar actions
- Add close/back actions for overlays
- Test flows in preview mode
- Name hotspots descriptively

### Don't
- Over-animate (keep it simple)
- Create dead-ends without navigation
- Use different animations for same action type
- Forget mobile touch target sizes (min 44px)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `W` | Create link from selection |
| `Cmd+P` | Preview prototype |
| `Escape` | Exit preview |
| `Cmd+Shift+P` | Toggle link visibility |

## Related References
- [Layouts & Frames](./layouts.md)
- [Symbols & Components](./symbols.md)
- [Workflow & Organization](./workflow.md)
