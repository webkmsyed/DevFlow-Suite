<div align="center">
  <img src="resources/icon.png" alt="DevFlow Suite Logo" width="120" />
  <h1>DevFlow Suite</h1>
  <p>A powerful, all-in-one workspace manager for VS Code — task tracking, local file pinning, audit timelines, and more.</p>
  <a href="https://marketplace.visualstudio.com/items?itemName=webkmsyed.devflow-suite"><img src="https://img.shields.io/visual-studio-marketplace/v/webkmsyed.devflow-suite?color=0066CC&label=VS%20Code%20Marketplace" alt="Marketplace"></a>
  <a href="https://github.com/webkmsyed/DevFlow-Suite/blob/main/CHANGELOG.md"><img src="https://img.shields.io/badge/changelog-v1.0.0-green" alt="Changelog"></a>
  <a href="https://github.com/webkmsyed/DevFlow-Suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <br><br>
  <strong>Built by <a href="https://webkmsyed.com">webkmsyed.com</a> · Part of the <a href="https://jargoniseasy.com">jargoniseasy.com</a> ecosystem</strong>
</div>

---

## ✨ Features

- **Todo & Task Explorer**: A comprehensive sidebar view to manage general tasks, priority tasks, and a robust recycle bin system.
- **Smart Scanning**: Automatically scans your workspace for inline comments (`// TODO:`, `// FIXME:`) and organizes them directly into DevFlow.
- **Local Pin System 📌**: Take snapshots of files manually or automatically. Compare any snapshot against the current file using a Git-style side-by-side diff view.
- **Timeline & Audit Logs ⏱️**: A dynamic timeline of every extension action. Export as JSON, CSV, TXT, or a print-ready HTML/PDF report.
- **Export Capabilities 📥**: Export your pins and tasks effortlessly for historical records or sharing.
- **Tagging & Starring ⭐**: Categorize pinned snapshots with custom tags and favorites for instant retrieval.
- **Note Engine 📝**: Attach markdown notes directly to tasks without cluttering your codebase.
- **Dark & Light Themes 🌗**: Minimal, modern UI synced with your VS Code theme.
- **100% Local & Private** — no data ever leaves your machine.

---

## 🚀 Getting Started

1. **Install** DevFlow Suite from the VS Code Marketplace.
2. **Open the Explorer**: Click the DevFlow icon in the Activity Bar.
3. **Pin a File**: Click the `📌` icon in the editor title bar, or let auto-pin snapshot your changes automatically.

---

## 📌 Local Pin System

Never lose an intermediate code state before committing to Git!

- Saves automatic snapshots of actively edited files on a configurable frequency.
- Clean Webview panel to view, filter, sort, tag, star, and export your pins.
- **Diff View**: Click "View Code" on any pin to instantly open a Git-style side-by-side diff against your current file.

<!-- 
  TODO: Replace the placeholder below with a real screen recording GIF.
  Recommended tool: https://www.screentogif.com/ (free, Windows)
  Steps: Record yourself pinning a file → viewing pins → clicking "View Code" to see the diff.
  Save as `docs/demo-pins.gif` and update the path below.
-->
> 📸 **GIF coming soon** — Pin a file and compare snapshots with one click.

---

## ⏱️ Activity Timeline

Every action (task creation, moves, deletes, pins) is logged with timestamps, file paths, and line references.

<!-- 
  TODO: Replace with a real screenshot or GIF of the Timeline Webview.
  Save as `docs/demo-timeline.gif` and update the path below.
-->
> 📸 **Screenshot coming soon** — Filter, export, and audit every workspace action.

---

## 🛠️ Commands

| Command | Description |
|---|---|
| `DevFlow: Pin Current State` | Manually snapshot the active file |
| `DevFlow: View Local Pins` | Open the Pins Manager panel |
| `DevFlow: Open Timeline` | View the activity audit log |
| `DevFlow: Export Logs` | Export the timeline to CSV / JSON / PDF |
| `DevFlow: Search Tasks` | Search across all workspace tasks |
| `DevFlow: Scan / Refresh` | Re-scan the workspace for inline comments |

---

## ⌨️ Keyboard Shortcuts

| Action | Windows / Linux | macOS |
|---|---|---|
| Pin Current File State | `Ctrl+Shift+P` twice | `Cmd+Shift+P` twice |
| View Local Pins Panel | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Open Activity Timeline | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Search Tasks | `Ctrl+Shift+F` (in Explorer) | `Cmd+Shift+F` |
| Scan / Refresh Workspace | `Ctrl+Shift+R` (in Explorer) | `Cmd+Shift+R` |

