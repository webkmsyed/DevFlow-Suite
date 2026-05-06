# Product Requirements Document (PRD): DevFlow Suite

## 1. Project Overview
**Product Name:** DevFlow Suite  
**Publisher:** jargoniseasy  
**Tagline:** Zero-config VS Code extension for task management, local file snapshots, and audit timelines.  
**Vision:** To provide a localized, private, and powerful workspace management tool for developers that eliminates context switching and prevents loss of intermediate code states.

---

## 2. Problem Statement
Developers often struggle with:
1. **Context Switching:** Moving between VS Code, Notion, and Jira to track small daily tasks.
2. **Intermediate Code Loss:** Git is great for commits, but local changes made between commits (experimental code) are often lost if not carefully managed.
3. **Scattered Todos:** `// TODO` comments get lost in large codebases.
4. **Lack of Accountability:** No easy way to audit local workspace actions (task moves, deletions, pins).

---

## 3. Target Audience
- **Individual Developers:** Wanting a lightweight, local-first task manager.
- **Experimental Coders:** Need to "pin" versions of files before making major local changes.
- **Freelancers/Audit-focused Devs:** Need activity logs to track work progress.

---

## 4. Functional Requirements

### 4.1. Workspace Task Explorer
- **Sidebar Integration:** A primary view in the VS Code Activity Bar.
- **Categorization:**
    - **General Workspace:** Main entry point for todos.
    - **User Folders:** Customizable folders for project-specific organization.
    - **Priority:** A dedicated view for "Starring" urgent tasks.
    - **Recycle Bin:** Safeguard for deleted tasks with restore capability.

### 4.2. Smart Comment Scanning
- **Automatic Extraction:** Detects `// TODO` and `// FIXME` in real-time.
- **Reactive Engine:** Re-scans on file save to keep the explorer updated.
- **Intelligent Filtering:** Prevents trashed/deleted comments from re-appearing (ghost-restore protection).

### 4.3. Local Pin System (Snapshotting)
- **Manual Pinning:** Snapshots the current editor state with one click.
- **Auto-Pinning:** Configurable timer to save snapshots periodically.
- **Git-Style Diff:** Side-by-side comparison between the current workspace file and a historical pin.
- **Metadata:** Support for tagging and starring specific pins.

### 4.4. Activity Timeline (Audit Logs)
- **Event Tracking:** Logs task creation, moves, deletions, and pins.
- **Filtering:** Search and filter logs by date or action type.
- **Export Formats:** Support for JSON, CSV, TXT, and Print-ready HTML/PDF.

### 4.5. Note Engine
- **Rich Text:** Support for Markdown notes attached to any task.
- **Persistence:** Notes stored in VS Code `globalState` for cross-session availability.

---

## 5. Technical Requirements

### 5.1. Tech Stack
- **Core:** Node.js, VS Code Extension API.
- **UI:** Webview API (HTML/CSS/JS) with Vercel-inspired minimal aesthetic.
- **Storage:** 
    - `globalState`: For logs, notes, and task metadata.
    - Local Filesystem (`.devflow-pins/`): For binary/text code snapshots.
- **Security:** 100% Local-first. No external API calls, no telemetry, no cloud sync.

### 5.2. Performance
- **Asynchronous Processing:** Scanning and logging must not block the main editor thread.
- **Mutex Logging:** Sequential write logic to prevent log corruption during rapid events.

---

## 6. Design & UX Philosophy
- **Minimalism:** No unnecessary borders or heavy icons. Use descriptive text buttons.
- **Consistency:** Seamless integration with VS Code's Active Theme (Dark/Light).
- **Zero Configuration:** Works out of the box without requiring external databases or accounts.

---

## 7. Future Roadmap

### Phase 1: Advanced Code Management (Short-term)
- **V2.0: Multi-Pin Diffing:** Allow users to compare two different historical snapshots directly without involving the current workspace file.
- **V2.1: File Evolution Slider:** A visual slider in the Webview to quickly scrub through the history of a file's pins, seeing it evolve over time.
- **V2.2: Batch Pinning:** One-click to pin all currently open editors or an entire folder's active changes.

### Phase 2: Collaboration & Productivity (Mid-term)
- **V3.0: Integrated Kanban Board:** Transform user folders into a visual Kanban board within the VS Code Webview for better project management.
- **V3.1: Story Points & Estimation:** Add fields for effort estimation on tasks to track project velocity.
- **V3.2: Exportable Workspace Bundles:** Package all tasks, notes, and pins for a project into a single encrypted file to share with teammates.

### Phase 3: AI & Intelligence (Long-term)
- **V4.0: AI-Powered Pin Summaries:** Use local LLMs to automatically generate "What changed?" summaries for every pin.
- **V4.1: Smart Task Suggestion:** AI analyzes code changes and suggests creating new tasks or notes automatically.
- **V4.2: Automated Tagging:** System automatically tags pins based on the type of change (e.g., `bugfix`, `refactor`, `feature-add`).

### Phase 4: Ecosystem & Sync
- **V5.0: Cloud-Sync (Opt-in):** Encrypted synchronization of tasks and notes across multiple machines using VS Code Settings Sync.
- **V5.1: Mobile Companion App:** View your DevFlow tasks and project notes on the go via a secure mobile interface.

---

## 8. Success Metrics
- **Retention:** User continues to use the Pin system over a 30-day period.
- **Utility:** Number of "Diff Views" opened (indicates reliance on snapshots).
- **Performance:** Extension activation time remains under 500ms.
- **Engagement:** Frequency of manual task creation vs. auto-scanned tasks.
