// Piece management functions

// Create game pieces
function initPieceStates() {
    gameState.pieceStates = pieceDefinitions.map((def, index) => {
        return {    
            id: index,                         // included for reference (used in placement checking)
            shape: JSON.parse(JSON.stringify(def.shape)),
            isOnGrid: false,            
            gridPlacementCoords: [null, null], // x and y coordinates for top-left cell
            rotation: 0,                       // rotation angle in degrees
            isFlippedH: false,                 // horizontal flip state
            isFlippedV: false                  // vertical flip state
        };
    });
}

// Preload piece assets to browser cache
function preloadPieceAssets() {
    if (!pieceDefinitions || pieceDefinitions.length === 0) {
        console.warn('Piece definitions not found or empty. Skipping asset preloading.');
        return;
    }

    console.log('Initiating piece asset preloading...');
    let loadedCount = 0;
    let failedCount = 0;

    pieceDefinitions.forEach(def => {
        if (def.image) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount + failedCount === pieceDefinitions.length) {
                    console.log(`Asset preloading complete. Loaded: ${loadedCount}, Failed: ${failedCount}`);
                }
            };
            img.onerror = () => {
                failedCount++;
                console.error(`Failed to preload asset: ${def.image}`);
                if (loadedCount + failedCount === pieceDefinitions.length) {
                    console.log(`Asset preloading complete. Loaded: ${loadedCount}, Failed: ${failedCount}`);
                }
            };
            img.src = def.image;
        } else {
            // Count as failed if no image property, or handle as appropriate
            failedCount++; 
            if (loadedCount + failedCount === pieceDefinitions.length) {
                 console.log(`Asset preloading complete. Loaded: ${loadedCount}, Failed: ${failedCount}`);
            }
        }
    });
    // If pieceDefinitions is empty or all items lack an image property, log completion immediately.
    if (pieceDefinitions.length === 0 || pieceDefinitions.every(def => !def.image)){
        console.log('Asset preloading complete (no assets to load).');
    }
}

// Check if placement is valid
function isValidPlacement(piece, gridPlacementCoords) {

    const shape = piece.shape;
    const [gridXPlacement, gridYPlacement] = gridPlacementCoords;

    // Check if all cells of the piece are within valid grid cells
    for (let cellY = 0; cellY < shape.length; cellY++) {
        for (let cellX = 0; cellX < shape[cellY].length; cellX++) {
            if (shape[cellY][cellX] === 1) {
                // Get cell's board position
                const boardY = gridYPlacement + cellY;
                const boardX = gridXPlacement + cellX;

                // Check if out of bounds
                if (boardY >= gameConstants.rowLengths.length || boardX >= gameConstants.rowLengths[boardY]) {
                    return false;
                }
                
                // Check if cell is a date block
                if (gameState.dateBlockPositions.some(block => 
                    block.row === boardY && block.col === boardX
                )) {
                    return false;
                }
                
                // Check if cell is already occupied by another piece
                if (gameState.boardState[boardY][boardX] !== null && 
                    gameState.boardState[boardY][boardX] !== piece.id) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Place a piece on the grid
function placePiece(piece, gridPlacementCoords, element) {
    // Update piece state
    piece.isOnGrid = true;
    piece.gridPlacementCoords = gridPlacementCoords;
    const [gridXPlacement, gridYPlacement] = gridPlacementCoords;

    // Move the element to the calendar grid container
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('calendarGrid element not found');
        return;
    }
    
    element.remove(); // Remove from current parent
    calendarGrid.appendChild(element); // Add to calendar grid

    // Position piece element relative to the calendar grid
    const boardCellSize = getResponsiveBoardCellSize();
    element.style.position = 'absolute';
    element.style.left = `${gridXPlacement * boardCellSize}px`;
    element.style.top = `${gridYPlacement * boardCellSize}px`;
    element.classList.add('on-grid');

    if (gameState.selectedPiece === piece.id) gameState.selectedPiece = null; // Deselect the piece
    
    // Update board state
    updateBoardState();
    
    // Redraw palette (in case piece was moved from palette to grid)
    drawPiecePalette();
    
    // Check win condition
    checkWinCondition();
}

// Rotate a piece 90 degrees clockwise
function rotatePieceCW(piece) {
    const oldShape = piece.shape;
    const height = oldShape.length;
    const width = Math.max(...oldShape.map(row => row.length));
    
    // Initialize new shape array
    const newShape = [];
    for (let i = 0; i < width; i++) {
        newShape.push(new Array(height).fill(0));
    }
    
    // Rotate the shape
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < oldShape[y].length; x++) {
            if (oldShape[y][x] === 1) {
                newShape[x][height - 1 - y] = 1;
            }
        }
    }
    
    // Update piece rotation state
    piece.rotation = piece.rotation + 90;
    piece.shape = newShape;
}

function rotatePieceCCW(piece) {
    const oldShape = piece.shape;
    const height = oldShape.length;
    const width = Math.max(...oldShape.map(row => row.length));
    
    // Initialize new shape array
    const newShape = [];
    for (let i = 0; i < width; i++) {
        newShape.push(new Array(height).fill(0));
    }
    
    // Rotate the shape counter-clockwise
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < oldShape[y].length; x++) {
            if (oldShape[y][x] === 1) {
                newShape[width - 1 - x][y] = 1;
            }
        }
    }
    
    // Update piece rotation state
    piece.rotation = piece.rotation - 90;
    piece.shape = newShape;
}

