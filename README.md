<div align="center">
  <img src="resources/icon.png" alt="DevFlow Suite" width="100" /><br><br>
  <h2>DevFlow Suite</h2>
  <p>A workspace management extension for Visual Studio Code.<br>Task tracking, local file pinning, audit timelines, and a built-in recycle bin — all local, all private.</p>

  <a href="https://marketplace.visualstudio.com/items?itemName=jargoniseasy.devflow-suite"><img src="https://img.shields.io/visual-studio-marketplace/v/jargoniseasy.devflow-suite?color=0066CC&label=VS%20Code%20Marketplace" alt="Marketplace Version"></a>
  <a href="https://github.com/webkmsyed/DevFlow-Suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://github.com/webkmsyed/DevFlow-Suite"><img src="https://img.shields.io/badge/open%20source-GitHub-181717?logo=github" alt="GitHub"></a>
  <br><br>
  A <a href="https://jargoniseasy.com">jargoniseasy.com</a> product &nbsp;·&nbsp; Built by <a href="https://webkmsyed.com">Syed Khishamuddin (webkmsyed)</a>
</div>

---

## Preview

**Workspace and Task Manager**

![DevFlow Suite Preview](resources/devflow-suite-preview.gif)

**Local Pin System**

![Pin System Preview](resources/devflow-suite-pin-preview.gif)

**Activity Timeline**

![Timeline Preview](resources/devflow-suite-timeline-preview.gif)

---

## Features

- **Task Explorer**: A sidebar workspace manager with custom folders, priority tab, scanned inline comments, notes, tags, and a recycle bin.
- **Smart Code Scanning**: Automatically scans your workspace for inline `//` comments and organizes them into tabs based on folder name matching.
- **Local Pin System**: Snapshot any file at any point. Compare past states with the current file using a side-by-side diff view.
- **Activity Timeline**: Every extension action is logged with timestamps, file paths, and line references. Export as JSON, CSV, TXT, or PDF.
- **Recycle Bin**: Deleted tasks and folders move to a recycle bin. Restore individually, restore all, or permanently delete.
- **Priority Tab**: Pin any task to a dedicated priority view regardless of which folder it belongs to.
- **Note Engine**: Attach private markdown notes to any task without modifying your codebase.
- **Tagging System**: Tag and filter tasks and pins by category or status.
- **100% Local**: No accounts, no telemetry, no data leaves your machine.

---

## Getting Started

1. Install **DevFlow Suite** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jargoniseasy.devflow-suite).
2. Click the DevFlow icon in the Activity Bar to open the Explorer.
3. Tasks from your inline `//` comments are scanned automatically on file save.
4. Use the pin button in the editor title bar to snapshot the current file state.

---

## Task Explorer

Manage all your workspace tasks from a structured sidebar:

- Create custom folders to group related tasks.
- Drag and drop tasks between folders.
- Move tasks to the Priority Tab for immediate focus.
- Delete tasks to the Recycle Bin and restore them later.
- Attach notes and tags to individual tasks.

---

## Local Pin System

Never lose an intermediate code state before committing to Git.

- Save automatic snapshots of actively edited files on a configurable interval.
- View all pins in a clean, filterable panel with star and tag support.
- Click **View Code** on any pin to open a side-by-side diff against the current file.

---

## Activity Timeline

Every extension action generates a log entry with a timestamp, file path, and line reference.

- Filter logs by type, date range, or keyword.
- Export the full timeline as CSV, JSON, TXT, or print-ready HTML/PDF.

---

## Commands

| Command | Description |
|---|---|
| `DevFlow: Pin Current State` | Manually snapshot the active file |
| `DevFlow: View Local Pins` | Open the Pins Manager panel |
| `DevFlow: Open Timeline` | View the activity audit log |
| `DevFlow: Export Logs` | Export the timeline to CSV / JSON / PDF |
| `DevFlow: Search Tasks` | Search across all workspace tasks |
| `DevFlow: Scan / Refresh` | Re-scan the workspace for inline comments |

---

## Keyboard Shortcuts

| Action | Windows / Linux | macOS |
|---|---|---|
| Pin Current File State | `Ctrl+Shift+P` twice | `Cmd+Shift+P` twice |
| View Local Pins Panel | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Open Activity Timeline | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Search Tasks | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Scan / Refresh Workspace | `Ctrl+Shift+R` | `Cmd+Shift+R` |

> All shortcuts can be customized via **File > Preferences > Keyboard Shortcuts**.

---

## Contributing

Contributions, issues, and feature requests are welcome.

**Repository:** [github.com/webkmsyed/DevFlow-Suite](https://github.com/webkmsyed/DevFlow-Suite)

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, project structure, and contribution guidelines.

---

## License

MIT License. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**DevFlow Suite** is a <a href="https://jargoniseasy.com">jargoniseasy.com</a> open-source project.

### Developer

| | |
|---|---|
| Website | [webkmsyed.com](https://webkmsyed.com) |
| GitHub | [github.com/webkmsyed](https://github.com/webkmsyed/) |
| LinkedIn | [linkedin.com/in/webkmsyed](https://www.linkedin.com/in/webkmsyed/) |
| X (Twitter) | [x.com/webkmsyed](https://x.com/webkmsyed) |
| Bluesky | [bsky.app/profile/webkmsyed.com](https://bsky.app/profile/webkmsyed.com) |
| YouTube | [youtube.com/@webkmsyed](https://www.youtube.com/@webkmsyed) |
| Dev.to | [dev.to/webkmsyed](https://dev.to/webkmsyed) |
| Daily.dev | [app.daily.dev/webkmsyed](https://app.daily.dev/webkmsyed) |
| Instagram | [instagram.com/webkmyed](https://instagram.com/webkmyed) |
| Threads | [@webkmsyed](https://www.threads.net/@webkmsyed) |

### Project / Brand

| | |
|---|---|
| Website | [jargoniseasy.com](https://jargoniseasy.com) |
| GitHub | [github.com/jargoniseasy](https://github.com/jargoniseasy/) |
| LinkedIn | [linkedin.com/in/jargoniseasy](https://www.linkedin.com/in/jargoniseasy/) |
| X (Twitter) | [x.com/jargoniseasy](https://x.com/jargoniseasy) |
| Bluesky | [bsky.app/profile/jargoniseasy.com](https://bsky.app/profile/jargoniseasy.com) |
| YouTube | [youtube.com/@jargoniseasy](https://www.youtube.com/@jargoniseasy) |
| Dev.to | [dev.to/jargoniseasy](https://dev.to/jargoniseasy) |
| Daily.dev | [app.daily.dev/jargoniseasy](https://app.daily.dev/jargoniseasy) |
| Instagram | [instagram.com/jargoniseasy](https://instagram.com/jargoniseasy) |
| Threads | [@jargoniseasy](https://www.threads.net/@jargoniseasy) |

<br>
<sub><a href="https://github.com/webkmsyed/DevFlow-Suite">Open Source on GitHub</a> &nbsp;·&nbsp; <a href="https://marketplace.visualstudio.com/items?itemName=jargoniseasy.devflow-suite">VS Code Marketplace</a></sub>

</div>
