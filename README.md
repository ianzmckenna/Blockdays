# Blockdays

Blockdays is a small browser-based daily puzzle: fit all pieces onto a calendar-styled board while avoiding two blocked date squares that change each day.

- Live app entry: [public/index.html](public/index.html)
- Styles: [public/style.css](public/style.css)

## Project layout (important files)

- [public/](public/) — Source folder
    - [index.html](public/index.html) — main HTML shell and script load order.
    - [style.css](public/style.css) — app styling and responsive CSS variables.
    - [js/](public/js/) — Scripts folder
        - [constants.js](public/js/constants.js) — sizes, GRID_SIZE, PIECE definitions and `gameState`.
        - [dateUtils.js](public/js/dateUtils.js) — date logic (`setupCurrentDate`).
        - [uiManager.js](public/js/uiManager.js) — palette, preview, creation of DOM pieces (`drawPiecePalette`, `createPalettePiece`, `createGridPiece`, `makeDraggable`, `updatePieceViewAfterTransform`).
        - [pieceManager.js](public/js/pieceManager.js) — piece creation, transforms, placement helpers (`createPieces`, `preloadPieceAssets`, `isValidPlacement`, `placePiece`, `transformSelectedPiece`).
        - [gridManager.js](public/js/gridManager.js) — grid draw and game lifecycle (`drawGrid`, `updateBoardState`, `checkWinCondition`, `resetGame`).
        - [responsiveManager.js](public/js/responsiveManager.js) — responsive sizing (`calculateOptimalScale`, `applyResponsiveScale`, `getResponsiveboardCellSize`, `getResponsivePaletteCellSize`).
        - [gameController.js](public/js/gameController.js) — initialization entrypoint (`initGame`) and UI wiring.
        - [firebase.js](public/js/firebase.js) — Firebase SDK initialization and config.
- [firebase.json](firebase.json) and [.firebaserc](.firebaserc) — hosting configuration and default project.
- [package.json](package.json) — project dependencies (includes `firebase`).
- GitHub Actions deploy workflows:
  - [.github/workflows/firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml)
  - [.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml)
- Firestore rules: [firestore.rules](firestore.rules)

## Key features

- Daily-blocked squares computed from the current date via [`setupCurrentDate`](public/js/dateUtils.js).
- Responsive scaling managed by [`initResponsiveManager`](public/js/responsiveManager.js) and [`calculateOptimalScale`](public/js/responsiveManager.js).
- Piece palette + preview UI implemented in [`drawPiecePalette`](public/js/uiManager.js) and updated by [`updatePieceViewAfterTransform`](public/js/uiManager.js).
- Drag & drop placement with validation via [`makeDraggable`](public/js/uiManager.js), [`isValidPlacement`](public/js/pieceManager.js) and [`placePiece`](public/js/pieceManager.js).
- Game logic: piece creation and transforms in [`createPieces`](public/js/pieceManager.js), [`transformSelectedPiece`](public/js/pieceManager.js), and rotation/flip helpers.
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

## Assets

All assets include the board sprite, blocked square sprite, piece sprites, and font files. They are all in `public/assets/` and referenced from piece definitions in [`public/js/constants.js`](public/js/constants.js).

## Firebase: connect & deploy (Hosting)

This project is configured for Firebase Hosting. The repo already includes host config files: [firebase.json](firebase.json) and [.firebaserc](.firebaserc). Follow these steps to connect your local environment and deploy:

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

7. CI/CD with GitHub Actions
   - The repo includes actions to preview on PRs and deploy on merge:
     - [.github/workflows/firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml)
     - [.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml)
   - For the GitHub Actions deploys you must add a `FIREBASE_SERVICE_ACCOUNT_*` secret containing a service account JSON with appropriate permissions (see Firebase docs). The actions reference `FIREBASE_SERVICE_ACCOUNT_BLOCKDAYS_IWNL` in the workflow.

8. Firestore rules
   - Development rule included: [firestore.rules](firestore.rules)
   - Update rules before production use.

---

This README references important runtime functions and files. Open any linked file to inspect implementation or adjust behavior:

- [`initGame`](public/js/gameController.js) — public/js/gameController.js
- [`initResponsiveManager`](public/js/responsiveManager.js) — public/js/responsiveManager.js
- [`calculateOptimalScale`](public/js/responsiveManager.js) — public/js/responsiveManager.js
- [`drawGrid`](public/js/gridManager.js) — public/js/gridManager.js
- [`drawPiecePalette`](public/js/uiManager.js) — public/js/uiManager.js
- [`createPieces`](public/js/pieceManager.js) — public/js/pieceManager.js
- [`preloadPieceAssets`](public/js/pieceManager.js) — public/js/pieceManager.js
- [`transformSelectedPiece`](public/js/pieceManager.js) — public/js/pieceManager.js
- [`isValidPlacement`](public/js/pieceManager.js) — public/js/pieceManager.js
- [`placePiece`](public/js/pieceManager.js) — public/js/pieceManager.js
- [`updateBoardState`](public/js/gridManager.js) — public/js/gridManager.js
- [`checkWinCondition`](public/js/gridManager.js) — public/js/gridManager.js
- [`setupCurrentDate`](public/js/dateUtils.js) — public/js/dateUtils.js

Files:
- [public/index.html](public/index.html)
- [public/style.css](public/style.css)
- [public/js/constants.js](public/js/constants.js)
- [public/js/uiManager.js](public/js/uiManager.js)
- [public/js/pieceManager.js](public/js/pieceManager.js)
- [public/js/gridManager.js](public/js/gridManager.js)
- [public/js/responsiveManager.js](public/js/responsiveManager.js)
- [public/js/gameController.js](public/js/gameController.js)
- [public/js/firebase.js](public/js/firebase.js)
- [firebase.json](firebase.json)
- [.firebaserc](.firebaserc)
- [package.json](package.json)
- [.github/workflows/firebase-hosting-pull-request.yml](.github/workflows/firebase-hosting-pull-request.yml)
- [.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml)
- [firestore.rules](firestore.rules)