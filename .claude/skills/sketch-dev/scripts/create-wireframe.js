/**
 * Create Wireframe Frame
 *
 * Creates a standard wireframe frame with header, sidebar, and content area.
 * Follows established layout patterns for consistency.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  frame: { width: 1440, height: 900 },
  header: { height: 56 },
  sidebar: { width: 240 },
  spacing: { gap: 100 } // Gap between frames on canvas
};

const COLORS = {
  white: '#FFFFFFFF',
  gray50: '#F9FAFBFF',
  gray100: '#F3F4F6FF',
  gray200: '#E5E7EBFF',
  gray700: '#374151FF',
  gray900: '#111827FF',
  primary: '#3B82F6FF'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create the main wireframe frame (artboard)
 */
function createFrame(name, x, y, page) {
  const frame = new Artboard({
    name: name,
    frame: { x, y, width: CONFIG.frame.width, height: CONFIG.frame.height },
    parent: page
  });

  frame.background = {
    enabled: true,
    color: COLORS.white,
    includedInExport: true
  };

  return frame;
}

/**
 * Add header to frame
 */
function addHeader(parent) {
  // Header background
  const header = new Rectangle({
    name: 'Header',
    frame: { x: 0, y: 0, width: CONFIG.frame.width, height: CONFIG.header.height },
    parent: parent,
    style: {
      fills: [{ color: COLORS.gray50 }],
      borders: [{ color: COLORS.gray200, thickness: 1, position: 'Inside' }]
    }
  });

  // Logo placeholder
  new Text({
    text: 'Logo',
    frame: { x: 24, y: 18, width: 60, height: 20 },
    parent: parent,
    style: {
      textColor: COLORS.gray900,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: 600
    }
  });

  // Navigation items
  const navItems = ['Issues', 'Board', 'Dashboard'];
  navItems.forEach((item, i) => {
    new Text({
      text: item,
      frame: { x: 200 + i * 100, y: 18, width: 80, height: 20 },
      parent: parent,
      style: {
        textColor: COLORS.gray700,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 500
      }
    });
  });

  return header;
}

/**
 * Add sidebar to frame
 */
function addSidebar(parent) {
  const sidebarY = CONFIG.header.height;
  const sidebarHeight = CONFIG.frame.height - CONFIG.header.height;

  // Sidebar background
  const sidebar = new Rectangle({
    name: 'Sidebar',
    frame: { x: 0, y: sidebarY, width: CONFIG.sidebar.width, height: sidebarHeight },
    parent: parent,
    style: {
      fills: [{ color: COLORS.gray100 }],
      borders: [{ color: COLORS.gray200, thickness: 1, position: 'Inside' }]
    }
  });

  // Sidebar items
  const sidebarItems = ['All Issues', 'My Issues', 'Epics', 'Labels', 'Settings'];
  sidebarItems.forEach((item, i) => {
    new Text({
      text: item,
      frame: { x: 16, y: sidebarY + 16 + i * 40, width: 200, height: 24 },
      parent: parent,
      style: {
        textColor: COLORS.gray700,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 400
      }
    });
  });

  return sidebar;
}

/**
 * Add content area to frame
 */
function addContentArea(parent, contentTitle = 'Content') {
  const contentX = CONFIG.sidebar.width;
  const contentY = CONFIG.header.height;
  const contentWidth = CONFIG.frame.width - CONFIG.sidebar.width;
  const contentHeight = CONFIG.frame.height - CONFIG.header.height;

  // Content background
  const content = new Rectangle({
    name: 'Content',
    frame: { x: contentX, y: contentY, width: contentWidth, height: contentHeight },
    parent: parent,
    style: {
      fills: [{ color: COLORS.white }],
      borders: []
    }
  });

  // Content title
  new Text({
    text: contentTitle,
    frame: { x: contentX + 24, y: contentY + 24, width: 300, height: 32 },
    parent: parent,
    style: {
      textColor: COLORS.gray900,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 600
    }
  });

  return content;
}

/**
 * Add modal overlay and container
 */
function addModal(parent, title, width = 600, height = 400) {
  // Dark overlay
  new Rectangle({
    name: 'Overlay',
    frame: { x: 0, y: 0, width: CONFIG.frame.width, height: CONFIG.frame.height },
    parent: parent,
    style: { fills: [{ color: '#111827E6' }] }
  });

  // Modal container
  const modalX = (CONFIG.frame.width - width) / 2;
  const modalY = (CONFIG.frame.height - height) / 2;

  const modal = new Rectangle({
    name: 'Modal',
    frame: { x: modalX, y: modalY, width: width, height: height },
    parent: parent,
    style: {
      fills: [{ color: COLORS.white }],
      borders: []
    },
    cornerRadius: 12
  });

  // Modal title
  new Text({
    text: title,
    frame: { x: modalX + 24, y: modalY + 20, width: width - 80, height: 28 },
    parent: parent,
    style: {
      textColor: COLORS.gray900,
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: 600
    }
  });

  // Close button placeholder
  new Text({
    text: '×',
    frame: { x: modalX + width - 40, y: modalY + 16, width: 24, height: 24 },
    parent: parent,
    style: {
      textColor: COLORS.gray700,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 400
    }
  });

  return modal;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

// Get current document and page
const document = sketch.getSelectedDocument();
const page = document.selectedPage;

// Calculate position for new frame (to the right of existing frames)
const existingFrames = page.layers.filter(l => l.type === 'Artboard');
const maxX = existingFrames.length > 0
  ? Math.max(...existingFrames.map(f => f.frame.x + f.frame.width))
  : 0;
const newX = maxX > 0 ? maxX + CONFIG.spacing.gap : 0;

// Create the wireframe
const frameName = 'New-Wireframe';
const frame = createFrame(frameName, newX, 0, page);
addHeader(frame);
addSidebar(frame);
addContentArea(frame, 'Page Title');

// Return summary
return {
  created: frameName,
  position: { x: newX, y: 0 },
  size: { width: CONFIG.frame.width, height: CONFIG.frame.height },
  components: ['Header', 'Sidebar', 'Content']
};
