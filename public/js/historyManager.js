// Profile modal and monthly solve history.

const historyState = {
    visibleMonthIndex: null,
    resultsByDate: {},
    resultsByPuzzleDay: {},
    isLoading: false,
    isAnimatingMonth: false
};

function initHistoryManager() {
    const currentDate = gameState.currentDate || getLocalPuzzleDate();
    historyState.visibleMonthIndex = currentDate.monthIndex;

    bindHistoryEvents();

    if (typeof onBlockdaysAuthChanged === 'function') {
        onBlockdaysAuthChanged(() => {
            renderProfileAuthState();
            if (firebaseState.user) {
                refreshHistoryAfterSave();
            } else {
                historyState.resultsByDate = {};
                historyState.resultsByPuzzleDay = {};
                renderHistory();
            }
        });
    }

    renderProfileAuthState();
    renderHistory();
}

function bindHistoryEvents() {
    const profileModal = document.getElementById('profileModal');
    const userIcon = document.getElementById('userIcon');
    const closeButton = document.getElementById('closeProfileModalButton');
    const signInButton = document.getElementById('googleSignInButton');
    const winSignInButton = document.getElementById('winSignInButton');
    const signOutButton = document.getElementById('signOutButton');
    const prevButton = document.getElementById('historyPrevMonthButton');
    const nextButton = document.getElementById('historyNextMonthButton');

    if (userIcon) {
        userIcon.addEventListener('click', openProfileModal);
        userIcon.addEventListener('touchstart', (event) => {
            event.preventDefault();
            openProfileModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeProfileModal);
        closeButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            closeProfileModal();
        });
    }

    if (profileModal) {
        profileModal.addEventListener('click', (event) => {
            if (event.target === profileModal) closeProfileModal();
        });
        profileModal.addEventListener('touchstart', (event) => {
            if (event.target === profileModal) {
                event.preventDefault();
                closeProfileModal();
            }
        });
    }

    [signInButton, winSignInButton].forEach(button => {
        if (!button) return;

        button.addEventListener('click', handleGoogleSignIn);
    });

    if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
            await signOutOfBlockdays();
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => changeHistoryMonth(-1));
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => changeHistoryMonth(1));
    }
}

function openProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.remove('hidden');
    }

    renderProfileAuthState();
    refreshHistoryAfterSave();
}

function closeProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.add('hidden');
    }
}

async function handleGoogleSignIn() {
    setHistoryMessage('');

    const winMessage = document.getElementById('winMessage');
    const winMessageVisible = winMessage && !winMessage.classList.contains('hidden');
    if (winMessageVisible) {
        setWinSaveStatus('Opening Google sign-in...', false);
    }

    try {
        await signInWithGoogle();
    } catch (error) {
        console.error('Google sign-in failed:', error);
        const message = getAuthErrorMessage(error);
        setHistoryMessage(message);
        if (winMessageVisible) {
            setWinSaveStatus(message, firebaseState.isConfigured);
        }
    }
}

function renderProfileAuthState() {
    const profileName = document.getElementById('profileName');
    const profileStatus = document.getElementById('profileStatus');
    const signInButton = document.getElementById('googleSignInButton');
    const signOutButton = document.getElementById('signOutButton');
    const historyPanel = document.getElementById('historyPanel');

    if (!profileName || !profileStatus || !signInButton || !signOutButton || !historyPanel) return;

    if (!firebaseState.isConfigured) {
        profileName.textContent = 'Profile unavailable';
        profileStatus.textContent = firebaseState.error || 'Firebase is not configured.';
        signInButton.classList.add('hidden');
        signOutButton.classList.add('hidden');
        historyPanel.classList.add('hidden');
        setHistoryMessage('Add your Firebase web config to enable accounts and saved history.');
        return;
    }

    if (!firebaseState.user) {
        profileName.textContent = 'Signed out';
        profileStatus.textContent = 'Sign in to save your first daily solve.';
        signInButton.classList.remove('hidden');
        signOutButton.classList.add('hidden');
        historyPanel.classList.add('hidden');
        setHistoryMessage('');
        return;
    }

    profileName.textContent = firebaseState.user.displayName || firebaseState.user.email || 'Player';
    profileStatus.textContent = firebaseState.user.email || 'Signed in with Google';
    signInButton.classList.add('hidden');
    signOutButton.classList.remove('hidden');
    historyPanel.classList.remove('hidden');
    setHistoryMessage('');
}

