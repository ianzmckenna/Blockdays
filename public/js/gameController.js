// Main game controller and initialization

// DOM Elements (declared but initialized in initGame for proper timing)
let dateText, puzzleGrid, pieceView, piecePalette;
let winMessage, resetButton;
let rotateCWButton, rotateCCWButton, flipHButton, flipVButton;

// Initialize the game
function initGame() {
    try {
        // Initialize responsive sizing first
        initResponsiveManager();
        
        // Initialize DOM elements with error checking
        dateText = document.getElementById('dateText');
        puzzleGrid = document.getElementById('puzzleGrid');
        pieceView = document.getElementById('pieceView');
        piecePalette = document.getElementById('piecePalette');
        winMessage = document.getElementById('winMessage');
        resetButton = document.getElementById('resetButton');
        rotateCWButton = document.getElementById('rotateCWButton');
        rotateCCWButton = document.getElementById('rotateCCWButton');
        flipHButton = document.getElementById('flipHButton');
        flipVButton = document.getElementById('flipVButton');

        // Check if critical elements exist
        if (!puzzleGrid || !pieceView || !piecePalette) {
            console.error('Critical DOM elements not found');
            return;
        }

        // Set up current date
        setupCurrentDate();

        // Create pieces
        createPieces();
        
        // Preload piece assets
        preloadPieceAssets();
        
        // Draw the puzzle grid
        drawGrid();
        
        // Draw the piece palette
        drawPiecePalette();
        
        // Set up event listeners on buttons
        setupButtonEventListeners();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

// Set up event listeners
function setupButtonEventListeners() {
    try {
        if (resetButton) {
            resetButton.addEventListener('click', resetGame);
        }

        const buttons = [resetButton, rotateCWButton, rotateCCWButton, flipHButton, flipVButton];

        buttons.forEach(button => {
            if (button) {
                button.addEventListener('touchstart', () => button.classList.add('active'), { passive: true });
                button.addEventListener('touchend', () => button.classList.remove('active'));
                button.addEventListener('touchcancel', () => button.classList.remove('active'));
            }
        });
        
        if (rotateCWButton) {
            rotateCWButton.addEventListener('click', () => transformSelectedPiece('rotateCW'));
        }
        
        if (rotateCCWButton) {
            rotateCCWButton.addEventListener('click', () => transformSelectedPiece('rotateCCW'));
        }
        
        if (flipHButton) {
            flipHButton.addEventListener('click', () => transformSelectedPiece('flipH'));
        }
        
        if (flipVButton) {
            flipVButton.addEventListener('click', () => transformSelectedPiece('flipV'));
        }
        
    } catch (error) {
        console.error('Error setting up button event listeners:', error);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {

    // Initialize Modal Functionality
    function initializeModal() {
        const modal = document.getElementById('infoModal');
        const infoIcon = document.getElementById('infoIcon');
        const closeModalButton = document.getElementById('closeModalButton');

        if (infoIcon) {
            infoIcon.addEventListener('click', () => {
                if (modal) modal.classList.remove('hidden');
            });
            infoIcon.addEventListener('touchstart', (event) => {
                event.preventDefault(); // Prevent double-tap zoom
                if (modal) modal.classList.remove('hidden');
            });
        }

        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                if (modal) modal.classList.add('hidden');
            });
            closeModalButton.addEventListener('touchstart', (event) => {
                event.preventDefault(); // Prevent double-tap zoom
                if (modal) modal.classList.add('hidden');
            });
        }

        // Close modal if user clicks outside of the modal content
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                if (modal) modal.classList.add('hidden');
            }
        });
        window.addEventListener('touchstart', (event) => {
            if (event.target === modal) {
                event.preventDefault(); // Prevent double-tap zoom
                if (modal) modal.classList.add('hidden');
            }
        });
    }

    // Call modal initialization when the DOM is ready
    initializeModal();

    // Add a small delay to ensure all elements are properly loaded
    setTimeout(initGame, 50);

    // Prevent double-tap to zoom
    document.addEventListener('dblclick', function(event) {
        event.preventDefault();
    }, { passive: false });
});
