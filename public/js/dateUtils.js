// Date utility functions

// Month abbreviations for date display
// const months = [
//     "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
//     "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
// ];

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

// Set up the current date and find date blocks
function setupCurrentDate() {

    const date = new Date();
    const month_id = date.getMonth(); // 0-11 for Jan-Dec
    const day = date.getDate(); // 1-31 for the day of the month
    // const month_id = 8;
    // const day = 28;
    
    // Display current date
    const dateText = document.getElementById('dateText');
    if (dateText) {
        dateText.textContent = `${months[month_id]} ${day}`;
    }
    
    // Get month cell coords (0-indexed month in first 2 rows)
    let monthRow = Math.floor(month_id / 6);
    let monthCol = month_id % 6;
    
    // Get day cell coords (1-indexed day in rows 3-7)
    let dayRow = Math.floor((day - 1) / 7) + 2;
    let dayCol = ((day - 1) % 7);

    gameState.dateBlocks = [{row: monthRow, col: monthCol}, {row: dayRow, col: dayCol}];
}
