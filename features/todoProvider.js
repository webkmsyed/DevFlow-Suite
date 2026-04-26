// File: features/todoProvider.js
const vscode = require('vscode');
const { getRoots, getStandardItems, getPriorityItems, getRecycleItems } = require('./providers/treeRenderer');
const { recordHistory } = require('./commands/historyOps'); // 📸 Time Machine!

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        // 🖱️ DRAG & DROP: MIME Types Define Kiye
        this.dragMimeTypes = ['application/vnd.code.tree.devflow'];
        this.dropMimeTypes = ['application/vnd.code.tree.devflow'];
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

    // ==========================================
    // 🖱️ DRAG & DROP LOGIC ENGINE
    // ==========================================

    // 1. Task Pakadne Par (Drag Start)
    handleDrag(source, dataTransfer, token) {
        dataTransfer.set('application/vnd.code.tree.devflow', new vscode.DataTransferItem(source[0]));
    }

    // 2. Task Chhodne Par (Drop Action)
    async handleDrop(target, dataTransfer, token) {
        const transferItem = dataTransfer.get('application/vnd.code.tree.devflow');
        if (!transferItem || !target) return;
        
        const sourceItem = transferItem.value; // Jo task uthaya
        const targetFolder = target.originalText || target.label; // Jis folder pe rakha
        const sourceText = sourceItem.originalText || sourceItem.label;

        // Rule A: Folder drag nahi ho sakte
        if (['standardTab', 'priorityTab', 'recycleTab'].includes(sourceItem.contextValue)) {
            vscode.window.showWarningMessage("DevFlow-Suite: Folders cannot be dragged!");
            return;
        }

        recordHistory(this.context); // 🔥 SNAPSHOT TAKEN FOR UNDO!

        let manualTasks = this.context.globalState.get('manualTasks', []);
        let priorityTasks = this.context.globalState.get('priorityTasks', []);

        // Drop Zone 1: Priority Folder
        if (target.contextValue === 'priorityTab') {
            if (!priorityTasks.some(p => p.text === sourceText)) {
                priorityTasks.push({ text: sourceText, isScanned: sourceItem.description?.includes('Line') || false });
                await this.context.globalState.update('priorityTasks', priorityTasks);
                this.refresh();
            }
            return;
        }

        // Drop Zone 2: Recycle Bin
        if (target.contextValue === 'recycleTab') {
            vscode.window.showInformationMessage("Please use the Delete button to move items to Recycle Bin.");
            return;
        }

        // Drop Zone 3: Normal User Folders / General Workspace
        // Rule B: Scanned comments cannot change physical folders via UI
        if (sourceItem.description && sourceItem.description.includes('Line')) {
            vscode.window.showWarningMessage("DevFlow-Suite: Scanned comments can only be dropped into Priority. Edit the actual file to move them.");
            return;
        }

        // Rule C: Manual Tasks ko nayi jagah move karo
        priorityTasks = priorityTasks.filter(p => p.text !== sourceText); // Agar priority se laya hai toh wahan se hatao
        await this.context.globalState.update('priorityTasks', priorityTasks);

        const taskIndex = manualTasks.findIndex(t => t.text === sourceText);
        if (taskIndex > -1) {
            manualTasks[taskIndex].folder = targetFolder;
        } else {
            manualTasks.push({ id: Date.now(), text: sourceText, folder: targetFolder });
        }
        
        await this.context.globalState.update('manualTasks', manualTasks);
        this.refresh();
    }
}

module.exports = TodoProvider;