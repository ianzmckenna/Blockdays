// Daily puzzle timer with local persistence.

const TIMER_STORAGE_PREFIX = 'blockdays.timer.';
const PENDING_RESULT_STORAGE_PREFIX = 'blockdays.pendingResult.';

const timerState = {
    dateKey: null,
    startedAt: null,
    solvedAt: null,
    durationMs: 0,
    intervalId: null
};

function initTimerManager() {
    timerState.dateKey = gameState.currentDate?.dateKey || getLocalDateKey();
    loadTimerState();
    renderTimer();

    if (timerState.startedAt && !timerState.solvedAt) {
        startTimerInterval();
    }
}

function getTimerStorageKey(dateKey = timerState.dateKey) {
    return `${TIMER_STORAGE_PREFIX}${dateKey}`;
}

function getPendingResultStorageKey(dateKey) {
    return `${PENDING_RESULT_STORAGE_PREFIX}${dateKey}`;
}

function loadTimerState() {
    const stored = localStorage.getItem(getTimerStorageKey());
    if (!stored) {
        timerState.startedAt = null;
        timerState.solvedAt = null;
        timerState.durationMs = 0;
        return;
    }

    try {
        const parsed = JSON.parse(stored);
        timerState.startedAt = Number(parsed.startedAt) || null;
        timerState.solvedAt = Number(parsed.solvedAt) || null;
        timerState.durationMs = Number(parsed.durationMs) || 0;
    } catch (error) {
        console.warn('Unable to load stored timer state:', error);
        localStorage.removeItem(getTimerStorageKey());
    }
}

function saveTimerState() {
    if (!timerState.dateKey) return;

    localStorage.setItem(getTimerStorageKey(), JSON.stringify({
        dateKey: timerState.dateKey,
        startedAt: timerState.startedAt,
        solvedAt: timerState.solvedAt,
        durationMs: timerState.durationMs
    }));
}

function startDailyTimerIfNeeded() {
    if (timerState.solvedAt) return;

    if (!timerState.startedAt) {
        timerState.startedAt = Date.now();
        timerState.durationMs = 0;
        saveTimerState();
    }

    startTimerInterval();
    renderTimer();
}

function startTimerInterval() {
    if (timerState.intervalId) return;

    timerState.intervalId = window.setInterval(renderTimer, 250);
}

function stopTimerInterval() {
    if (!timerState.intervalId) return;

    window.clearInterval(timerState.intervalId);
    timerState.intervalId = null;
}

function getCurrentDurationMs() {
    if (!timerState.startedAt) return timerState.durationMs || 0;
    if (timerState.solvedAt) return timerState.durationMs || 0;

    return Date.now() - timerState.startedAt;
}

function completeDailyTimer() {
    if (!timerState.startedAt) {
        timerState.startedAt = Date.now();
    }

    if (!timerState.solvedAt) {
        timerState.solvedAt = Date.now();
        timerState.durationMs = timerState.solvedAt - timerState.startedAt;
        saveTimerState();
    }

    stopTimerInterval();
    renderTimer();

    return buildDailyResultPayload(timerState.durationMs);
}

function freezeDailyTimerFromSavedResult(result) {
    if (!result?.dateKey || result.dateKey !== timerState.dateKey) {
        return false;
    }

    const durationMs = Number(result.durationMs);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        return false;
    }

    const now = Date.now();
    timerState.startedAt = now - durationMs;
    timerState.solvedAt = now;
    timerState.durationMs = durationMs;

    stopTimerInterval();
    saveTimerState();
    renderTimer();

    return true;
}

function clearFrozenDailyTimer() {
    if (!timerState.solvedAt) {
        return false;
    }

    stopTimerInterval();
    localStorage.removeItem(getTimerStorageKey());

    timerState.startedAt = null;
    timerState.solvedAt = null;
    timerState.durationMs = 0;

    renderTimer();

    return true;
}

function getPlacementShapeKey(shape) {
    return shape.map(row => row.join('')).join('/');
}

function buildCompletedSolution() {
    const placements = gameState.pieceStates
        .filter(piece => piece.isOnGrid && piece.gridPlacementCoords)
        .map(piece => {
            const [x, y] = piece.gridPlacementCoords;
            const rotation = ((piece.rotation % 360) + 360) % 360; // Normalize, fix negatives, then fix positives

            return {
                pieceId: piece.id,
                pieceName: pieceDefinitions[piece.id]?.name || `Piece ${piece.id}`,
                anchor: { x, y },
                orientation: {
                    rotation,
                    flipH: Boolean(piece.isFlippedH),
                    flipV: Boolean(piece.isFlippedV),
                    shapeKey: getPlacementShapeKey(piece.shape)
                }
            };
        })
        .sort((a, b) => a.pieceId - b.pieceId);

    const canonicalKey = placements.map(placement => [
        placement.pieceId,
        '@',
        placement.anchor.x,
        ',',
        placement.anchor.y,
        '|',
        placement.orientation.shapeKey
    ].join('')).join(';');

    return {
        canonicalKey,
        placements
    };
}

function buildDailyResultPayload(durationMs) {
    const currentDate = gameState.currentDate || getLocalPuzzleDate();

    return {
        dateKey: currentDate.dateKey,
        durationMs,
        puzzleMonth: currentDate.month,
        puzzleDay: currentDate.day,
        timezone: currentDate.timezone,
        solution: buildCompletedSolution()
    };
}

function renderTimer() {
    const timerText = document.getElementById('timerText');
    if (timerText) {
        timerText.textContent = formatDuration(getCurrentDurationMs());
    }
}

function formatDuration(durationMs) {
    const totalSeconds = Math.max(0, Math.floor((Number(durationMs) || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function savePendingDailyResult(result) {
    if (!result?.dateKey) return;

    const storageKey = getPendingResultStorageKey(result.dateKey);
    if (localStorage.getItem(storageKey)) return;

    localStorage.setItem(storageKey, JSON.stringify({
        ...result,
        savedLocallyAt: new Date().toISOString()
    }));
}

function getPendingDailyResults() {
    const pendingResults = [];

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(PENDING_RESULT_STORAGE_PREFIX)) continue;

        try {
            const result = JSON.parse(localStorage.getItem(key));
            if (result?.dateKey) pendingResults.push(result);
        } catch (error) {
            console.warn('Unable to parse pending result:', error);
        }
    }

    return pendingResults;
}

function clearPendingDailyResult(dateKey) {
    localStorage.removeItem(getPendingResultStorageKey(dateKey));
}
