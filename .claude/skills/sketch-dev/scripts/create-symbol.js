/**
 * Create Symbol Master
 *
 * Creates reusable Symbol Masters for component library.
 * Symbols are placed at x: -2000 to keep them separate from wireframes.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const SYMBOL_AREA = {
  x: -2000, // Left of main canvas
  labelWidth: 300,
  spacing: 100 // Vertical spacing between symbols
};

const COLORS = {
  white: '#FFFFFFFF',
  gray100: '#F3F4F6FF',
  gray200: '#E5E7EBFF',
  gray300: '#D1D5DBFF',
  gray500: '#6B7280FF',
  gray700: '#374151FF',
  gray900: '#111827FF',
  primary: '#3B82F6FF',
  primaryText: '#FFFFFFFF'
};

// =============================================================================
// SYMBOL CREATION FUNCTIONS
// =============================================================================

/**
 * Create a Button symbol
 */
function createButtonSymbol(page, name, variant, yOffset) {
  const width = 120;
  const height = 40;

  const master = new SymbolMaster({
    name: `Components/Buttons/${name}`,
    frame: { x: SYMBOL_AREA.x, y: yOffset, width, height },
    parent: page
  });

  // Background based on variant
  let bgColor, textColor, borderColor;
  switch (variant) {
    case 'primary':
      bgColor = COLORS.primary;
      textColor = COLORS.primaryText;
      borderColor = null;
      break;
    case 'secondary':
      bgColor = COLORS.white;
      textColor = COLORS.gray700;
      borderColor = COLORS.gray300;
      break;
    case 'ghost':
      bgColor = null;
      textColor = COLORS.primary;
      borderColor = null;
      break;
    default:
      bgColor = COLORS.primary;
      textColor = COLORS.primaryText;
  }

  // Background
  if (bgColor) {
    new Rectangle({
      name: 'Background',
      frame: { x: 0, y: 0, width, height },
      parent: master,
      style: {
        fills: [{ color: bgColor }],
        borders: borderColor ? [{ color: borderColor, thickness: 1 }] : []
      },
      cornerRadius: 6
    });
  }

  // Label
  new Text({
    text: 'Button',
    frame: { x: 0, y: 12, width, height: 16 },
    parent: master,
    style: {
      textColor: textColor,
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 500,
      alignment: 'center'
    }
  });

  return master;
}

/**
 * Create an Input field symbol
 */
function createInputSymbol(page, yOffset) {
  const width = 280;
  const height = 40;

  const master = new SymbolMaster({
    name: 'Components/Forms/Input',
    frame: { x: SYMBOL_AREA.x, y: yOffset, width, height },
    parent: page
  });

  // Background
  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width, height },
    parent: master,
    style: {
      fills: [{ color: COLORS.white }],
      borders: [{ color: COLORS.gray300, thickness: 1, position: 'Inside' }]
    },
    cornerRadius: 6
  });

  // Placeholder text
  new Text({
    text: 'Placeholder',
    frame: { x: 12, y: 12, width: width - 24, height: 16 },
    parent: master,
    style: {
      textColor: COLORS.gray500,
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 400
    }
  });

  return master;
}

/**
 * Create a NavBar symbol
 */
function createNavBarSymbol(page, yOffset) {
  const width = 1440;
  const height = 56;

  const master = new SymbolMaster({
    name: 'Components/Navigation/NavBar',
    frame: { x: SYMBOL_AREA.x, y: yOffset, width, height },
    parent: page
  });

  // Background
  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width, height },
    parent: master,
    style: {
      fills: [{ color: COLORS.gray100 }],
      borders: [{ color: COLORS.gray200, thickness: 1, position: 'Inside' }]
    }
  });

  // Logo
  new Text({
    text: 'Logo',
    frame: { x: 24, y: 18, width: 60, height: 20 },
    parent: master,
    style: {
      textColor: COLORS.gray900,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: 600
    }
  });

  // Nav items
  ['Issues', 'Board', 'Dashboard'].forEach((item, i) => {
    new Text({
      text: item,
      frame: { x: 200 + i * 100, y: 18, width: 80, height: 20 },
      parent: master,
      style: {
        textColor: COLORS.gray700,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 500
      }
    });
  });

  return master;
}

