# Contributing to DevFlow Suite

First off, thank you for considering contributing to DevFlow Suite! It's people like you that make DevFlow such a powerful tool for developers.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd DevFlow-Suite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the Extension:**
   - Open the project in VS Code.
   - Press `F5` to open a new VS Code window with your extension loaded.

## Project Structure

DevFlow Suite follows a modular, feature-based architecture (similar to modern frontend systems) to ensure scalable maintainability:

```text
📦 DevFlow-Suite
 ┣ 📂 features                  # Core extension capabilities
 ┃ ┣ 📂 commands                # Global VS Code command registrations (History, Workspaces)
 ┃ ┣ 📂 engine                  # Core logic, Scanners, and Loggers
 ┃ ┣ 📂 main                    # Primary logic (PinOps, ExportOps, TimelineOps, Search/Filter/Sort)
 ┃ ┣ 📂 mainWorkspaceTab        # Task Tree UI components and sub-tabs
 ┃ ┣ 📂 models                  # Data models (DevFlowItem)
 ┃ ┣ 📂 notes                   # Markdown note engine for tasks
 ┃ ┣ 📂 providers               # Tree Data Providers and Drag & Drop controllers
 ┃ ┗ 📜 todoProvider.js         # Main tree data provider
 ┣ 📂 resources                 # Static assets (icons, SVGs)
 ┣ 📂 test                      # Unit tests and integration tests
 ┣ 📜 extension.js              # Extension entry point
 ┣ 📜 package.json              # Extension manifest and contributions
 ┗ 📜 README.md
```

## Guidelines

- **Code Style:** Please ensure your code follows the existing style conventions. We use ESLint to maintain code quality.
- **Commit Messages:** Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: added new tag system`, `fix: resolved path separator bug on windows`).
- **Webviews:** When editing Webviews (like `pinOps.js` or `timelineOps.js`), strive for minimal, modern UI designs (Vercel-inspired). Avoid inline styles where possible unless dynamic, and utilize CSS variables for theme (`light`/`dark`) synchronization.
- **Testing:** If you add new functionality, please try to include basic tests inside the `test/` directory.

## Submitting Pull Requests

1. Fork the repository and create your feature branch (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m 'feat: Add some amazing feature'`).
3. Push to the branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request.

Once again, thank you for your contributions!
