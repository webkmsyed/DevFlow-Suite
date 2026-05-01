// File: features/todoProvider.js
const vscode = require('vscode');
const { 
    getRoots, 
    getStandardItems, 
    getPriorityItems, 
    getPriorityFolderItems, 
    getRecycleItems, 
    getSearchResults 
} = require('./providers/treeRenderer');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.searchQuery = "";
    }

    refresh() { this._onDidChangeTreeData.fire(); }

    search(query) {
        this.searchQuery = query;
        this.refresh();
    }

    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        
        treeItem.contextValue = element.contextValue || ""; 
        treeItem.iconPath = element.iconPath;
        treeItem.id = element.id ? String(element.id) : undefined;

        // --- 🏷️ Tag Visibility (Standard) ---
        const tags = this.context.globalState.get('itemTags', {}) || {};
        const itemKey = element.id || `${element.file}:${element.line}`;
        const folderKey = treeItem.contextValue === "standardTab" ? `folder:${element.originalText}` : itemKey;
        const activeTag = tags[folderKey] || tags[itemKey];

        if (activeTag) {
            treeItem.description = `[${activeTag}]`;
        } else if (element.description) {
            treeItem.description = element.description;
        }

        // --- 🔴 Priority Specific: Tags at the START (Emoji + Text) ---
        if (treeItem.contextValue.includes("priority")) {
            const priTags = this.context.globalState.get('priorityItemTags', {}) || {};
            const id = element.id || `${element.file}:${element.line}`;
            if (priTags[id]) {
                treeItem.label = `${priTags[id]} ${element.label}`; 
            }
        }

        // Click logic
        if (element.file) {
            treeItem.command = {
                command: 'jargon.openFile',
                title: "Open File",
                arguments: [element.file, element.line]
            };
        }

        return treeItem;
    }

    async getChildren(element) {
        if (!element && this.searchQuery) return getSearchResults(this.context, this.searchQuery);
        if (!element) return getRoots(this.context);

        if (element.contextValue === "priorityTab") return getPriorityItems(this.context);
        if (element.contextValue === "priorityFolder") return getPriorityFolderItems(this.context, element.originalText);
        if (element.contextValue === "standardTab" || element.label === "General Workspace") {
            return getStandardItems(this.context, element.originalText || element.label);
        }
        if (element.contextValue === "recycleTab") return getRecycleItems(this.context);
        
        return [];
    }
}

module.exports = TodoProvider;