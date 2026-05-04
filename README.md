# DevFlow Suite 🚀

DevFlow Suite is a powerful, integrated workspace management extension for VS Code designed to help developers stay organized, track tasks, and manage code changes effectively without leaving the editor.

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