// Responsive sizing management

let currentScale = 1;


// Calculate the optimal scale based on window size
function calculateOptimalScale() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    console.log(`Window size: ${windowWidth}x${windowHeight}`);
    
    // Account for padding and margins
    const availableWidth = windowWidth - 40; // 20px padding on each side
    const availableHeight = windowHeight - 40; // 20px padding top/bottom
    
    // Calculate scale based on width and height constraints
    const widthScale = availableWidth / BASE_DIMENSIONS.gameWidth;
    const heightScale = availableHeight / BASE_DIMENSIONS.gameHeight;
    
    // Use the smaller scale to ensure game fits in both dimensions
    const optimalScale = Math.min(widthScale, heightScale);
    console.log(optimalScale);
    // Clamp the scale between reasonable limits
    return Math.max(0.2, Math.min(2.0, optimalScale));
}

// Apply the calculated scale to the game
function applyResponsiveScale() {
    const newScale = calculateOptimalScale();
      // Only update if scale has changed significantly
    if (Math.abs(newScale - currentScale) > 0.001) {
        currentScale = newScale;
        
        console.log(`Applying responsive scale: ${currentScale}`);
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--game-scale', currentScale);
        document.documentElement.style.setProperty('--grid-cell-size', `${BASE_DIMENSIONS.boardCellSize * currentScale}px`);
        document.documentElement.style.setProperty('--palette-cell-size', `${BASE_DIMENSIONS.paletteCellSize * currentScale}px`);
        document.documentElement.style.setProperty('--board-size', `${BASE_DIMENSIONS.boardSize * currentScale}px`);
        
        // Update JavaScript constants for drag and positioning calculations
        window.RESPONSIVE_BOARD_CELL_SIZE = BASE_DIMENSIONS.boardCellSize * currentScale;
        window.RESPONSIVE_PALETTE_CELL_SIZE = BASE_DIMENSIONS.paletteCellSize * currentScale;
        
        // Redraw UI elements with new scale
        if (typeof drawGrid === 'function') {
            drawGrid();
        }
        if (typeof drawPiecePalette === 'function') {
            drawPiecePalette();
        }
    }
}

// Initialize responsive sizing
function initResponsiveManager() {
    // Set initial scale
    applyResponsiveScale();
    
    // Add resize event listener with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyResponsiveScale, 150);
    });

    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(applyResponsiveScale, 300);
    });
}

// Get current responsive cell size for calculations
function getResponsiveboardCellSize() {
    return window.RESPONSIVE_BOARD_CELL_SIZE || BASE_DIMENSIONS.boardCellSize;
}

function getResponsivePaletteCellSize() {
    return window.RESPONSIVE_PALETTE_CELL_SIZE || BASE_DIMENSIONS.paletteCellSize;
}