// Flip a piece horizontally
function flipPieceHorizontal(piece) {
    const oldShape = piece.shape;
    
    // Flip horizontally
    const newShape = [];
    for (const row of oldShape) {
        newShape.push([...row].toReversed());
    }
    
    // Update flip state
    if (piece.rotation % 180 === 0) {
        piece.isFlippedH = !piece.isFlippedH;
    } else {
        piece.isFlippedV = !piece.isFlippedV;
    }
    piece.shape = newShape;
}

// Flip a piece vertically
function flipPieceVertical(piece) {
    const oldShape = piece.shape;
    const newShape = [...oldShape].reverse();
    
    // Update flip state
    if (piece.rotation % 180 === 0) {
        piece.isFlippedV = !piece.isFlippedV;
    } else {
        piece.isFlippedH = !piece.isFlippedH;
    }
    piece.shape = newShape;
}

// Apply rotation or flip to the selected piece
function transformSelectedPiece(transformType) {
    const piece_id = gameState.selectedPiece;
    if (piece_id === null) {
        return;
    }
    const piece = gameState.pieceStates[piece_id];
    
    // Update the piece's shape
    switch (transformType) {
        case 'rotateCW':
            rotatePieceCW(piece);
            break;
        case 'rotateCCW':
            rotatePieceCCW(piece);
            break;
        case 'flipH':
            flipPieceHorizontal(piece);
            break;
        case 'flipV':
            flipPieceVertical(piece);
            break;
        default:
            console.warn('Unknown transform type:', transformType);
            return;
    }
    
    // Calculate the transform string for CSS
    let transformCss = `rotate(${piece.rotation}deg)`;
    transformCss += ` scaleX(${piece.isFlippedH ? -1 : 1})`;
    transformCss += ` scaleY(${piece.isFlippedV ? -1 : 1})`;

    // Update the visual transform of the piece's sprite in the palette
    const paletteSpriteSelector = `.palette-piece-container[data-piece-id="${piece.id}"] .piece-sprite`;
    const paletteSprite = document.querySelector(paletteSpriteSelector);

    if (paletteSprite) {
        paletteSprite.style.transform = transformCss + ' scale(0.5)';
    } else {
        // This might happen if the selected piece is not in the palette,
        // or if the palette hasn't been drawn yet for this piece.
        console.warn(`Palette sprite not found for piece ID ${piece.id} during transform.`);
    }

    // Redraw the selected piece in the pieceView.
    // This will update its grid structure based on the new shape,
    // and also update its sprite's transform based on current piece state.
    if (typeof updatePieceViewAfterTransform === 'function') {
        updatePieceViewAfterTransform(piece, transformType); // Pass transformType
    } else if (typeof drawSelectedPiece === 'function') {
        // Fallback if the new function isn't available for some reason
        console.warn('updatePieceViewAfterTransform not found, falling back to drawSelectedPiece.');
        drawSelectedPiece();
    } else {
        console.error('drawSelectedPiece function is not available. Piece view cannot be updated.');
    }
}

