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
    if (!result?.dateKey) return { status: 'invalid' };

    if (!firebaseState.user || !firebaseState.db) {
        savePendingDailyResult(result);
        return { status: 'pending' };
    }

    return saveDailyResultForUser(firebaseState.user.uid, result);
}

async function handleDailySolveCompleted(result) {
    updateWinSolveTime(result);
    setWinSaveStatus('Saving...', false);

    try {
        const saveResult = await saveDailySolveResult(result);
        updateWinSaveStatus(saveResult);

        if (saveResult.status === 'saved' || saveResult.status === 'exists') {
            clearPendingDailyResult(result.dateKey);
        }

        if (typeof refreshHistoryAfterSave === 'function') {
            refreshHistoryAfterSave();
        }
    } catch (error) {
        console.error('Unable to save solve result:', error);
        savePendingDailyResult(result);
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

    const existing = await docRef.get();
    if (existing.exists) {
        return {
            status: 'exists',
            result: existing.data()
        };
    }

    const payload = {
        dateKey: result.dateKey,
        durationMs: result.durationMs,
        puzzleMonth: result.puzzleMonth,
        puzzleDay: result.puzzleDay,
        timezone: result.timezone,
        completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(payload);

    return {
        status: 'saved',
        result: payload
    };
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
