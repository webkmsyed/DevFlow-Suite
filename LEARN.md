# Learning Guide

New to VS Code extension development? This guide covers everything you need to understand and contribute to DevFlow Suite.

---

## Prerequisites

| Topic | Resource |
|---|---|
| JavaScript (ES6+) | [javascript.info](https://javascript.info) |
| Node.js basics | [nodejs.org/en/learn](https://nodejs.org/en/learn) |
| VS Code Extension API | [code.visualstudio.com/api](https://code.visualstudio.com/api) |
| Git & GitHub | [docs.github.com/en/get-started](https://docs.github.com/en/get-started) |

---

## VS Code Extension Concepts Used in This Project

### 1. Extension Entry Point

`extension.js` is the main file. It runs when VS Code activates the extension. All features are registered here via their respective modules.

### 2. TreeDataProvider

Used to render the sidebar Explorer tree (folders, tasks, recycle bin, priority tab). See `features/todoProvider.js` and `features/providers/treeRenderer.js`.

### 3. globalState

VS Code's key-value storage that persists across sessions. DevFlow Suite stores tasks, logs, tags, and settings here via `context.globalState.get()` and `context.globalState.update()`.

### 4. Webview Panels

Used for the Timeline and Pins Manager. A Webview is an embedded browser window inside VS Code. See `features/main/timelineOps.js` and `features/main/pinOps.js`.

### 5. WorkspaceEdit

Used to programmatically edit files (e.g., deleting a scanned comment line). See `features/mainWorkspaceTab/subTabTasks/generalTask/generalTaskDelete.js`.

### 6. Commands

All user-facing actions are registered as VS Code commands (`vscode.commands.registerCommand`). Commands are declared in `package.json` under `contributes.commands`.

---

## Project Structure

```
DevFlow-Suite/
├── extension.js              # Entry point
├── features/
│   ├── engine/
│   │   ├── scanner.js        # Scans workspace for // comments
│   │   └── logger.js         # Writes to audit timeline
│   ├── providers/
│   │   ├── todoProvider.js   # TreeDataProvider implementation
│   │   ├── treeRenderer.js   # Builds tree items
│   │   └── dragDropController.js
│   ├── main/
│   │   ├── pinOps.js         # Local pin system
│   │   └── timelineOps.js    # Audit timeline webview
│   ├── mainWorkspaceTab/     # All tab/task operations
│   ├── commands/             # History (undo/redo), exports
│   └── notes/                # Note engine webview
├── resources/                # Icons and GIF previews
└── package.json              # Extension manifest
```

---

## Setting Up Locally

```bash
git clone https://github.com/webkmsyed/DevFlow-Suite.git
cd DevFlow-Suite
npm install
```

Press `F5` in VS Code to open an Extension Development Host with the extension running.

---

## Key Files to Read First

1. `extension.js` — understand what gets registered on activation
2. `features/engine/scanner.js` — how inline comments are detected
3. `features/providers/treeRenderer.js` — how the sidebar is built
4. `features/todoProvider.js` — how VS Code receives tree data

---

## Useful VS Code API References

- [TreeDataProvider](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [WorkspaceEdit](https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit)
- [globalState](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext)
- [Commands](https://code.visualstudio.com/api/extension-guides/command)
