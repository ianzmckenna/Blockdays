// Game Constants

// Base dimensions for scaling calculations
const BASE_DIMENSIONS = {
    gameWidth: 492,     // Exact px game width (at 100% scale)
    gameHeight: 870,    // Approximate px game height  
    boardSize: 400,     // Exact px board length
    boardCellSize: 50,  // Exact px board cell size
    paletteCellSize: 25 // Exact px palette cell size
};

const gameConstants = {
    pieceCount: 8,
    rowLengths: [6, 6, 7, 7, 7, 7, 3],
    cellContents: [
        ["JAN","FEB","MAR","APR","MAY","JUN"],
        ["JUL","AUG","SEP","OCT","NOV","DEC"],
        [  "1",  "2",  "3",  "4",  "5",  "6",  "7"],
        [  "8",  "9", "10", "11", "12", "13", "14"],
        [ "15", "16", "17", "18", "19", "20", "21"],
        [ "22", "23", "24", "25", "26", "27", "28"],
        [ "29", "30", "31"]
    ],
}

// Game State
const gameState = {
    pieceStates: [],
    selectedPiece: null,
    dateBlockPositions: [],
    boardState: gameConstants.rowLengths.map(len => Array(len).fill(null))
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
