# Blockdays

Blockdays is a small browser-based daily puzzle game written in raw HTML, CSS, and JS. The objective of the game fit all pieces onto a calendar-styled board while avoiding two blocked date squares that change each day.

- Live app entry: [public/index.html](public/index.html)
- Styles: [public/style.css](public/style.css)

## Project Layout

- [public/](public/) - Source folder
    - [index.html](public/index.html) - main HTML shell and script load order.
    - [style.css](public/style.css) - app styling and responsive CSS variables.
    - [js/](public/js/) - Scripts folder
        - [constants.js](public/js/constants.js) - sizes, PIECE definitions and `gameState`.
        - [dateUtils.js](public/js/dateUtils.js) - date logic (`initCurrentDate`).
        - [timerManager.js](public/js/timerManager.js) - first-move timer, local persistence, and pending result storage.
        - [firebaseConfig.js](public/js/firebaseConfig.js) - Firebase web config placeholder for Auth and Firestore.
        - [firebaseManager.js](public/js/firebaseManager.js) - Google sign-in and per-user daily result saves.
        - [historyManager.js](public/js/historyManager.js) - profile modal, stats, and month history calendar.
        - [uiManager.js](public/js/uiManager.js) - palette, preview, creation of DOM pieces (`drawPiecePalette`, `createPalettePiece`, `createGridPiece`, `makeDraggable`, `updatePieceViewAfterTransform`).
        - [pieceManager.js](public/js/pieceManager.js) - piece creation, transforms, placement helpers (`initPieceStates`, `preloadPieceAssets`, `isValidPlacement`, `placePiece`, `transformSelectedPiece`).
        - [gridManager.js](public/js/gridManager.js) - grid draw and game lifecycle (`drawGrid`, `updateBoardState`, `checkWinCondition`, `resetGame`).
        - [responsiveManager.js](public/js/responsiveManager.js) - responsive sizing (`calculateOptimalScale`, `applyResponsiveScale`, `getResponsiveBoardCellSize`, `getResponsivePaletteCellSize`).
        - [gameController.js](public/js/gameController.js) - initialization entrypoint (`initGame`) and UI wiring.
- [firebase.json](firebase.json) and [.firebaserc](.firebaserc) - hosting configuration and default project.
- [package.json](package.json) and [package-lock.json](package-lock.json) - project dependencies (includes `firebase`).
- [.gitignore](.gitignore) - Files/folders to ignore when uploaded to GitHub
- [.github/workflows/](.github/workflows/) - GitHub Actions deploy workflows
  - [firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml) - For previewing pull requests
  - [firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml) - For deploying on merge with `main`
- [firestore.rules](firestore.rules) - owner-only player history and discovery rules, plus read-only generated solution metadata.
- [firestore.indexes.json](firestore.indexes.json) - Not sure what this is really for :D (might have to do with [firestore.rules](firestore.rules))
- [inspo.jpg](inspo.jpg) - The inspiration for everything

## Key features

- Daily-blocked squares computed from the current date via [`initCurrentDate`](public/js/dateUtils.js).
- First-move daily timer persisted in browser storage until the puzzle is solved.
- Google account sign-in and private Firestore history by player.
- Authenticated daily results store the solve duration and the completed solution as a canonical key plus readable piece placements.
- Profile modal with solved count, streaks, best time, and month calendar history. Select a solved day to see first times by year and unique solutions discovered versus the generated total.
- Responsive scaling managed by [`initResponsiveManager`](public/js/responsiveManager.js) and [`calculateOptimalScale`](public/js/responsiveManager.js).
- Piece palette + preview UI implemented in [`drawPiecePalette`](public/js/uiManager.js) and updated by [`updatePieceViewAfterTransform`](public/js/uiManager.js).
- Drag & drop placement with validation via [`makeDraggable`](public/js/uiManager.js), [`isValidPlacement`](public/js/pieceManager.js) and [`placePiece`](public/js/pieceManager.js).
- Game logic: piece creation and transforms in [`initPieceStates`](public/js/pieceManager.js), [`transformSelectedPiece`](public/js/pieceManager.js), and rotation/flip helpers.
- Grid rendering and win detection via [`drawGrid`](public/js/gridManager.js), [`updateBoardState`](public/js/gridManager.js) and [`checkWinCondition`](public/js/gridManager.js).

## Running locally

1. Install dependencies: `npm install` (only once)
1. Serve the `public/` folder using a static server (recommended during development):
   - Quick test with Python: `python -m http.server` (run from `public/`)
   - OR
   - Run a static server: `npx http-server -c-1` (run from root)
      - `-c-1` sets a cache TTL of -1 seconds, meaning the server refreshes instantly on any change

2. Open the localhost link given by the server in a browser.
   - If your mobile device is on the same network, this link is available there as well for testing.

## Firebase Account Setup

1. In the Firebase Console for `blockdays-iwnl`, open Authentication and click Get started if Auth has not been initialized yet.
2. Enable Google as an Authentication provider.
3. Add the deployed domain and local test domains, such as `localhost` and `127.0.0.1`, under Authentication > Settings > Authorized domains.
4. Copy the web app config and paste it into [public/js/firebaseConfig.js](public/js/firebaseConfig.js).
5. Deploy the updated [firestore.rules](firestore.rules) before relying on saved player history.

## Solution history data

The solution generator writes one metadata document per recurring puzzle day at `puzzleSolutions/{MM-DD}`. The client reads its `solutionCount` for the selected history day; if metadata has not been generated, the total is shown as unavailable.

Each signed-in player's distinct completed solutions are stored at `users/{userId}/solutionDiscoveries/{MM-DD}/solutions/{solutionId}`. The existing `users/{userId}/dailyResults/{YYYY-MM-DD}` record remains the immutable first completion time for that calendar year. Later replay attempts can add unique discoveries without replacing that first time.

## Assets

All assets include the board sprite, blocked square sprite, piece sprites, and font files. They are all in `public/assets/` and referenced from piece definitions in [`public/js/constants.js`](public/js/constants.js).

## Deploying to Firebase Hosting

This project is configured for Firebase Hosting. The repo already includes host config files: [firebase.json](firebase.json) and [.firebaserc](.firebaserc). There are two methods of deployment set up for this project:

### GitHub Actions (Recommended)

The repo includes actions to preview on PRs and deploy on merge:
   - [.github/workflows/firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml)
   - [.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml)

Pushing a commit to the `main` branch will automatically update the deployed site with the commit. There are ways to deploy to preview links by deploying to separate branches in the repository. Please see [here](https://firebase.google.com/docs/hosting/github-integration) for more details.

This is the preferred method of deployment, as it synchronizes the versions between GitHub and Firebase.

### Firebase CLI (Special Use Cases)

If there is a reason to desync the Firebase version from the GitHub version, you may use the Firebase CLI to deploy the code that you have locally.

Follow these steps to connect your local environment and deploy:

1. Install Firebase CLI
   ```sh
   npm install -g firebase-tools
   ```

2. Login to Firebase
   ```sh
   firebase login
   ```

3. Select the project
     ```sh
     firebase use blockdays-iwnl
     ```

4. Confirm hosting config
   - `firebase.json` is already set to serve the `public` directory and rewrite unknown routes to `index.html`:
     see [firebase.json](firebase.json).

5. Deploy to hosting
   ```sh
   firebase deploy
   ```

8. Firestore rules
   - Development rule included: [firestore.rules](firestore.rules)
   - Update rules before production use.

## Contributing

Ian McKenna
