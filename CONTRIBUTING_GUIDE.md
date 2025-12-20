# Development Guide

## 🎮 How to Add a New Game

1.  **Create Game Files**
    Create two JSON files in the `public/games` folder:
    *   English: `public/games/en/your-game-id.json`
    *   Chinese: `public/games/zh/your-game-id-CN.json`
    *(Copy an existing file like `confidence-boost.json` as a template)*

2.  **Update Index**
    Run the script to register the new game:
    ```bash
    npm run generate-games
    ```

3.  **Test Locally**
    Start the app to verify the new game appears:
    ```bash
    npm run tauri dev
    ```

---

## 🚀 How to Release a New Version

1.  **Update Version Numbers**
    Bump the version (e.g., `1.0.2` -> `1.0.3`) in these two files:
    *   `package.json`
    *   `src-tauri/tauri.conf.json`

2.  **Commit Changes**
    ```bash
    git add .
    git commit -m "feat: add [game-name] and bump version to 1.0.3"
    git push
    ```

3.  **Trigger Release**
    Create and push a new tag matching the version number:
    ```bash
    git tag v1.0.3
    git push origin v1.0.3
    ```

**That's it!** GitHub Actions will automatically build the app and publish the release.
