# Sketch Plugins

## Installed Plugins

| Plugin | Version | Purpose | Shortcut |
|--------|---------|---------|----------|
| **Iconify** | 2.0.7 | Access 100K+ icons from 100+ icon sets | `Ctrl+Shift+I` |
| **Puzzle Tokens** | latest | Apply design tokens (LESS/SCSS) to layers | Plugins menu |
| **DarkModeSystem** | 1.0.0 | Generate dark mode variants | Plugins menu |

## Installation

Plugins are installed to: `~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/`

To reinstall, download and run:
```bash
# Iconify
curl -L -o iconify.zip "https://github.com/iconify/iconify-sketch/releases/download/2.0.7/iconify.sketchplugin.zip"
unzip iconify.zip && open iconify.sketchplugin

# Puzzle Tokens (requires Node.js, less, sass)
curl -L -o puzzle.zip "https://github.com/ingrammicro/puzzle-tokens/raw/master/PuzzleTokens.sketchplugin.zip"
unzip puzzle.zip && open PuzzleTokens.sketchplugin

# DarkModeSystem
curl -L -o darkmode.zip "https://github.com/BDiogo/DarkMode-System/releases/download/v1.0.0/darkmodesystem.sketchplugin.zip"
unzip darkmode.zip && open darkmodesystem.sketchplugin
```

## Puzzle Tokens Prerequisites

Requires Node.js and LESS/SASS compilers:
```bash
npm install -g less sass
```

## Chart Plugin (Paid)

The Chart plugin is not free ($20/year). Install from: https://chartplugin.com/

Supports: Pie, Line, Bar, Candlestick, Donut, Area, Scatter, Heatmap, and more.

## Usage Notes

### Iconify
1. Press `Ctrl+Shift+I` or use Plugins → Iconify
2. Search for icons (e.g., "chart", "gantt", "calendar")
3. Click Import to add as vector shape

### Puzzle Tokens
1. Create a LESS/SCSS file with your design tokens
2. Run Plugins → Puzzle Tokens → Apply Design Tokens
3. Select your token file
4. Tokens are applied to matching layer styles

### DarkModeSystem
1. Select layers or artboards
2. Run Plugins → DarkModeSystem
3. Generates dark mode version with inverted colors
