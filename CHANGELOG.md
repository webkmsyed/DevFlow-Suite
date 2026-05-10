# Changelog

All notable changes to **DevFlow Suite** are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-05-10

Initial public release.

### Added

- **Task Explorer**: Sidebar workspace manager with support for custom folders, priority tab, scanned inline comments, recycle bin, notes, and tags.
- **Smart Code Scanning**: Automatically extracts inline `//` comments from the workspace and assigns them to matching folders or General Workspace.
- **Local Pin System**:
  - Manual and automatic file state snapshots.
  - Filterable, sortable Webview panel to manage all pins.
  - Star and tag support for quick retrieval.
  - One-click export of pins to a local directory.
  - Side-by-side diff view comparing any pinned state against the current file.
- **Activity Timeline**:
  - Centralized action log with timestamps, file paths, and line references.
  - Export as CSV, JSON, TXT, or print-ready HTML/PDF.
- **Recycle Bin**: Soft-delete with individual restore, restore all, and permanent delete support.
- **Priority Tab**: Pin any task from any folder to a dedicated priority view.
- **Note Engine**: Attach private markdown notes to individual tasks.
- **Tagging System**: Apply and filter custom tags across tasks and pins.
- **Undo/Redo System**: Revert actions within the task manager.
- **Drag and Drop**: Reorder tasks and move them between folders.

### Fixed

- Stabilized command registrations to prevent duplicate registration errors on extension reload.
- Resolved Webview persistence issues ensuring UI state remains consistent with VS Code theme variables.
- Fixed absolute/relative path handling on Windows for `fs.copyFileSync` and `vscode.diff` operations.
- Corrected scanner race conditions where deleted comments were re-surfacing after a file save.
- Fixed line-number shift bug causing adjacent comments to be hidden after a deletion.
- Resolved recycle bin state sync issues on folder-level restore and permanent delete operations.

---

## Links

- [GitHub Repository](https://github.com/webkmsyed/DevFlow-Suite)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jargoniseasy.devflow-suite)
- [jargoniseasy.com](https://jargoniseasy.com)