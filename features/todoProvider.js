// File: features/todoProvider.js
const vscode = require('vscode');

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
        const trashData = this.context.globalState.get('trashData', []);
        const priorityTasks = this.context.globalState.get('priorityTasks', []);
        const globalTags = this.context.globalState.get('itemTags', {}); 

        const isInTrash = (text) => trashData.some(t => t.text === text);
        const isInPriority = (text) => priorityTasks.some(t => t.text === text);

        // 🔥 Dynamic Tag Formatter (Case Insensitive BUG with Red Dot)
        const formatTag = (taskText) => {
            const rawTag = globalTags[taskText];
            if (!rawTag) return "";
            if (rawTag.toLowerCase().includes("bug") && !rawTag.includes("🔴")) {
                return `[🔴 ${rawTag}]`;
            }
            return `[${rawTag}]`;
        };

        if (!element) {
            const roots = [
                new DevFlowItem("General Workspace", "comment-discussion", vscode.TreeItemCollapsibleState.Expanded, "standardTab", false),
                new DevFlowItem("Priority Items", "star-full", vscode.TreeItemCollapsibleState.Expanded, "priorityTab", false)
            ];
            const userFolders = this.context.globalState.get('userFolders', []);
            userFolders.forEach(f => roots.push(new DevFlowItem(f, "folder-active", vscode.TreeItemCollapsibleState.Expanded, "standardTab", true, f)));
            roots.push(new DevFlowItem("Recycle Bin", "trash", vscode.TreeItemCollapsibleState.Collapsed, "recycleTab", false));
            return roots;
        }

        // 1. STANDARD TABS
        if (element.contextValue === "standardTab" || element.label === "General Workspace") {
            const fileComments = this.context.globalState.get('fileComments', []);
            const manualTasks = this.context.globalState.get('manualTasks', []);
            
            const folderName = element.originalText || element.label;

            const filteredScanned = fileComments.filter(c => c.target === (folderName === "General Workspace" ? "General Workspace" : folderName)).filter(c => !isInTrash(c.text) && !isInPriority(c.text));
            const filteredManual = manualTasks.filter(t => t.folder === folderName).filter(t => !isInTrash(t.text) && !isInPriority(t.text));

            const items = [];
            filteredManual.forEach(t => {
                const tagStr = formatTag(t.text);
                const displayLabel = tagStr ? `${tagStr} ${t.text}` : t.text; // Tag ab START mein hai!
                items.push(new DevFlowItem(displayLabel, "edit", vscode.TreeItemCollapsibleState.None, "standardTask", true, t.text));
            });
            
            filteredScanned.forEach(c => {
                const tagStr = formatTag(c.text);
                const displayLabel = tagStr ? `${tagStr} ${c.text}` : c.text; // Tag ab START mein hai!
                const it = new DevFlowItem(displayLabel, "go-to-file", vscode.TreeItemCollapsibleState.None, "standardTask", false, c.text);
                it.description = `${c.file} (Line ${c.line})`;
                it.parentLabel = folderName; 
                items.push(it);
            });
            return items;
        }

        // 2. PRIORITY TAB
        if (element.contextValue === "priorityTab") {
            return priorityTasks.map(t => {
                const tagStr = formatTag(t.text);
                const displayLabel = tagStr ? `${tagStr} ${t.text}` : t.text;
                const it = new DevFlowItem(displayLabel, "star", vscode.TreeItemCollapsibleState.None, "priorityTask", true, t.text);
                it.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.orange')); 
                it.description = t.isScanned ? "(Scanned)" : "(Manual)";
                return it;
            });
        }

        // 3. RECYCLE BIN
        if (element.contextValue === "recycleTab") {
            return trashData.map(t => {
                const it = new DevFlowItem(t.text, "history", vscode.TreeItemCollapsibleState.None, "recycleTask", false, t.text);
                it.description = t.description || `(from: ${t.deletedFrom})`;
                return it;
            });
        }
        return [];
    }
}

class DevFlowItem extends vscode.TreeItem {
    // 🔥 Naya originalText parameter add kiya taaki backend data match ho sake
    constructor(label, iconName, collapsibleState, contextValue, isUser, originalText = null) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.originalText = originalText || label; 
        this.iconPath = new vscode.ThemeIcon(iconName, isUser ? new vscode.ThemeColor('gitDecoration.addedResourceForeground') : undefined);
    }
}

module.exports = TodoProvider;