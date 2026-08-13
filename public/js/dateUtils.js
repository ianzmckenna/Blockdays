// Date utility functions

// Month abbreviations for date display
const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

function padDatePart(value) {
    return String(value).padStart(2, '0');
}

function getLocalTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
}

function getDateKeyForParts(year, monthIndex, day) {
    return `${year}-${padDatePart(monthIndex + 1)}-${padDatePart(day)}`;
}

function getDateKeyForDate(date) {
    return getDateKeyForParts(date.getFullYear(), date.getMonth(), date.getDate());
}

function getLocalDateKey(date = new Date()) {
    return getDateKeyForDate(date);
}

function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

function getLocalPuzzleDate(date = new Date()) {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const day = date.getDate();

    return {
        year,
        monthIndex,
        month: monthIndex + 1,
        day,
        dateKey: getDateKeyForParts(year, monthIndex, day),
        timezone: getLocalTimezone()
    };
}

// Set up the current date and find date blocks
function initCurrentDate() {

    const currentDate = getLocalPuzzleDate();
    const month_id = currentDate.monthIndex; // 0-11 for Jan-Dec
    const day = currentDate.day; // 1-31 for the day of the month

    // For testing with a specific date:
    // const month_id = 8;
    // const day = 28;

    gameState.currentDate = currentDate;
    
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

    // for collision and css
    gameState.dateBlockPositions = [{row: monthRow, col: monthCol}, {row: dayRow, col: dayCol}];
}
