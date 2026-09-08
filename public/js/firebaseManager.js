// Firebase Auth and Firestore integration.

const firebaseState = {
    app: null,
    auth: null,
    db: null,
    user: null,
    isConfigured: false,
    isReady: false,
    error: null,
    listeners: []
};

function initFirebaseManager() {
    try {
        if (!window.firebase) {
            firebaseState.error = 'Firebase SDK unavailable.';
            notifyFirebaseAuthListeners();
            return;
        }

        if (!hasUsableFirebaseConfig(window.blockdaysFirebaseConfig)) {
            firebaseState.error = 'Firebase web config is missing.';
            notifyFirebaseAuthListeners();
            return;
        }

        firebaseState.app = window.firebase.apps.length
            ? window.firebase.app()
            : window.firebase.initializeApp(window.blockdaysFirebaseConfig);
        firebaseState.auth = window.firebase.auth();
        firebaseState.db = window.firebase.firestore();
        firebaseState.isConfigured = true;
        firebaseState.isReady = true;

        firebaseState.auth.onAuthStateChanged(async (user) => {
            const previousUser = firebaseState.user;
            firebaseState.user = user;
            notifyFirebaseAuthListeners();

            if (user) {
                await syncPendingDailyResults();
                await freezeTodayTimerFromSavedResult();
            } else if (previousUser) {
                clearFrozenTimerAfterLogout();
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        firebaseState.error = 'Firebase initialization failed.';
        notifyFirebaseAuthListeners();
    }
}

function hasUsableFirebaseConfig(config) {
    return Boolean(
        config?.apiKey &&
        config?.projectId &&
        config?.appId
    );
}

function onBlockdaysAuthChanged(callback) {
    firebaseState.listeners.push(callback);
    callback(firebaseState.user, firebaseState);
}

function notifyFirebaseAuthListeners() {
    firebaseState.listeners.forEach(callback => {
        try {
            callback(firebaseState.user, firebaseState);
        } catch (error) {
            console.warn('Auth listener failed:', error);
        }
    });
}

async function signInWithGoogle() {
    if (!firebaseState.auth) {
        throw new Error(firebaseState.error || 'Firebase is not configured.');
    }

    const provider = new window.firebase.auth.GoogleAuthProvider();
    try {
        return await firebaseState.auth.signInWithPopup(provider);
    } catch (error) {
        firebaseState.error = getAuthErrorMessage(error);
        notifyFirebaseAuthListeners();
        throw error;
    }
}

async function signOutOfBlockdays() {
    if (!firebaseState.auth) return;

    await firebaseState.auth.signOut();
}

async function saveDailySolveResult(result) {
    console.info('[Firebase] saveDailySolveResult started', {
        dateKey: result?.dateKey || null,
        hasUser: Boolean(firebaseState.user),
        hasDatabase: Boolean(firebaseState.db),
        isReady: firebaseState.isReady
    });

    if (!result?.dateKey) return { status: 'invalid' };

    if (!firebaseState.user || !firebaseState.db) {
        console.warn('[Firebase] Daily result queued locally because Firebase user or database is unavailable.', {
            dateKey: result.dateKey,
            hasUser: Boolean(firebaseState.user),
            hasDatabase: Boolean(firebaseState.db)
        });
        savePendingDailyResult(result);
        return { status: 'pending' };
    }

    console.info('[Firebase] Saving daily result to Firestore', {
        uid: firebaseState.user.uid,
        dateKey: result.dateKey
    });
    return saveDailyResultForUser(firebaseState.user.uid, result);
}

async function handleDailySolveCompleted(result) {
    updateWinSolveTime(result);
    setWinSaveStatus('Saving...', false);
    console.info('[Firebase] Solve completed; starting save operations', {
        dateKey: result?.dateKey || null,
        puzzleMonth: result?.puzzleMonth || null,
        puzzleDay: result?.puzzleDay || null,
        hasSolution: Boolean(result?.solution?.canonicalKey),
        uid: firebaseState.user?.uid || null
    });

    try {
        const saveResult = await saveDailySolveResult(result);
        console.info('[Firebase] Daily result save finished', {
            status: saveResult.status,
            dateKey: result.dateKey
        });
        const discoveryResult = await saveSolutionDiscovery(result);
        console.info('[Firebase] Solution discovery save finished', {
            status: discoveryResult.status,
            dateKey: result.dateKey,
            puzzleDayKey: getDiscoveryPuzzleDayKey(result)
        });
        updateWinSaveStatus(saveResult);

        if (saveResult.status === 'saved' || saveResult.status === 'exists') {
            clearPendingDailyResult(result.dateKey);
        }

        if (discoveryResult.status === 'saved' || discoveryResult.status === 'exists') {
            clearPendingSolutionDiscovery(result);
        }

        if (typeof refreshHistoryAfterSave === 'function') {
            refreshHistoryAfterSave();
        }
    } catch (error) {
        console.error('[Firebase] Unable to save solve result.', {
            code: error?.code || 'unknown-error',
            message: error?.message || String(error),
            uid: firebaseState.user?.uid || null,
            dateKey: result?.dateKey || null
        }, error);
        savePendingDailyResult(result);
        savePendingSolutionDiscovery(result);
        if (firebaseState.user) {
            setWinSaveStatus('Time saved on this device. Sync will retry later.', false);
        } else {
            setWinSaveStatus(
                firebaseState.isConfigured
                    ? 'Time saved on this device. Sign in to sync it.'
                    : 'Time saved on this device. Add Firebase config to sync it.',
                firebaseState.isConfigured
            );
        }
    }
}

function updateWinSolveTime(result) {
    const winTimeText = document.getElementById('winTimeText');
    if (winTimeText && result?.durationMs !== undefined) {
        winTimeText.textContent = formatDuration(result.durationMs);
    }
}

function updateWinSaveStatus(saveResult) {
    switch (saveResult?.status) {
        case 'saved':
            setWinSaveStatus('Saved to your history.', false);
            break;
        case 'exists':
            setWinSaveStatus('Your first time for today is already saved.', false);
            break;
        case 'pending':
            if (firebaseState.isConfigured) {
                setWinSaveStatus('Sign in to save this time to your history.', true);
            } else {
                setWinSaveStatus('Time saved on this device. Add Firebase config to sync it.', false);
            }
            break;
        default:
            setWinSaveStatus(
                firebaseState.isConfigured
                    ? 'Time saved on this device. Sign in to sync it.'
                    : 'Time saved on this device. Add Firebase config to sync it.',
                firebaseState.isConfigured
            );
            break;
    }
}

function setWinSaveStatus(message, showSignInButton) {
    const winSaveStatus = document.getElementById('winSaveStatus');
    const winSignInButton = document.getElementById('winSignInButton');

    if (winSaveStatus) {
        winSaveStatus.textContent = message;
    }

    if (winSignInButton) {
        winSignInButton.classList.toggle('hidden', !showSignInButton);
    }
}

async function saveDailyResultForUser(uid, result) {
    const docRef = firebaseState.db
        .collection('users')
        .doc(uid)
        .collection('dailyResults')
        .doc(result.dateKey);

    try {
        const existing = await docRef.get();
        if (existing.exists) {
            return {
                status: 'exists',
                result: existing.data()
            };
        }

        const sanitizedSolution = sanitizeSolutionForFirestore(result.solution);
        const payload = {
            dateKey: result.dateKey,
            durationMs: result.durationMs,
            puzzleMonth: result.puzzleMonth,
            puzzleDay: result.puzzleDay,
            timezone: result.timezone,
            completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        if (sanitizedSolution) {
            payload.solution = sanitizedSolution;
        }

        await docRef.set(payload);

        return {
            status: 'saved',
            result: payload
        };
    } catch (error) {
        throw error;
    }
}

function sanitizeSolutionForFirestore(solution) {
    if (!solution?.canonicalKey || !Array.isArray(solution.placements)) {
        return null;
    }

    const placements = solution.placements.map(placement => ({
        pieceId: placement.pieceId,
        pieceName: placement.pieceName,
        anchor: placement.anchor,
        orientation: {
            rotation: placement.orientation?.rotation,
            flipH: Boolean(placement.orientation?.flipH),
            flipV: Boolean(placement.orientation?.flipV),
            shapeKey: placement.orientation?.shapeKey
                || placement.shape?.map(row => row.join('')).join('/')
        }
    }));

    const isValid = solution.placements.length === 8
        && placements.every(placement => (
            Number.isInteger(placement.pieceId)
            && typeof placement.pieceName === 'string'
            && Number.isInteger(placement.anchor?.x)
            && Number.isInteger(placement.anchor?.y)
            && Number.isInteger(placement.orientation.rotation)
            && [0, 90, 180, 270].includes(placement.orientation.rotation)
            && typeof placement.orientation.shapeKey === 'string'
            && /^[01]+(\/[01]+)*$/.test(placement.orientation.shapeKey)
        ));

    if (!isValid) return null;

    return {
        canonicalKey: solution.canonicalKey,
        placements
    };
}

async function saveSolutionDiscovery(result) {
    const puzzleDayKey = getDiscoveryPuzzleDayKey(result);
    const solutionId = result?.solution?.canonicalKey
        ? getSolutionDiscoveryId(result.solution.canonicalKey)
        : null;

    if (!result?.dateKey || !solutionId) {
        return { status: 'invalid' };
    }

    if (!firebaseState.user || !firebaseState.db) {
        savePendingSolutionDiscovery(result);
        return { status: 'pending' };
    }

    const docRef = firebaseState.db
        .collection('users')
        .doc(firebaseState.user.uid)
        .collection('solutionDiscoveries')
        .doc(puzzleDayKey)
        .collection('solutions')
        .doc(solutionId);

    try {
        const existing = await docRef.get();
        if (existing.exists) return { status: 'exists', result: existing.data() };

        const payload = {
            puzzleDayKey,
            solutionId,
            canonicalKey: result.solution.canonicalKey,
            dateKey: result.dateKey,
            durationMs: result.durationMs,
            completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        await docRef.set(payload);
        return { status: 'saved', result: payload };
    } catch (error) {
        throw error;
    }
}

async function loadSolutionDiscoveries(puzzleDayKey) {
    if (!firebaseState.user || !firebaseState.db || !puzzleDayKey) return [];

    const snapshot = await firebaseState.db
        .collection('users')
        .doc(firebaseState.user.uid)
        .collection('solutionDiscoveries')
        .doc(puzzleDayKey)
        .collection('solutions')
        .orderBy('dateKey')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function loadPuzzleSolutionMetadata(puzzleDayKey) {
    if (!firebaseState.db || !puzzleDayKey) return null;

    const doc = await firebaseState.db
        .collection('puzzleSolutions')
        .doc(puzzleDayKey)
        .get();

    return doc.exists ? doc.data() : null;
}

function getDiscoveryPuzzleDayKey(result) {
    if (result?.puzzleMonth && result?.puzzleDay) {
        return `${String(result.puzzleMonth).padStart(2, '0')}-${String(result.puzzleDay).padStart(2, '0')}`;
    }

    const [, month, day] = result?.dateKey?.split('-') || [];
    return month && day ? `${month}-${day}` : null;
}

function getSolutionDiscoveryId(canonicalKey) {
    return canonicalKey.replaceAll('/', '~');
}

async function syncPendingDailyResults() {
    if (!firebaseState.user || !firebaseState.db) return;

    const pendingResults = getPendingDailyResults();
    let syncedCurrentResult = false;

    for (const result of pendingResults) {
        try {
            const saveResult = await saveDailyResultForUser(firebaseState.user.uid, result);
            if (saveResult.status === 'saved' || saveResult.status === 'exists') {
                clearPendingDailyResult(result.dateKey);
                if (result.dateKey === gameState.currentDate?.dateKey) {
                    syncedCurrentResult = true;
                }
            }
        } catch (error) {
            console.warn('Unable to sync pending result:', error);
        }
    }

    const pendingDiscoveries = getPendingSolutionDiscoveries();
    for (const result of pendingDiscoveries) {
        try {
            const discoveryResult = await saveSolutionDiscovery(result);
            if (discoveryResult.status === 'saved' || discoveryResult.status === 'exists') {
                clearPendingSolutionDiscovery(result);
            }
        } catch (error) {
            console.warn('Unable to sync pending solution discovery:', error);
        }
    }

    if (syncedCurrentResult) {
        setWinSaveStatus('Saved to your history.', false);
    }

    if (typeof refreshHistoryAfterSave === 'function') {
        refreshHistoryAfterSave();
    }
}

async function freezeTodayTimerFromSavedResult() {
    if (!firebaseState.user || !firebaseState.db || !gameState.currentDate?.dateKey) return;

    try {
        const result = await loadDailyResultForDate(gameState.currentDate.dateKey);
        if (!result) return;

        const didFreeze = freezeDailyTimerFromSavedResult(result);
        if (didFreeze) {
            gameState.isSolved = true;
            clearPendingDailyResult(result.dateKey);
            updateWinSolveTime(result);
            setWinSaveStatus('Your first time for today is already saved.', false);
        }
    } catch (error) {
        console.warn('Unable to load today\'s saved timer:', error);
    }
}

function clearFrozenTimerAfterLogout() {
    if (typeof clearFrozenDailyTimer !== 'function') return;

    const didClearTimer = clearFrozenDailyTimer();
    if (!didClearTimer) return;

    gameState.isSolved = false;
    updateWinSolveTime({ durationMs: 0 });
    setWinSaveStatus('', false);
}

async function loadDailyResultForDate(dateKey) {
    if (!firebaseState.user || !firebaseState.db || !dateKey) return null;

    const doc = await firebaseState.db
        .collection('users')
        .doc(firebaseState.user.uid)
        .collection('dailyResults')
        .doc(dateKey)
        .get();

    if (!doc.exists) return null;

    return {
        id: doc.id,
        ...doc.data()
    };
}

async function loadAllDailyResults() {
    if (!firebaseState.user || !firebaseState.db) return [];

    const snapshot = await firebaseState.db
        .collection('users')
        .doc(firebaseState.user.uid)
        .collection('dailyResults')
        .orderBy('dateKey')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

function getAuthErrorMessage(error) {
    switch (error?.code) {
        case 'auth/configuration-not-found':
            return 'Firebase Authentication is not enabled for this project, or Google sign-in is not enabled.';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized for Firebase sign-in.';
        case 'auth/popup-closed-by-user':
            return 'Google sign-in was closed before it finished.';
        case 'auth/popup-blocked':
            return 'The browser blocked the Google sign-in popup.';
        default:
            return error?.message || 'Google sign-in failed.';
    }
}
