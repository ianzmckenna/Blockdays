// UI management functions for palette, dragging, and piece display

// Draw the piece palette (carousel)
function drawPiecePalette() {

    const piecePalette = document.getElementById('piecePalette');
    if (!piecePalette) {
        console.error('piecePalette element not found');
        return;
    }
    const pieceView = document.getElementById('pieceView');
    if (!pieceView) {
        console.error('pieceView element not found');
        return;
    }
    
    piecePalette.innerHTML = '';
    pieceView.innerHTML = '';
    
    // Get available (not on grid) pieces
    const availablePieces = gameState.pieces.filter(p => !p.isOnGrid);
    
    // No pieces to show, hide the palette to hide the border
    if (availablePieces.length === 0) {
        piecePalette.style.display = 'none';
        return; // to avoid further processing
    }

    // Show the palette if there are pieces
    // It doesn't show the palette on load without this line, not sure why
    piecePalette.style.display = 'flex'; 
    
    // Position pieces in piecePalette and pieceView
    availablePieces.forEach((piece, index) => {

        const palettePieceContainer = createPalettePiece(piece);
        const gridPieceContainer = createGridPiece(piece);

        // Check if this piece is currently selected
        if (piece.id === gameState.selectedPiece || (gameState.selectedPiece === null && index === 0)) {
            palettePieceContainer.classList.add('active');
            gridPieceContainer.classList.remove('hidden');
            gameState.selectedPiece = piece.id;
        }

        piecePalette.appendChild(palettePieceContainer);
        pieceView.appendChild(gridPieceContainer);
    });

    makeSelectable(piecePalette);
}

function makeSelectable(palette) {

    let isMouseDown = false;

    // Handle mouse down on palette
    palette.addEventListener('mousedown', function(e) {
        e.preventDefault(); // Prevent default drag behavior
        isMouseDown = true;
        selectClosestPiece(e);
    });
    palette.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isMouseDown = true;
        selectClosestPiece(e.touches[0]);
    });

    // Handle mouse move while button is held down
    palette.addEventListener('mousemove', function(e) {
        if (isMouseDown) {
            e.preventDefault();
            selectClosestPiece(e);
        }
    });
    palette.addEventListener('touchmove', function(e) {
        if (isMouseDown) {
            e.preventDefault();
            selectClosestPiece(e.touches[0]);
        }
    });

    // Handle mouse up
    document.addEventListener('mouseup', function(e) {
        isMouseDown = false;
    });

    document.addEventListener('touchend', function(e) {
        isMouseDown = false;
    });

    // Function to find and select the closest piece to the cursor
    function selectClosestPiece(e) {
        const paletteRect = palette.getBoundingClientRect();
        const mouseX = e.clientX - paletteRect.left;
        const mouseY = e.clientY - paletteRect.top;

        let closestPiece = null;
        let closestDistance = Infinity;

        // Get all palette piece containers
        const pieceContainers = palette.querySelectorAll('.palette-piece-container');
        
        pieceContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const containerX = rect.left - paletteRect.left + rect.width / 2;
            const containerY = rect.top - paletteRect.top + rect.height / 2;
            
            // Calculate distance from mouse to center of piece
            const distance = Math.sqrt(
                Math.pow(mouseX - containerX, 2) + 
                Math.pow(mouseY - containerY, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPiece = container;
            }
        });

        // Select the closest piece
        if (closestPiece) {
            const pieceId = parseInt(closestPiece.dataset.pieceId);
            gameState.selectedPiece = pieceId;
    
            // Update the active state in the palette
            document.querySelectorAll('.palette-piece-container').forEach(container => {
                container.classList.remove('active');
                if (parseInt(container.dataset.pieceId) === pieceId) {
                    container.classList.add('active');
                }
            });
            
            // Update the active state in the pieceView
            const pieceView = document.getElementById('pieceView');
            pieceView.querySelectorAll('.board-piece-container').forEach(container => {
                container.classList.add('hidden');
                if (parseInt(container.dataset.pieceId) === pieceId) {
                    container.classList.remove('hidden');
                }
            });
        }
    }
}