async function refreshHistoryAfterSave() {
    if (!firebaseState.user || !firebaseState.db) {
        renderHistory();
        return;
    }

    historyState.isLoading = true;
    renderHistory();

    try {
        const results = await loadAllDailyResults();
        historyState.resultsByDate = results.reduce((resultMap, result) => {
            resultMap[result.dateKey] = result;
            return resultMap;
        }, {});
        historyState.resultsByPuzzleDay = groupResultsByPuzzleDay(results);
        setHistoryMessage('');
    } catch (error) {
        console.error('Unable to load history:', error);
        setHistoryMessage('History could not be loaded.');
    } finally {
        historyState.isLoading = false;
        renderHistory();
    }
}

function changeHistoryMonth(delta) {
    if (historyState.isAnimatingMonth) return;

    historyState.visibleMonthIndex = (historyState.visibleMonthIndex + delta + 12) % 12;
    renderHistory(delta);
}

function renderHistory(monthDelta = 0) {
    renderStats();
    renderHistoryCalendar(monthDelta);
}

function renderStats() {
    const results = Object.values(historyState.resultsByDate);
    const solvedCountStat = document.getElementById('solvedCountStat');
    const currentStreakStat = document.getElementById('currentStreakStat');
    const longestStreakStat = document.getElementById('longestStreakStat');
    const bestTimeStat = document.getElementById('bestTimeStat');

    if (!solvedCountStat || !currentStreakStat || !longestStreakStat || !bestTimeStat) return;

    solvedCountStat.textContent = String(results.length);
    currentStreakStat.textContent = String(calculateCurrentStreak(historyState.resultsByDate));
    longestStreakStat.textContent = String(calculateLongestStreak(Object.keys(historyState.resultsByDate)));

    const bestTime = results.reduce((best, result) => {
        if (!result.durationMs) return best;
        return best === null ? result.durationMs : Math.min(best, result.durationMs);
    }, null);

    bestTimeStat.textContent = bestTime === null ? '--' : formatDuration(bestTime);
}

function renderHistoryCalendar(monthDelta = 0) {
    const monthLabel = document.getElementById('historyMonthLabel');
    const calendarViewport = document.getElementById('historyCalendarGrid');
    if (!monthLabel || !calendarViewport) return;

    monthLabel.textContent = months[historyState.visibleMonthIndex];

    if (historyState.isLoading) {
        historyState.isAnimatingMonth = false;
        setHistoryMonthButtonsDisabled(false);
        calendarViewport.style.height = '';
        const loadingCell = document.createElement('div');
        loadingCell.className = 'history-loading';
        loadingCell.textContent = 'Loading history...';
        calendarViewport.replaceChildren(loadingCell);
        return;
    }

    const newCalendarPage = buildHistoryCalendarPage(historyState.visibleMonthIndex);
    const existingCalendarPage = calendarViewport.querySelector('.history-calendar-grid');

    const shouldReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!monthDelta || !existingCalendarPage || shouldReduceMotion) {
        historyState.isAnimatingMonth = false;
        setHistoryMonthButtonsDisabled(false);
        calendarViewport.style.height = '';
        calendarViewport.replaceChildren(newCalendarPage);
        return;
    }

    animateHistoryMonthChange(calendarViewport, existingCalendarPage, newCalendarPage, monthDelta);
}

function buildHistoryCalendarPage(monthIndex) {
    const calendarPage = document.createElement('div');
    calendarPage.className = 'history-calendar-grid';

    const daysInMonth = getYearAgnosticDaysInMonth(monthIndex);
    const totalCells = Math.ceil(daysInMonth / 7) * 7;

    for (let index = 0; index < totalCells; index++) {
        const cell = document.createElement('div');
        cell.className = 'history-day';

        const dayNumber = index + 1;
        if (dayNumber < 1 || dayNumber > daysInMonth) {
            cell.classList.add('empty');
            calendarPage.appendChild(cell);
            continue;
        }

        const puzzleDayKey = getPuzzleDayKey(monthIndex, dayNumber);
        const results = historyState.resultsByPuzzleDay[puzzleDayKey] || [];

        const dayLabel = document.createElement('div');
        dayLabel.className = 'history-day-number';
        dayLabel.textContent = String(dayNumber);
        cell.appendChild(dayLabel);

        if (results.length > 0) {
            const timeList = document.createElement('div');
            timeList.className = 'history-day-times';
            cell.classList.add('solved');
            cell.title = results
                .map(formatHistoryResultTitle)
                .join('\n');

            results.forEach(result => {
                const timeLabel = document.createElement('div');
                timeLabel.className = 'history-day-time';
                timeLabel.textContent = formatHistoryResultLabel(result);
                timeList.appendChild(timeLabel);
            });

            cell.appendChild(timeList);
        }

        calendarPage.appendChild(cell);
    }

    return calendarPage;
}

