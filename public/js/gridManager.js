// Grid management functions

// Draw the game grid
function drawGrid() {
    const puzzleGrid = document.getElementById('puzzleGrid');
    if (!puzzleGrid) {
        console.error('puzzleGrid element not found');
        return;
    }

    puzzleGrid.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            if (gameState.validCells[row][col] === 1) {
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add the text content for the cell
                cell.textContent = gameState.cellContents[row][col];
                
                // Check if this cell is a date block
                const isDateBlock = gameState.dateBlocks.some(block => 
                    block.row === row && block.col === col
                );
                
                if (isDateBlock) {
                    cell.classList.add('blocked');
                }
            }
            else if (gameState.validCells[row][col] === 0) {
                cell.className = 'grid-cell invalid';
                cell.dataset.row = row;
                cell.dataset.col = col;
            }
            puzzleGrid.appendChild(cell);
        }
    }

    gameState.pieces.forEach(piece => {
        if (piece.isOnGrid && piece.gridPosition) {
            
            const { x, y } = piece.gridPosition;
            const gridPieceContainer = createGridPiece(piece);
            gridPieceContainer.classList.remove('hidden');
            placePiece(piece, x, y, gridPieceContainer);
        }
    });
}

// Update the board state based on piece placements
function updateBoardState() {
    // Reset board state
    gameState.boardState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    
    // Update with placed pieces
    gameState.pieces.forEach(piece => {
        if (piece.isOnGrid && piece.gridPosition) {
            const { x, y } = piece.gridPosition;
            const shape = piece.shape;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        const boardY = y + row;
                        const boardX = x + col;
                        
                        if (boardY >= 0 && boardY < GRID_SIZE && boardX >= 0 && boardX < GRID_SIZE) {
                            gameState.boardState[boardY][boardX] = piece.id;
                        }
                    }
                }
            }
        }
    });
}


// Check if the puzzle is solved
function checkWinCondition() {
    // Count how many pieces are on the grid
    const piecesOnGrid = gameState.pieces.filter(p => p.isOnGrid).length;
    
    // Count valid grid cells minus date blocks
    const validCellCount = gameState.validCells.flat().filter(cell => cell === 1).length - 2;
    
    // Count cells covered by pieces
    let coveredCellCount = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (gameState.boardState[row][col] !== null) {
                coveredCellCount++;
            }
        }
    }
    
    // Check if all pieces are on the grid, all valid cells are covered except date blocks
    if (piecesOnGrid === PIECE_COUNT && coveredCellCount === validCellCount) {

        const pieces = document.querySelectorAll('.on-grid');

        pieces.forEach(piece => {
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
    gameState.pieces.forEach(piece => {
        piece.isOnGrid = false;
        piece.gridPosition = null;
        piece.rotation = 0;
        piece.isFlippedH = false;
        piece.isFlippedV = false;
        piece.shape = JSON.parse(JSON.stringify(piece.originalShape));
    });
    
    // Reset board state
    gameState.boardState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    
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
