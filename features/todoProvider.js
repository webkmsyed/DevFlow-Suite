// File: features/todoProvider.js
const vscode = require('vscode');
const DevFlowItem = require('./models/DevFlowItem'); // 📦 Model Import Kiya

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    // 🧩 Master Router for UI Elements
    async getChildren(element) {
        if (!element) return this._getRoots();
        if (element.contextValue === "standardTab" || element.label === "General Workspace") return this._getStandardItems(element);
        if (element.contextValue === "priorityTab") return this._getPriorityItems();
        if (element.contextValue === "recycleTab") return this._getRecycleItems();
        return [];
    }

    // 🔥 Helper: Dynamic Tag Formatter
    _formatTag(taskText) {
        const globalTags = this.context.globalState.get('itemTags', {});
        const rawTag = globalTags[taskText];
        if (!rawTag) return "";
        if (rawTag.toLowerCase().includes("bug") && !rawTag.includes("🔴")) return `[🔴 ${rawTag}]`;
        return `[${rawTag}]`;
    }

    // 📂 UI Section 1: Main Folders
    _getRoots() {
        const roots = [
            new DevFlowItem("General Workspace", "comment-discussion", vscode.TreeItemCollapsibleState.Expanded, "standardTab", false),
            new DevFlowItem("Priority Items", "star-full", vscode.TreeItemCollapsibleState.Expanded, "priorityTab", false)
        ];
        const userFolders = this.context.globalState.get('userFolders', []);
        userFolders.forEach(f => roots.push(new DevFlowItem(f, "folder-active", vscode.TreeItemCollapsibleState.Expanded, "standardTab", true, f)));
        roots.push(new DevFlowItem("Recycle Bin", "trash", vscode.TreeItemCollapsibleState.Collapsed, "recycleTab", false));
        return roots;
    }

    // 📋 UI Section 2: Standard Tasks & Comments
    _getStandardItems(element) {
        const trashData = this.context.globalState.get('trashData', []);
        const priorityTasks = this.context.globalState.get('priorityTasks', []);
        const fileComments = this.context.globalState.get('fileComments', []);
        const manualTasks = this.context.globalState.get('manualTasks', []);
        const searchQuery = this.context.globalState.get('searchQuery', '');
        const sortOrder = this.context.globalState.get('sortOrder', 'default');

        const isInTrash = (text) => trashData.some(t => t.text === text);
        const isInPriority = (text) => priorityTasks.some(t => t.text === text);
        const folderName = element.originalText || element.label;

        // Base Filtering
        let filteredScanned = fileComments.filter(c => c.target === (folderName === "General Workspace" ? "General Workspace" : folderName)).filter(c => !isInTrash(c.text) && !isInPriority(c.text));
        let filteredManual = manualTasks.filter(t => t.folder === folderName).filter(t => !isInTrash(t.text) && !isInPriority(t.text));

        // Search Engine
        if (searchQuery) {
            filteredScanned = filteredScanned.filter(c => c.text.toLowerCase().includes(searchQuery));
            filteredManual = filteredManual.filter(t => t.text.toLowerCase().includes(searchQuery));
        }

        let items = [];
        
        // Render Manual Tasks
        filteredManual.forEach(t => {
            const tagStr = this._formatTag(t.text);
            const displayLabel = tagStr ? `${tagStr} ${t.text}` : t.text;
            items.push(new DevFlowItem(displayLabel, "edit", vscode.TreeItemCollapsibleState.None, "standardTask", true, t.text));
        });
        
        // Render Scanned Comments
        filteredScanned.forEach(c => {
            const tagStr = this._formatTag(c.text);
            const displayLabel = tagStr ? `${tagStr} ${c.text}` : c.text;
            const it = new DevFlowItem(displayLabel, "go-to-file", vscode.TreeItemCollapsibleState.None, "standardTask", false, c.text);
            it.description = `${c.file} (Line ${c.line})`;
            it.parentLabel = folderName; 
            items.push(it);
        });

        // Sorting Engine
        if (sortOrder === 'alphabetical') items.sort((a, b) => a.label.localeCompare(b.label));

        return items;
    }

    // ⭐ UI Section 3: Priority Items
    _getPriorityItems() {
        const priorityTasks = this.context.globalState.get('priorityTasks', []);
        return priorityTasks.map(t => {
            const tagStr = this._formatTag(t.text);
            const displayLabel = tagStr ? `${tagStr} ${t.text}` : t.text;
            const it = new DevFlowItem(displayLabel, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
            it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
            it.description = t.isScanned ? "(Scanned)" : "(Manual)";
            return it;
        });
    }

    // 🗑️ UI Section 4: Recycle Bin
    _getRecycleItems() {
        const trashData = this.context.globalState.get('trashData', []);
        return trashData.map(t => {
            const it = new DevFlowItem(t.text, "history", vscode.TreeItemCollapsibleState.None, "recycleTask", false, t.text);
            it.description = t.description || `(from: ${t.deletedFrom})`;
            return it;
        });
    }
}

module.exports = TodoProvider;