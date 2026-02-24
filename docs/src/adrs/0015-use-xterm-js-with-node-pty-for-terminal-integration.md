---
number: 15
title: Use xterm.js with node-pty for Terminal Integration
status: proposed
date: 2026-02-24
tags:
  - terminal
  - ui
  - infrastructure
deciders:
  - aRustyDev
---

# Use xterm.js with node-pty for Terminal Integration

## Context and Problem Statement

The Unified Beads WebUI needs an embedded terminal for agent session management. Users need to view real-time output from Claude Code sessions, send input, and manage multiple concurrent sessions. We need both a frontend terminal emulator and a backend PTY (pseudo-terminal) solution.

## Decision Drivers

* **Real terminal experience**: Full ANSI escape sequence support, colors, cursor movement
* **Performance**: Handle high-volume output without UI lag
* **Cross-platform**: Work on macOS, Linux, and Windows
* **Accessibility**: Keyboard navigation, screen reader support
* **Extensibility**: Search, link detection, copy/paste
* **Native feel**: Match behavior of native terminal applications

## Considered Options

### Frontend Terminal Emulator

* **xterm.js** - Feature-rich terminal emulator used by VS Code
* **hterm** - Google's terminal emulator (used in Chrome OS)
* **Custom canvas** - Build from scratch with canvas API

### Backend PTY

* **node-pty** - Native PTY bindings for Node.js
* **child_process** - Node.js spawn without PTY
* **WebSocket proxy** - Remote PTY via WebSocket

## Decision Outcome

Chosen option: **xterm.js + node-pty**, because they provide the most complete terminal experience with excellent performance and ecosystem support.

### Consequences

* Good, because xterm.js is battle-tested (powers VS Code terminal)
* Good, because rich addon ecosystem (fit, search, web-links, unicode11)
* Good, because native PTY provides true terminal semantics (job control, signals)
* Good, because excellent ANSI escape sequence support
* Good, because WebGL renderer available for high-performance scenarios
* Neutral, because node-pty requires native compilation (handled by postinstall)
* Bad, because node-pty adds native dependency complexity
* Bad, because fallback mode loses interactive features when PTY unavailable

### Confirmation

* Terminal renders Claude Code output correctly with colors and formatting
* Input is delivered to sessions with proper key handling
* Performance metrics: < 50ms output latency, < 100ms for 1000 lines

## Pros and Cons of the Options

### xterm.js (Frontend)

The terminal emulator that powers VS Code's integrated terminal.

* Good, because used by VS Code, Hyper, and many production applications
* Good, because supports all ANSI escape sequences
* Good, because addon architecture (fit, search, web-links, serialize)
* Good, because WebGL renderer for high-performance rendering
* Good, because excellent accessibility (screen reader support)
* Good, because active maintenance and community
* Neutral, because ~200KB bundle size (acceptable for this use case)
* Bad, because complex API surface for advanced customization

### hterm (Frontend)

Google's terminal emulator used in Chrome OS and Secure Shell.

* Good, because mature and well-tested
* Good, because supports ANSI sequences
* Neutral, because less active community than xterm.js
* Bad, because fewer addons/extensions available
* Bad, because less documentation
* Bad, because primarily designed for Chrome OS use case

### Custom Canvas (Frontend)

Build terminal rendering from scratch using canvas API.

* Good, because full control over rendering
* Good, because minimal dependencies
* Bad, because enormous development effort
* Bad, because need to implement all escape sequences
* Bad, because accessibility would require significant work
* Bad, because maintenance burden

### node-pty (Backend)

Native PTY bindings for Node.js, maintained by Microsoft.

* Good, because true PTY semantics (SIGWINCH, job control, etc.)
* Good, because cross-platform (Windows ConPTY, Unix PTY)
* Good, because maintained by Microsoft (VS Code team)
* Good, because proper shell integration (login shells, .bashrc)
* Neutral, because requires native compilation
* Bad, because adds native dependency complexity
* Bad, because rebuild needed for Electron/Node version changes

### child_process (Backend)

Node.js built-in spawn without PTY.

* Good, because no native dependencies
* Good, because simpler setup
* Bad, because no PTY features (no colors in some programs)
* Bad, because no window resize signals
* Bad, because no job control (Ctrl+Z, fg, bg)
* Bad, because programs detect non-TTY and behave differently

## Fallback Strategy

When node-pty is unavailable (compilation failure, unsupported platform):

1. Fall back to `child_process.spawn` for output capture
2. Disable interactive input (display-only mode)
3. Show warning banner in terminal UI
4. Log output to file for later review

```typescript
async function createTerminalBackend(): Promise<PTYBackend | FallbackBackend> {
  try {
    const pty = await import('node-pty');
    return { type: 'pty', module: pty };
  } catch (e) {
    console.warn('node-pty not available, using fallback mode');
    return { type: 'fallback' };
  }
}
```

## Addons Used

| Addon | Purpose |
|-------|---------|
| `xterm-addon-fit` | Auto-resize terminal to container |
| `xterm-addon-search` | Search within terminal output |
| `xterm-addon-web-links` | Clickable URLs in output |
| `xterm-addon-unicode11` | Full Unicode 11 support |
| `xterm-addon-serialize` | Save/restore terminal state |

## More Information

### Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Output latency | < 50ms | 100ms |
| Render 1000 lines | < 100ms | 200ms |
| Memory per session | < 50MB | 100MB |

### References

* [Terminal Integration Spec](../../.claude/plans/unified-beads-webui/spec/terminal.md)
* [xterm.js Documentation](https://xtermjs.org/docs/)
* [node-pty Repository](https://github.com/microsoft/node-pty)
* [VS Code Terminal Implementation](https://github.com/microsoft/vscode)
