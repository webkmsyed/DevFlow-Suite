// File: features/todoProvider.js
const vscode = require('vscode');
const DevFlowItem = require('./models/DevFlowItem');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    async getChildren(element) {
        if (!element) return this._getRoots();
        if (element.contextValue === "standardTab" || element.label === "General Workspace") return this._getStandardItems(element);
        if (element.contextValue === "priorityTab") return this._getPriorityItems();
        if (element.contextValue === "recycleTab") return this._getRecycleItems();
        return [];
    }

    _formatTag(taskText) {
        const globalTags = this.context.globalState.get('itemTags', {});
        const rawTag = globalTags[taskText];
        if (!rawTag) return "";
        if (rawTag.toLowerCase().includes("bug") && !rawTag.includes("🔴")) return `[🔴 ${rawTag}]`;
        return `[${rawTag}]`;
    }

    _getRoots() {
        const roots = [
            new DevFlowItem("General Workspace", "comment-discussion", vscode.TreeItemCollapsibleState.Expanded, "standardTab", false),
            new DevFlowItem("Priority Items", "star-full", vscode.TreeItemCollapsibleState.Expanded, "priorityTab", false)
        ];
        
        const userFolders = this.context.globalState.get('userFolders', []);
        const manualTasks = this.context.globalState.get('manualTasks', []);
        const sortOrder = this.context.globalState.get('sortOrder', 'Default (Time Added)');

        let folderItems = userFolders.map(f => {
            const taskCount = manualTasks.filter(t => t.folder === f).length;
            const item = new DevFlowItem(f, "folder-active", vscode.TreeItemCollapsibleState.Expanded, "standardTab", true, f);
            item.description = `(${taskCount} tasks)`;
            item.taskCount = taskCount;
            return item;
        });

        // 🔥 TABS & FOLDERS GLOBAL SORTING FIX
        if (sortOrder === 'Folder Size (High to Low)') {
            folderItems.sort((a, b) => b.taskCount - a.taskCount);
        } else if (sortOrder === 'Folder Size (Low to High)') {
            folderItems.sort((a, b) => a.taskCount - b.taskCount);
        } else if (sortOrder === 'A-Z (Alphabetical)') {
            folderItems.sort((a, b) => a.label.localeCompare(b.label));
        } else if (sortOrder === 'Z-A (Reverse Alphabetical)') {
            folderItems.sort((a, b) => b.label.localeCompare(a.label));
        }

        roots.push(...folderItems);
        roots.push(new DevFlowItem("Recycle Bin", "trash", vscode.TreeItemCollapsibleState.Collapsed, "recycleTab", false));
        return roots;
    }

    _getStandardItems(element) {
        const trashData = this.context.globalState.get('trashData', []);
        const priorityTasks = this.context.globalState.get('priorityTasks', []);
        const fileComments = this.context.globalState.get('fileComments', []);
        const manualTasks = this.context.globalState.get('manualTasks', []);
        
        const searchQuery = this.context.globalState.get('searchQuery', '');
        const activeFilter = this.context.globalState.get('activeFilter', 'All Items');
        const sortOrder = this.context.globalState.get('sortOrder', 'Default (Time Added)');

        const isInTrash = (text) => trashData.some(t => t.text === text);
        const isInPriority = (text) => priorityTasks.some(t => t.text === text);
        const folderName = element.originalText || element.label;

        let filteredScanned = fileComments.filter(c => c.target === (folderName === "General Workspace" ? "General Workspace" : folderName)).filter(c => !isInTrash(c.text) && !isInPriority(c.text));
        let filteredManual = manualTasks.filter(t => t.folder === folderName).filter(t => !isInTrash(t.text) && !isInPriority(t.text));

        // Advanced Filters
        if (activeFilter === 'Manual Tasks Only') filteredScanned = [];
        if (activeFilter === 'Scanned Comments Only') filteredManual = [];
        if (activeFilter === 'Bugs Only (🔴)') {
            filteredScanned = filteredScanned.filter(c => this._formatTag(c.text).includes('🔴'));
            filteredManual = filteredManual.filter(t => this._formatTag(t.text).includes('🔴'));
        }
        if (activeFilter === 'Untagged Items Only') {
            filteredScanned = filteredScanned.filter(c => this._formatTag(c.text) === "");
            filteredManual = filteredManual.filter(t => this._formatTag(t.text) === "");
        }

        // Search Engine
        if (searchQuery) {
            filteredScanned = filteredScanned.filter(c => c.text.toLowerCase().includes(searchQuery) || c.file.toLowerCase().includes(searchQuery));
            filteredManual = filteredManual.filter(t => t.text.toLowerCase().includes(searchQuery));
        }

        let items = [];
        
        filteredManual.forEach(t => {
            const tagStr = this._formatTag(t.text);
            items.push(new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "edit", vscode.TreeItemCollapsibleState.None, "standardTask", true, t.text));
        });
        
        filteredScanned.forEach(c => {
            const tagStr = this._formatTag(c.text);
            const it = new DevFlowItem(tagStr ? `${tagStr} ${c.text}` : c.text, "go-to-file", vscode.TreeItemCollapsibleState.None, "standardTask", false, c.text);
            it.description = `${c.file} (Line ${c.line})`;
            it.parentLabel = folderName; 
            it.command = { command: 'jargon.openFile', title: 'Open File', arguments: [c.file, c.line] };
            items.push(it);
        });

        // 🔥 TASKS GLOBAL SORTING
        if (sortOrder === 'A-Z (Alphabetical)') items.sort((a, b) => a.label.localeCompare(b.label));
        if (sortOrder === 'Z-A (Reverse Alphabetical)') items.sort((a, b) => b.label.localeCompare(a.label));

        return items;
    }

    _getPriorityItems() {
        const priorityTasks = this.context.globalState.get('priorityTasks', []);
        return priorityTasks.map(t => {
            const tagStr = this._formatTag(t.text);
            const it = new DevFlowItem(tagStr ? `${tagStr} ${t.text}` : t.text, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
            it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
            it.description = t.isScanned ? "(Scanned)" : "(Manual)";
            return it;
        });
    }

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