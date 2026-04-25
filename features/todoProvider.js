// File: features/todoProvider.js
const vscode = require('vscode');

// 📦 Saara lamba logic yahan se mangwa rahe hain!
const { getRoots, getStandardItems, getPriorityItems, getRecycleItems } = require('./providers/treeRenderer');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    // 🧩 Clean Router: Decide karta hai screen pe kya dikhana hai
    async getChildren(element) {
        if (!element) {
            return getRoots(this.context);
        }
        
        if (element.contextValue === "standardTab" || element.label === "General Workspace") {
            const folderName = element.originalText || element.label;
            return getStandardItems(this.context, folderName);
        }
        
        if (element.contextValue === "priorityTab") {
            return getPriorityItems(this.context);
        }
        
        if (element.contextValue === "recycleTab") {
            return getRecycleItems(this.context);
        }
        
        return [];
    }
}

module.exports = TodoProvider;