// Create a palette piece container for displaying the piece in the palette
function createPalettePiece(piece) {

    const pieceContainer = document.createElement('div');
    pieceContainer.className = 'palette-piece-container';
    pieceContainer.dataset.pieceId = piece.id;

    // Calculate dimensions
    const shape = piece.shape;
    const width = Math.max(...shape.map(row => row.length));
    const height = shape.length;
    
    // Get responsive cell size
    const paletteCellSize = getResponsivePaletteCellSize();
    
    // Set container size
    pieceContainer.style.width = `${2 * paletteCellSize}px`;
    pieceContainer.style.height = `${2 * paletteCellSize}px`;
    
    // Create piece shape outline with transparent cells
    const pieceSprite = document.createElement('div');
    pieceSprite.className = 'piece-sprite';
    pieceSprite.style.backgroundImage = `url(${piece.image})`;

    pieceSprite.style.transform += `rotate(${piece.rotation}deg)`
    pieceSprite.style.transform += `scaleX(${piece.isFlippedH ? -1 : 1})` 
    pieceSprite.style.transform += `scaleY(${piece.isFlippedV ? -1 : 1})`
    pieceSprite.style.transform += `scale(0.5)`;

    if (piece.rotation % 180 === 0) {
        pieceSprite.style.width = `${width * paletteCellSize}px`;
        pieceSprite.style.height = `${height * paletteCellSize}px`;
    } else {
        pieceSprite.style.width = `${height * paletteCellSize}px`;
        pieceSprite.style.height = `${width * paletteCellSize}px`;
    }

    // Manual hover effects instead of :hover for touch compatibility
    pieceContainer.addEventListener('mouseover', function() {
        pieceContainer.classList.add('hover');
    });
    pieceContainer.addEventListener('mouseout', function() {
        pieceContainer.classList.remove('hover');
    });
    
    pieceContainer.appendChild(pieceSprite);

    return pieceContainer;
}

// Create a grid piece container for displaying the piece on the grid
function createGridPiece(piece) {

    // Calculate dimensions
    const shape = piece.shape;
    const height = shape.length;
    const width = Math.max(...shape.map(row => row.length));
    const boardCellSize = getResponsiveboardCellSize();

    // Set container size
    const pieceContainer = document.createElement('div');
    pieceContainer.className = 'board-piece-container hidden';
    pieceContainer.dataset.pieceId = piece.id;
    pieceContainer.style.width = `${width * boardCellSize}px`;
    pieceContainer.style.height = `${height * boardCellSize}px`;

    // Create piece sprite div
    const pieceSprite = document.createElement('div');
    pieceSprite.className = 'piece-sprite';
    if (piece.rotation % 180 === 0) {
        pieceSprite.style.width = `100%`;
        pieceSprite.style.height = `100%`;
    } else {
        pieceSprite.style.width = `${height * boardCellSize}px`;
        pieceSprite.style.height = `${width * boardCellSize}px`;
    }
    pieceSprite.style.backgroundImage = `url(${piece.image})`;

    pieceSprite.style.transform += ` rotate(${piece.rotation}deg)`;
    pieceSprite.style.transform += ` scaleX(${piece.isFlippedH ? -1 : 1})`;
    pieceSprite.style.transform += ` scaleY(${piece.isFlippedV ? -1 : 1})`;

    // Create piece grid to show shape
    const pieceGrid = document.createElement('div');
    pieceGrid.className = 'piece-grid';
    pieceGrid.style.width = `${width * boardCellSize}px`;
    pieceGrid.style.height = `${height * boardCellSize}px`;
    
    // Create cell outlines to show shape (transparent)
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] === 1) {
                const cell = document.createElement('div');
                cell.className = 'piece-cell';
                cell.style.width = `${boardCellSize}px`;
                cell.style.height = `${boardCellSize}px`;
                cell.style.left = `${x * boardCellSize}px`;
                cell.style.top = `${y * boardCellSize}px`;
                
                pieceGrid.appendChild(cell);
            }
        }
    }

    // Add cell-specific listeners for highlighting effects
    pieceGrid.querySelectorAll('.piece-cell').forEach((cell) => {
        cell.addEventListener('mouseenter', function(e) {
            if (!document.querySelector('.dragging')) {
                pieceSprite.classList.add('highlight');
            }
        });
        cell.addEventListener('touchstart', function(e) {
            pieceSprite.classList.add('highlight');
        });
        cell.addEventListener('mouseleave', function(e) {
            if (!pieceContainer.classList.contains('dragging')) {
                pieceSprite.classList.remove('highlight');
            }
        });
        cell.addEventListener('touchend', function(e) {
            pieceSprite.classList.remove('highlight');
        });
    });

    pieceContainer.appendChild(pieceSprite);
    pieceContainer.appendChild(pieceGrid);

    makeDraggable(pieceContainer);

    return pieceContainer;
}

