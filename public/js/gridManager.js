// Grid management functions

// Draw the game grid
function drawGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('calendarGrid element not found');
        return;
    }

    calendarGrid.innerHTML = '';

    for (let row = 0; row < gameConstants.rowLengths.length; row++) {
        for (let col = 0; col < gameConstants.rowLengths[row]; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            // we +1 because CSS Grid is 1-based
            cell.style.gridRow = row + 1;
            cell.style.gridColumn = col + 1;

            // Add the text content for the cell
            cell.textContent = gameConstants.cellContents[row][col];

            // Check if this cell is a date block
            if (gameState.dateBlockPositions.some(block =>
                block.row === row && block.col === col)) {
                cell.classList.add('blocked');
            }
            calendarGrid.appendChild(cell);
        }
    }

    // draw pieces on the grid based on placement state
    gameState.pieceStates.forEach(piece => {
        if (piece.isOnGrid && piece.gridPlacementCoords) {

            const gridPieceContainer = createGridPiece(piece);
            gridPieceContainer.classList.remove('hidden');
            placePiece(piece, piece.gridPlacementCoords, gridPieceContainer);
        }
    });
}

// Update the board state based on piece placements
function updateBoardState() {
    // Reset board state
    gameState.boardState = gameConstants.rowLengths.map(len => Array(len).fill(null));

    // Update with placed pieces
    gameState.pieceStates.forEach(piece => {
        if (piece.isOnGrid && piece.gridPlacementCoords) {
            const [gridPlacementX, gridPlacementY] = piece.gridPlacementCoords;
            const shape = piece.shape;
            
            // Loop through cells and update board state
            for (let cellY = 0; cellY < shape.length; cellY++) {
                for (let cellX = 0; cellX < shape[cellY].length; cellX++) {
                    if (shape[cellY][cellX] === 1) {

                        // get cell's board position
                        const boardY = gridPlacementY + cellY;
                        const boardX = gridPlacementX + cellX;

                        // update board state
                        gameState.boardState[boardY][boardX] = piece.id;
                    }
                }
            }
        }
    });
}


// Check if the puzzle is solved
function checkWinCondition() {
    // Count how many pieces are on the grid
    const piecesOnGrid = gameState.pieceStates.filter(p => p.isOnGrid).length;
    
    // Count valid grid cells minus 2 date blocks
    const validCellCount = gameConstants.rowLengths.reduce((sum, length) => sum + length, 0) - 2;
    
    // Count cells covered by pieces
    let coveredCellCount = 0;
    for (let row = 0; row < gameConstants.rowLengths.length; row++) {
        for (let col = 0; col < gameConstants.rowLengths[row]; col++) {
            if (gameState.boardState[row][col] !== null) {
                coveredCellCount++;
            }
        }
    }
    
    // Check if all pieces are on the grid, all valid cells are covered except date blocks
    if (piecesOnGrid === gameConstants.pieceCount && coveredCellCount === validCellCount) {

        const pieces = document.querySelectorAll('.on-grid');

        pieces.forEach(piece => {
            const pieceSprite = piece.querySelector('.piece-sprite');
            if (pieceSprite?.classList.contains('highlight')) {
                pieceSprite.classList.remove('highlight');
            }
            
            const pieceCells = piece.querySelectorAll('.piece-cell');
            pieceCells.forEach(cell => {
                cell.style.cursor = 'default';
            });
            piece.outerHTML = piece.outerHTML; // Remove event listeners
        })

        const winMessage = document.getElementById('winMessage');
        if (winMessage) {
            winMessage.classList.remove('hidden');
        }
    }
}

// Reset the game
function resetGame() {
    // Reset pieces to original state
    gameState.pieceStates.forEach(piece => {
        piece.shape = JSON.parse(JSON.stringify(pieceDefinitions[piece.id].shape));
        piece.isOnGrid = false;
        piece.gridPlacementCoords = [null, null];
        piece.rotation = 0;
        piece.isFlippedH = false;
        piece.isFlippedV = false;
    });
    
    // Reset board state
    gameState.boardState = gameConstants.rowLengths.map(len => Array(len).fill(null));
    
    // Clear grid pieces
    const gridPieces = document.querySelectorAll('.on-grid');
    gridPieces.forEach(element => element.remove());
    
    // Hide win message
    const winMessage = document.getElementById('winMessage');
    if (winMessage) {
        winMessage.classList.add('hidden');
    }
    
    // Redraw the palette
    drawPiecePalette();
}