> All shortcuts can be customized via **File → Preferences → Keyboard Shortcuts** in VS Code.

---

## ⚙️ Extension Settings

Customize DevFlow via the standard VS Code settings interface. Adjust auto-pin frequency, sorting preferences, and more directly from the Pin Manager panel inside VS Code.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, project structure, and contribution guidelines.

**Repository:** [https://github.com/webkmsyed/DevFlow-Suite](https://github.com/webkmsyed/DevFlow-Suite)

---

## 📜 License

MIT License — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <img src="resources/icon.png" alt="DevFlow Suite" width="48" /><br>
  <strong>DevFlow Suite</strong><br>
  <a href="https://webkmsyed.com">webkmsyed.com</a> · <a href="https://jargoniseasy.com">jargoniseasy.com</a>
</div>


## ✨ Features

- **Todo & Task Explorer**: A comprehensive sidebar view to manage your general tasks, priority tasks, and a robust recycle bin system.
- **Smart Scanning**: Automatically scans your workspace for inline comments (`// TODO:`, `// FIXME:`) and organizes them directly into your DevFlow task manager.
- **Local Pin System 📌**: Take snapshots of your files manually or automatically at a set frequency. Easily compare your current code with a pinned snapshot using a side-by-side Git-style diff view.
- **Timeline & Audit Logs ⏱️**: View a rich, dynamic timeline of every action performed in the extension. Easily export logs into JSON, CSV, TXT, or beautiful HTML/PDF reports.
- **Export Capabilities 📥**: Export your pins and tasks effortlessly to keep historical records or share your workflows.
- **Tagging & Starring ⭐**: Categorize and prioritize your pinned local code snapshots with custom tags and favorites for instant retrieval.
- **Note Engine 📝**: Attach rich markdown notes directly to your tasks to maintain context without muddying your codebase.
- **Dark & Light Themes 🌗**: Fully integrated with your VS Code themes, offering a modern, minimal UI similar to premium web apps (Vercel-style aesthetics).

## 🚀 Getting Started

1. **Installation**: Download the DevFlow Suite extension from the VS Code Marketplace and install it.
2. **Accessing the Explorer**: Click on the DevFlow icon in the Activity Bar to open the Todo Explorer.
3. **Pinning Files**: Open any file, click the `Pin Current State` icon in the top right of your editor, or let the auto-pin timer snapshot your changes for you.

## 📌 Local Pin System
Never lose track of intermediate states before committing to Git!
- Automatically saves snapshots of your actively edited files (e.g., every 5 minutes).
- Provides a clean Webview interface to view, filter, sort, tag, and export your file pins.
- **Diff View**: Click "View Code" on any pin to instantly compare your current workspace file against the past snapshot in a Git-style split view.

## 🛠️ Commands
Use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) to access DevFlow features:
- `DevFlow: View Local Pins`
- `DevFlow: Pin Current State`
- `DevFlow: Open Timeline`
- `DevFlow: Export Logs`
- `DevFlow: Search Tasks`

## ⌨️ Keyboard Shortcuts
| Action | Windows / Linux | macOS |
|---|---|---|
| Pin Current File State | `Ctrl+Shift+P` twice | `Cmd+Shift+P` twice |
| View Local Pins Panel | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Open Activity Timeline | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Search Tasks | `Ctrl+Shift+F` (in Explorer) | `Cmd+Shift+F` |
| Scan / Refresh Workspace | `Ctrl+Shift+R` (in Explorer) | `Cmd+Shift+R` |

> All shortcuts can be customized via **File → Preferences → Keyboard Shortcuts** in VS Code.

## ⚙️ Extension Settings
Customize DevFlow to your liking via the standard VS Code settings interface. Adjust your auto-pin frequency, sorting preferences, and more.

## 📸 Screenshots & Previews
> **Pro Tip:** Add a few GIFs or images here showing your extension in action! 
> 
> *Suggested visual additions:*
> - *A GIF of pinning a file and opening the Git-style Diff view.*
> - *A screenshot of the beautiful Vercel-style Local Pins Manager.*
> - *A screenshot showing the main DevFlow Todo explorer and Timeline.*

![DevFlow Preview](https://via.placeholder.com/800x400.png?text=DevFlow+Suite+Preview)

## 🤝 Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to build, test, and contribute to this repository.

## 📜 License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ by <a href="https://webkmsyed.com">webkmsyed.com</a></strong><br>
  Part of the <a href="https://jargoniseasy.com">jargoniseasy.com</a> ecosystem.
</div>