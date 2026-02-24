/**
 * Design Token Definitions for Sketch
 *
 * Centralized style constants for consistent wireframe design.
 * Import these tokens when creating Sketch elements programmatically.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

const COLORS = {
  // Base colors
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

  // Primary brand colors
  primary: {
    50: '#EFF6FFFF',
    100: '#DBEAFEFF',
    200: '#BFDBFEFF',
    300: '#93C5FDFF',
    400: '#60A5FAFF',
    500: '#3B82F6FF', // Primary default
    600: '#2563EBFF',
    700: '#1D4ED8FF',
    800: '#1E40AFFF',
    900: '#1E3A8AFF'
  },

  // Semantic colors
  semantic: {
    success: '#10B981FF',
    successLight: '#D1FAE5FF',
    warning: '#F59E0BFF',
    warningLight: '#FEF3C7FF',
    error: '#EF4444FF',
    errorLight: '#FEE2E2FF',
    info: '#3B82F6FF',
    infoLight: '#DBEAFEFF'
  },

  // Status colors
  status: {
    open: '#FFFFFFFF',
    openBg: '#F3F4F6FF',
    inProgress: '#3B82F6FF',
    inProgressBg: '#DBEAFEFF',
    review: '#8B5CF6FF',
    reviewBg: '#EDE9FEFF',
    done: '#10B981FF',
    doneBg: '#D1FAE5FF',
    closed: '#6B7280FF',
    closedBg: '#F3F4F6FF'
  },

  // Overlay colors
  overlay: {
    light: '#00000040', // 25% black
    medium: '#00000080', // 50% black
    dark: '#111827E6' // 90% dark gray
  }
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrains Mono'
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  },

  // Pre-defined text styles
  styles: {
    h1: { fontSize: 36, fontWeight: 700, lineHeight: 44 },
    h2: { fontSize: 30, fontWeight: 600, lineHeight: 38 },
    h3: { fontSize: 24, fontWeight: 600, lineHeight: 32 },
    h4: { fontSize: 20, fontWeight: 600, lineHeight: 28 },
    h5: { fontSize: 18, fontWeight: 600, lineHeight: 26 },
    body: { fontSize: 14, fontWeight: 400, lineHeight: 20 },
    bodyLarge: { fontSize: 16, fontWeight: 400, lineHeight: 24 },
    bodySmall: { fontSize: 12, fontWeight: 400, lineHeight: 16 },
    caption: { fontSize: 12, fontWeight: 400, lineHeight: 16 },
    label: { fontSize: 14, fontWeight: 500, lineHeight: 20 },
    labelSmall: { fontSize: 12, fontWeight: 500, lineHeight: 16 }
  }
};

// =============================================================================
// SPACING
// =============================================================================

const SPACING = {
  // Base spacing scale
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,

  // Semantic aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48
};

// =============================================================================
// BORDERS & RADIUS
// =============================================================================

const BORDERS = {
  width: {
    none: 0,
    thin: 1,
    medium: 2,
    thick: 4
  },

  radius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999
  }
};

// =============================================================================
// SHADOWS
// =============================================================================

const SHADOWS = {
  none: null,

  sm: {
    color: '#00000010',
    offsetX: 0,
    offsetY: 1,
    blurRadius: 2,
    spread: 0
  },

  md: {
    color: '#00000010',
    offsetX: 0,
    offsetY: 4,
    blurRadius: 6,
    spread: -1
  },

  lg: {
    color: '#00000010',
    offsetX: 0,
    offsetY: 10,
    blurRadius: 15,
    spread: -3
  },

  xl: {
    color: '#00000025',
    offsetX: 0,
    offsetY: 20,
    blurRadius: 25,
    spread: -5
  },

  modal: {
    color: '#00000040',
    offsetX: 0,
    offsetY: 25,
    blurRadius: 50,
    spread: -12
  }
};

// =============================================================================
// LAYOUT
// =============================================================================

const LAYOUT = {
  // Frame sizes
  frames: {
    desktop: { width: 1440, height: 900 },
    desktopLarge: { width: 1920, height: 1080 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 375, height: 812 }
  },

  // Common component heights
  heights: {
    header: 56,
    navItem: 40,
    button: 40,
    buttonSm: 32,
    buttonLg: 48,
    input: 40,
    inputSm: 32,
    tableRow: 48,
    cardHeader: 56
  },

  // Common widths
  widths: {
    sidebar: 240,
    sidebarCollapsed: 64,
    modal: 600,
    modalLarge: 800,
    modalSmall: 400,
    dropdown: 200
  },

  // Grid
  grid: {
    columns: 12,
    gutter: 24,
    margin: 72
  }
};

// =============================================================================
// COMPONENT STYLES (Pre-built style objects)
// =============================================================================

const COMPONENT_STYLES = {
  // Containers
  card: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.gray[200], thickness: 1, position: 'Inside' }],
    shadows: [SHADOWS.sm],
    cornerRadius: BORDERS.radius.lg
  },

  cardElevated: {
    fills: [{ color: COLORS.base.white }],
    borders: [],
    shadows: [SHADOWS.md],
    cornerRadius: BORDERS.radius.lg
  },

  modal: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.gray[200], thickness: 1, position: 'Inside' }],
    shadows: [SHADOWS.modal],
    cornerRadius: BORDERS.radius.xl
  },

  overlay: {
    fills: [{ color: COLORS.overlay.dark }]
  },

  // Inputs
  input: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.gray[300], thickness: 1, position: 'Inside' }],
    cornerRadius: BORDERS.radius.md
  },

  inputFocus: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.primary[500], thickness: 2, position: 'Inside' }],
    cornerRadius: BORDERS.radius.md
  },

  inputError: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.semantic.error, thickness: 1, position: 'Inside' }],
    cornerRadius: BORDERS.radius.md
  },

  // Buttons
  buttonPrimary: {
    fills: [{ color: COLORS.primary[500] }],
    borders: [],
    cornerRadius: BORDERS.radius.md
  },

  buttonSecondary: {
    fills: [{ color: COLORS.base.white }],
    borders: [{ color: COLORS.gray[300], thickness: 1, position: 'Inside' }],
    cornerRadius: BORDERS.radius.md
  },

  buttonGhost: {
    fills: [],
    borders: [],
    cornerRadius: BORDERS.radius.md
  },

  // Status badges
  badgeSuccess: {
    fills: [{ color: COLORS.semantic.successLight }],
    cornerRadius: BORDERS.radius.full
  },

  badgeWarning: {
    fills: [{ color: COLORS.semantic.warningLight }],
    cornerRadius: BORDERS.radius.full
  },

  badgeError: {
    fills: [{ color: COLORS.semantic.errorLight }],
    cornerRadius: BORDERS.radius.full
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

// Return tokens for use in Sketch MCP scripts
return {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDERS,
  SHADOWS,
  LAYOUT,
  COMPONENT_STYLES
};