// Make an element draggable
function makeDraggable(element) {

    let initialX, initialY;
    let offsetX, offsetY;
    let isDragging = false;

    element.querySelectorAll(".piece-cell").forEach((cell) => {
        cell.addEventListener('mousedown', startDrag);
        cell.addEventListener('touchstart', startDragTouch);
    });
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        
        // Calculate the offset from the mouse position to the top-left of the element
        const rect = element.getBoundingClientRect();

        // Store the initial position of the element
        initialX = rect.left;
        initialY = rect.top;

        offsetX = e.clientX - initialX;
        offsetY = e.clientY - initialY;

        element.classList.add('dragging');
        
        // Add event listeners for drag and end events
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }
    
    function startDragTouch(e) {
        e.preventDefault();
        isDragging = true;
        
        // Calculate the offset from the touch position to the top-left of the element
        const rect = element.getBoundingClientRect();
        const touch = e.touches[0];
        
        // Store the initial position of the element
        initialX = rect.left;
        initialY = rect.top;
        
        // Calculate the offset from the touch position to the top-left of the element
        offsetX = touch.clientX - initialX;
        offsetY = touch.clientY - initialY;
        
        element.classList.add('dragging');
        
        // Add event listeners for drag and end events
        document.addEventListener('touchmove', dragTouch);
        document.addEventListener('touchend', endDrag);
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            // Calculate new position based on mouse movement
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            
            // Update element position using transform for performance
            element.style.transform = `translate(${newX - initialX}px, ${newY - initialY}px)`;
        }
    }
    
    function dragTouch(e) {
        if (isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            
            // Calculate new position based on touch movement
            const newX = touch.clientX - offsetX;
            const newY = touch.clientY - offsetY;
            
            // Update element position using transform for performance
            element.style.transform = `translate(${newX - initialX}px, ${newY - initialY}px)`;
        }
    }
    
    function endDrag(e) {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');

            // Get the final mouse/touch position
            const finalEvent = e.changedTouches ? e.changedTouches[0] : e;
            const finalX = finalEvent.clientX - offsetX;
            const finalY = finalEvent.clientY - offsetY;

            // Reset transform before calculating final position
            element.style.transform = '';
            
            // Explicitly remove highlight from the piece's sprite
            // const pieceSprite = element.querySelector('.piece-sprite');
            // if (pieceSprite) {
            //     pieceSprite.classList.remove('highlight');
            // }
            
            // Get piece id
            const pieceId = parseInt(element.dataset.pieceId);
            const piece = gameState.pieces[pieceId];

            // Get current position and convert to grid coordinates
            const puzzleGrid = document.getElementById('puzzleGrid');
            if (!puzzleGrid) {
                console.error('puzzleGrid element not found');
                return;
            }        
                
            const gridRect = puzzleGrid.getBoundingClientRect();
            const boardCellSize = getResponsiveboardCellSize();
            const gridX = Math.round((finalX - gridRect.left) / boardCellSize);
            const gridY = Math.round((finalY - gridRect.top) / boardCellSize);
            
            // Check if placement is valid
            if (isValidPlacement(piece, gridX, gridY)) {
                // Place the piece
                placePiece(piece, gridX, gridY, element);
            } else {
                // If not valid, return to palette
                element.remove();
                piece.isOnGrid = false;
                piece.gridPosition = null;
                gameState.selectedPiece = piece.id;
                updateBoardState();
                drawPiecePalette();
            }
        }
    }
}

