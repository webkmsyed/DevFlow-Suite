// File: features/todoProvider.js
const vscode = require('vscode');
const { getRoots, getStandardItems, getPriorityItems, getRecycleItems } = require('./providers/treeRenderer');
const DragDropController = require('./providers/dragDropController'); // 🔥 Import Controller

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        // 🔥 Naya Modular Controller Initialize Kiya
        const controller = new DragDropController(context, this);
        this.dragMimeTypes = controller.dragMimeTypes;
        this.dropMimeTypes = controller.dropMimeTypes;
        this.handleDrag = controller.handleDrag.bind(controller);
        this.handleDrop = controller.handleDrop.bind(controller);
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    async getChildren(element) {
        if (!element) return getRoots(this.context);
        if (element.contextValue === "standardTab" || element.label === "General Workspace") {
            return getStandardItems(this.context, element.originalText || element.label);
        }
        if (element.contextValue === "priorityTab") return getPriorityItems(this.context);
        if (element.contextValue === "recycleTab") return getRecycleItems(this.context);
        return [];
    }
}

module.exports = TodoProvider;