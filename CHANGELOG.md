# Changelog

All notable changes to the **DevFlow Suite** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Initial Release

### Added
- **Todo Explorer**: Introduced a comprehensive sidebar view to manage standard tasks, priority tasks, and deleted items via a recycle bin.
- **Smart Code Scanning**: Feature to automatically extract inline `// TODO` and `// FIXME` comments into the workspace tracking system.
- **Local Pin System**: 
  - Ability to manually pin the current state of a file.
  - Background auto-pinning functionality triggered by file edits.
  - Modern, minimal (Vercel-inspired) Webview interface to view and manage all project pins.
  - Star system to favorite pins.
  - Tag system to categorize and quickly search pins.
  - One-click export features to dump specific or all pins to a local directory without nested folders.
  - Git-style Side-by-Side Diff View to effortlessly compare past pinned states with current active editor code.
- **Audit Timeline**: 
  - Centralized timeline logging to track extension actions (creation, editing, deletion of tasks/pins).
  - Data export functionalities allowing users to export timelines as CSV, JSON, TXT, or Print-to-PDF via HTML preview.
- **Notes Engine**: Associate markdown notes directly with DevFlow tasks.
- **Undo/Redo System**: Seamlessly revert actions performed within the task manager.

### Fixed
- Stabilized command registrations to prevent `command already registered` errors.
- Rectified Webview persistence bugs ensuring state matches the VS Code theme variables.
- Fixed absolute/relative path disparities for Windows systems ensuring `fs.copyFileSync` and `vscode.diff` execute reliably.