// New function to update only the necessary parts of the piece in pieceView after a transform
function updatePieceViewAfterTransform(piece, transformType) { // Added transformType parameter
    const pieceViewContainerSelector = `#pieceView .board-piece-container[data-piece-id="${piece.id}"]`;
    const pieceViewContainer = document.querySelector(pieceViewContainerSelector);

    if (!pieceViewContainer) {
        console.warn(`Piece container not found in pieceView for ID ${piece.id}. Falling back to full drawSelectedPiece.`);
        drawSelectedPiece(); // Fallback to full redraw if container not found
        return;
    }

    const pieceSprite = pieceViewContainer.querySelector('.piece-sprite');
    const oldPieceGrid = pieceViewContainer.querySelector('.piece-grid');

    if (!pieceSprite) {
        console.error(`Piece sprite not found in existing container for piece ID ${piece.id}. Falling back to full drawSelectedPiece.`);
        drawSelectedPiece(); // Fallback
        return;
    }

    // 1. Calculate and apply CSS transform to the sprite
    let transformCss = `rotate(${piece.rotation}deg)`;
    transformCss += ` scaleX(${piece.isFlippedH ? -1 : 1})`;
    transformCss += ` scaleY(${piece.isFlippedV ? -1 : 1})`;
    pieceSprite.style.transform = transformCss;

    // 2. Update container and sprite dimensions based on the new shape
    const shape = piece.shape;
    const height = shape.length;
    const width = Math.max(...shape.map(row => row.length || 0)); // Ensure width is calculated correctly
    const boardCellSize = getResponsiveboardCellSize();

    pieceViewContainer.style.width = `${width * boardCellSize}px`;
    pieceViewContainer.style.height = `${height * boardCellSize}px`;

    // Adjust sprite dimensions for correct image display after rotation
    if (piece.rotation % 180 === 0) {
        pieceSprite.style.width = '100%';
        pieceSprite.style.height = '100%';
    } else { // Rotated 90 or 270 degrees
        pieceSprite.style.width = `${height * boardCellSize}px`; // Uses container's logical height
        pieceSprite.style.height = `${width * boardCellSize}px`;  // Uses container's logical width
    }
    // pieceSprite.style.backgroundImage = \`url(${piece.image})\`; // Image URL doesn't change

    // 3. Remove old piece-grid
    if (oldPieceGrid) {
        oldPieceGrid.remove();
    }

    // 4. Create and append new piece-grid
    const newPieceGrid = document.createElement('div');
    newPieceGrid.className = 'piece-grid';
    newPieceGrid.style.width = `${width * boardCellSize}px`;
    newPieceGrid.style.height = `${height * boardCellSize}px`;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < (shape[r]?.length || 0); c++) {
            if (shape[r][c] === 1) {
                const cell = document.createElement('div');
                cell.className = 'piece-cell';
                cell.style.width = `${boardCellSize}px`;
                cell.style.height = `${boardCellSize}px`;
                cell.style.left = `${c * boardCellSize}px`;
                cell.style.top = `${r * boardCellSize}px`;
                newPieceGrid.appendChild(cell);
            }
        }
    }

    // 5. Add cell-specific listeners for highlighting effects (referencing the existing sprite)
    newPieceGrid.querySelectorAll('.piece-cell').forEach((cell) => {
        cell.addEventListener('mouseenter', function(e) {
            if (!document.querySelector('.dragging')) {
                pieceSprite.classList.add('highlight');
            }
        });
        cell.addEventListener('touchstart', function(e) {
            pieceSprite.classList.add('highlight');
        });
        cell.addEventListener('mouseleave', function(e) {
            if (!pieceViewContainer.classList.contains('dragging')) {
                pieceSprite.classList.remove('highlight');
            }
        });
        cell.addEventListener('touchend', function(e) {
            pieceSprite.classList.remove('highlight');
        });
    });

    pieceViewContainer.appendChild(newPieceGrid);

    // 6. Re-initialize draggable behavior for the new cells within the container
    // This ensures the new cells are draggable.
    makeDraggable(pieceViewContainer);
}

