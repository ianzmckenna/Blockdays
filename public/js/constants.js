// Game Constants
const GRID_SIZE = 7;
const BOARD_CELL_SIZE = 50; // Base cell size in pixels (for reference)
const PALETTE_CELL_SIZE = 25; // Base palette cell size (for reference)
const PIECE_COUNT = 8;

// Base dimensions for scaling calculations
const BASE_DIMENSIONS = {
    gameWidth: 492,  // Exact px game width (at 100% scale)
    gameHeight: 870, // Approximate px game height  
    boardSize: 400,  // Exact px board length
    boardCellSize: 50,
    paletteCellSize: 25
};

// Game State
const gameState = {
    pieces: [],
    selectedPiece: null,
    dateBlocks: [],
    validCells: [
        [1,1,1,1,1,1,0],
        [1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,0,0,0,0]
    ],
    cellContents: [
        ["JAN","FEB","MAR","APR","MAY","JUN",    0],
        ["JUL","AUG","SEP","OCT","NOV","DEC",    0],
        [  "1",  "2",  "3",  "4",  "5",  "6",  "7"],
        [  "8",  "9", "10", "11", "12", "13", "14"],
        [ "15", "16", "17", "18", "19", "20", "21"],
        [ "22", "23", "24", "25", "26", "27", "28"],
        [ "29", "30", "31",    0,    0,    0,    0]
    ],
    // cellContents: [
    //     ["Jan","Feb","Mar","Apr","May","Jun",    0],
    //     ["Jul","Aug","Sep","Oct","Nov","Dec",    0],
    //     [  "1",  "2",  "3",  "4",  "5",  "6",  "7"],
    //     [  "8",  "9", "10", "11", "12", "13", "14"],
    //     [ "15", "16", "17", "18", "19", "20", "21"],
    //     [ "22", "23", "24", "25", "26", "27", "28"],
    //     [ "29", "30", "31",    0,    0,    0,    0]
    // ],
    boardState: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null))
};

// Piece Definitions
const pieceDefinitions = [
    {
        name: 'Block',
        shape: [[1,1], 
                [1,1], 
                [1,1]],
        image: 'assets/Block.png'
    },
    {
        name: 'Cane',
        shape: [[1,1], 
                [1,0], 
                [1,0], 
                [1,0]],
        image: 'assets/Cane.png'
    },
    {
        name: 'U',
        shape: [[1,1], 
                [1,0], 
                [1,1]],
        image: 'assets/U.png'
    },
    {
        name: 'LLL',
        shape: [[1,0,0], 
                [1,0,0], 
                [1,1,1]],
        image: 'assets/LLL.png'
    },
    {
        name: 'Z',
        shape: [[1,1,0], 
                [0,1,0], 
                [0,1,1]],
        image: 'assets/Z.png'
    },
    {
        name: 'S',
        shape: [[0,1], 
                [1,1], 
                [1,0], 
                [1,0]],
        image: 'assets/S.png'
    },
    {
        name: 'Thumb',
        shape: [[1,0], 
                [1,1],
                [1,1]],
        image: 'assets/Thumb.png'
    },
    {
        name: 'T',
        shape: [[1,0], 
                [1,1], 
                [1,0], 
                [1,0]],
        image: 'assets/T.png'
    },
];
