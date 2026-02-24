/**
 * Add Prototype Links
 *
 * Creates interactive prototype links between frames.
 * Supports navigation, modals, and back actions.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const LINK_CONFIG = {
  navBar: {
    y: 16,
    height: 24,
    itemWidth: 80,
    startX: 200,
    spacing: 100
  },
  animations: {
    nav: 'instant', // Tab/navigation switches
    forward: 'slideFromRight', // Drill-down navigation
    back: 'slideFromLeft', // Return navigation
    modal: 'dissolve' // Modal opens
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find frame by name pattern
 */
function findFrame(frames, pattern) {
  return frames.find(f =>
    f.name.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Create a hotspot link
 */
function createHotspot(name, sourceFrame, targetFrame, rect, animation) {
  return new HotSpot({
    name: name,
    frame: rect,
    parent: sourceFrame,
    flow: {
      targetId: targetFrame.id,
      animationType: animation
    }
  });
}

/**
 * Add navigation bar links to a frame
 */
function addNavLinks(sourceFrame, allFrames, navItems) {
  const links = [];

  navItems.forEach((item, index) => {
    const targetFrame = findFrame(allFrames, item.target);
    if (targetFrame && targetFrame.id !== sourceFrame.id) {
      const hotspot = createHotspot(
        `nav-${item.name.toLowerCase()}`,
        sourceFrame,
        targetFrame,
        {
          x: LINK_CONFIG.navBar.startX + index * LINK_CONFIG.navBar.spacing,
          y: LINK_CONFIG.navBar.y,
          width: LINK_CONFIG.navBar.itemWidth,
          height: LINK_CONFIG.navBar.height
        },
        LINK_CONFIG.animations.nav
      );
      links.push(hotspot);
    }
  });

  return links;
}

/**
 * Add a drill-down link (forward navigation)
 */
function addDrillDownLink(sourceFrame, targetFrame, rect, name) {
  return createHotspot(
    name || `link-to-${targetFrame.name}`,
    sourceFrame,
    targetFrame,
    rect,
    LINK_CONFIG.animations.forward
  );
}

/**
 * Add a back link (return navigation)
 */
function addBackLink(sourceFrame, targetFrame, rect, name) {
  return createHotspot(
    name || `back-to-${targetFrame.name}`,
    sourceFrame,
    targetFrame,
    rect,
    LINK_CONFIG.animations.back
  );
}

/**
 * Add modal open link
 */
function addModalLink(sourceFrame, modalFrame, rect, name) {
  return createHotspot(
    name || `open-${modalFrame.name}`,
    sourceFrame,
    modalFrame,
    rect,
    LINK_CONFIG.animations.modal
  );
}

// =============================================================================
// COMMON LINKING PATTERNS
// =============================================================================

/**
 * Link all frames with consistent navigation
 */
function linkAllFramesWithNav(frames, navItems) {
  const links = [];

  frames.forEach(frame => {
    // Skip modal frames (they don't need nav)
    if (frame.name.toLowerCase().includes('modal')) {
      return;
    }

    const frameLinks = addNavLinks(frame, frames, navItems);
    links.push(...frameLinks);
  });

  return links;
}

/**
 * Create bi-directional links between list and detail
 */
function linkListToDetail(listFrame, detailFrame, listItemRect, backButtonRect) {
  const links = [];

  // List item → Detail
  links.push(addDrillDownLink(
    listFrame,
    detailFrame,
    listItemRect,
    'view-detail'
  ));

  // Detail back button → List
  links.push(addBackLink(
    detailFrame,
    listFrame,
    backButtonRect,
    'back-to-list'
  ));

  return links;
}

/**
 * Create modal open/close links
 */
function linkModal(triggerFrame, modalFrame, openButtonRect, closeButtonRect) {
  const links = [];

  // Open button → Modal
  links.push(addModalLink(
    triggerFrame,
    modalFrame,
    openButtonRect,
    'open-modal'
  ));

  // Close button → Back to trigger
  links.push(addBackLink(
    modalFrame,
    triggerFrame,
    closeButtonRect,
    'close-modal'
  ));

  return links;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const document = sketch.getSelectedDocument();
const page = document.selectedPage;

// Get all frames
const frames = page.layers.filter(l => l.type === 'Artboard');

if (frames.length < 2) {
  return { error: 'Need at least 2 frames to create links' };
}

// Define navigation items (customize based on your frames)
const navItems = [
  { name: 'Issues', target: 'list' },
  { name: 'Board', target: 'board' },
  { name: 'Dashboard', target: 'dashboard' }
];

// Add navigation to all main frames
const navLinks = linkAllFramesWithNav(frames, navItems);

// Find common frame pairs for additional linking
const listFrame = findFrame(frames, 'list');
const detailModal = findFrame(frames, 'detail');
const createModal = findFrame(frames, 'create');

const additionalLinks = [];

// Link list to detail modal
if (listFrame && detailModal) {
  additionalLinks.push(...linkModal(
    listFrame,
    detailModal,
    { x: 260, y: 150, width: 1160, height: 50 }, // List item area
    { x: 550, y: 260, width: 32, height: 32 } // Close button
  ));
}

// Link create button to create modal
if (listFrame && createModal) {
  additionalLinks.push(...linkModal(
    listFrame,
    createModal,
    { x: 1300, y: 70, width: 120, height: 40 }, // Create button
    { x: 550, y: 260, width: 32, height: 32 } // Close button
  ));
}

// Return summary
return {
  framesProcessed: frames.length,
  frameNames: frames.map(f => f.name),
  navLinksCreated: navLinks.length,
  additionalLinksCreated: additionalLinks.length,
  totalLinks: navLinks.length + additionalLinks.length
};