function animateHistoryMonthChange(calendarViewport, existingCalendarPage, newCalendarPage, monthDelta) {
    const direction = monthDelta > 0 ? 1 : -1;
    let didFinishAnimation = false;

    historyState.isAnimatingMonth = true;
    setHistoryMonthButtonsDisabled(true);

    calendarViewport.style.height = `${existingCalendarPage.offsetHeight}px`;
    existingCalendarPage.classList.add('history-calendar-page', 'is-current');
    newCalendarPage.classList.add(
        'history-calendar-page',
        direction > 0 ? 'from-right' : 'from-left'
    );
    calendarViewport.appendChild(newCalendarPage);
    calendarViewport.style.height = `${Math.max(existingCalendarPage.offsetHeight, newCalendarPage.offsetHeight)}px`;

    requestAnimationFrame(() => {
        existingCalendarPage.classList.add(direction > 0 ? 'to-left' : 'to-right');
        newCalendarPage.classList.add('is-current');
    });

    const finishAnimation = () => {
        if (didFinishAnimation) return;

        didFinishAnimation = true;
        historyState.isAnimatingMonth = false;
        setHistoryMonthButtonsDisabled(false);
        newCalendarPage.classList.remove('history-calendar-page', 'from-right', 'from-left', 'is-current');
        calendarViewport.style.height = '';
        calendarViewport.replaceChildren(newCalendarPage);
    };

    newCalendarPage.addEventListener('transitionend', finishAnimation, { once: true });
    window.setTimeout(finishAnimation, 320);
}

function setHistoryMonthButtonsDisabled(isDisabled) {
    const prevButton = document.getElementById('historyPrevMonthButton');
    const nextButton = document.getElementById('historyNextMonthButton');

    if (prevButton) prevButton.disabled = isDisabled;
    if (nextButton) nextButton.disabled = isDisabled;
}

function groupResultsByPuzzleDay(results) {
    return results.reduce((resultMap, result) => {
        const puzzleDayKey = getPuzzleDayKeyForResult(result);
        if (!puzzleDayKey) return resultMap;

        if (!resultMap[puzzleDayKey]) {
            resultMap[puzzleDayKey] = [];
        }

        resultMap[puzzleDayKey].push(result);
        resultMap[puzzleDayKey].sort((a, b) => getResultYear(a) - getResultYear(b));
        return resultMap;
    }, {});
}

function getPuzzleDayKeyForResult(result) {
    if (result?.puzzleMonth && result?.puzzleDay) {
        return `${padDatePart(result.puzzleMonth)}-${padDatePart(result.puzzleDay)}`;
    }

    if (!result?.dateKey) return null;

    const [, month, day] = result.dateKey.split('-');
    if (!month || !day) return null;

    return `${month}-${day}`;
}

function getPuzzleDayKey(monthIndex, day) {
    return `${padDatePart(monthIndex + 1)}-${padDatePart(day)}`;
}

function getResultYear(result) {
    if (!result?.dateKey) return '';

    return result.dateKey.split('-')[0] || '';
}

function formatHistoryResultLabel(result) {
    const year = getResultYear(result);
    const duration = formatDuration(result.durationMs);

    return year ? `${year} ${duration}` : duration;
}

function formatHistoryResultTitle(result) {
    const year = getResultYear(result);
    const duration = formatDuration(result.durationMs);

    return year ? `${year}: ${duration}` : duration;
}

function getYearAgnosticDaysInMonth(monthIndex) {
    if (monthIndex === 1) return 29;

    return new Date(2024, monthIndex + 1, 0).getDate();
}

function calculateCurrentStreak(resultsByDate) {
    const todayKey = getLocalDateKey();
    const startDate = resultsByDate[todayKey]
        ? parseDateKey(todayKey)
        : addDays(parseDateKey(todayKey), -1);

    let streak = 0;
    let cursor = startDate;

    while (resultsByDate[getDateKeyForDate(cursor)]) {
        streak++;
        cursor = addDays(cursor, -1);
    }

    return streak;
}

function calculateLongestStreak(dateKeys) {
    if (dateKeys.length === 0) return 0;

    const sortedKeys = [...dateKeys].sort();
    let longest = 1;
    let current = 1;

    for (let index = 1; index < sortedKeys.length; index++) {
        const previousDate = parseDateKey(sortedKeys[index - 1]);
        const expectedNextKey = getDateKeyForDate(addDays(previousDate, 1));

        if (sortedKeys[index] === expectedNextKey) {
            current++;
        } else {
            current = 1;
        }

        longest = Math.max(longest, current);
    }

    return longest;
}

function setHistoryMessage(message) {
    const historyMessage = document.getElementById('historyMessage');
    if (historyMessage) {
        historyMessage.textContent = message;
    }
}