/**
 * Create a Card symbol
 */
function createCardSymbol(page, yOffset) {
  const width = 320;
  const height = 180;

  const master = new SymbolMaster({
    name: 'Components/Cards/Card',
    frame: { x: SYMBOL_AREA.x, y: yOffset, width, height },
    parent: page
  });

  // Background
  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width, height },
    parent: master,
    style: {
      fills: [{ color: COLORS.white }],
      borders: [{ color: COLORS.gray200, thickness: 1, position: 'Inside' }]
    },
    cornerRadius: 8
  });

  // Title
  new Text({
    text: 'Card Title',
    frame: { x: 16, y: 16, width: width - 32, height: 24 },
    parent: master,
    style: {
      textColor: COLORS.gray900,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: 600
    }
  });

  // Description
  new Text({
    text: 'Card description text goes here.',
    frame: { x: 16, y: 48, width: width - 32, height: 40 },
    parent: master,
    style: {
      textColor: COLORS.gray500,
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 400
    }
  });

  return master;
}

/**
 * Create a Badge symbol
 */
function createBadgeSymbol(page, name, bgColor, textColor, yOffset) {
  const width = 80;
  const height = 24;

  const master = new SymbolMaster({
    name: `Components/Badges/${name}`,
    frame: { x: SYMBOL_AREA.x, y: yOffset, width, height },
    parent: page
  });

  // Background
  new Rectangle({
    name: 'Background',
    frame: { x: 0, y: 0, width, height },
    parent: master,
    style: {
      fills: [{ color: bgColor }],
      borders: []
    },
    cornerRadius: 12
  });

  // Label
  new Text({
    text: 'Label',
    frame: { x: 0, y: 5, width, height: 14 },
    parent: master,
    style: {
      textColor: textColor,
      fontSize: 12,
      fontFamily: 'Inter',
      fontWeight: 500,
      alignment: 'center'
    }
  });

  return master;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const document = sketch.getSelectedDocument();
const page = document.selectedPage;

// Find existing symbols to avoid overlap
const existingSymbols = page.layers.filter(
  l => l.type === 'SymbolMaster' && l.frame.x < 0
);
const maxY = existingSymbols.length > 0
  ? Math.max(...existingSymbols.map(s => s.frame.y + s.frame.height))
  : 0;

let yOffset = maxY > 0 ? maxY + SYMBOL_AREA.spacing : 0;

// Add section label
new Text({
  text: '═══ NEW COMPONENTS ═══',
  frame: { x: SYMBOL_AREA.x, y: yOffset, width: SYMBOL_AREA.labelWidth, height: 24 },
  parent: page,
  style: {
    textColor: COLORS.gray500,
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: 600
  }
});
yOffset += 40;

// Create symbols
const created = [];

// Buttons
created.push(createButtonSymbol(page, 'Primary', 'primary', yOffset));
yOffset += 60;
created.push(createButtonSymbol(page, 'Secondary', 'secondary', yOffset));
yOffset += 60;
created.push(createButtonSymbol(page, 'Ghost', 'ghost', yOffset));
yOffset += 80;

// Forms
created.push(createInputSymbol(page, yOffset));
yOffset += 80;

// Navigation
created.push(createNavBarSymbol(page, yOffset));
yOffset += 80;

// Cards
created.push(createCardSymbol(page, yOffset));
yOffset += 200;

// Badges
created.push(createBadgeSymbol(page, 'Default', COLORS.gray100, COLORS.gray700, yOffset));
yOffset += 40;
created.push(createBadgeSymbol(page, 'Primary', '#DBEAFEFF', '#1D4ED8FF', yOffset));
yOffset += 40;
created.push(createBadgeSymbol(page, 'Success', '#D1FAE5FF', '#047857FF', yOffset));

// Return summary
return {
  symbolsCreated: created.length,
  names: created.map(s => s.name),
  location: { x: SYMBOL_AREA.x, startY: maxY > 0 ? maxY + SYMBOL_AREA.spacing : 0 }
};
