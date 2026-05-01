// File: features/providers/dragDropController.js
const vscode = require('vscode');
const { recordHistory } = require('../commands/historyOps');
const { logEvent } = require('../engine/logger');

class DragDropController {
    constructor(context, todoProvider) {
        this.context = context;
        this.todoProvider = todoProvider;
        this.dragMimeTypes = ['application/vnd.code.tree.devflow'];
        this.dropMimeTypes = ['application/vnd.code.tree.devflow'];
    }

    handleDrag(source, dataTransfer, token) {
        dataTransfer.set('application/vnd.code.tree.devflow', new vscode.DataTransferItem(source[0]));
    }

    async handleDrop(target, dataTransfer, token) {
        const transferItem = dataTransfer.get('application/vnd.code.tree.devflow');
        if (!transferItem || !target) return;

        const sourceItem = transferItem.value;
        // Identity Fix: Use unique ID or file:line for dragging
        const sourceId = sourceItem.id || `${sourceItem.file}:${sourceItem.line}`;
        const sourceText = sourceItem.originalText || sourceItem.label;

        let targetLabel = target.originalText || target.label;
        let targetContext = target.contextValue;

        // --- Target Resolution ---
        if (!['standardTab', 'priorityTab', 'recycleTab'].includes(targetContext)) {
            if (targetContext === 'priorityTask') {
                targetLabel = "Priority Items"; targetContext = "priorityTab";
            } else if (targetContext === 'recycleTask') {
                targetLabel = "Recycle Bin"; targetContext = "recycleTab";
            } else {
                targetLabel = target.parentLabel || target.folder || "General Workspace";
                targetContext = "standardTab";
            }
        }

        // Prevent dragging tabs into tabs
        if (['standardTab', 'priorityTab', 'recycleTab'].includes(sourceItem.contextValue)) return;
        
        // Block Drag-to-Recycle (Use Delete Button for safety)
        if (targetContext === 'recycleTab' || targetLabel === 'Recycle Bin') {
            vscode.window.showInformationMessage("Use the Delete button to move items to Recycle Bin.");
            return;
        }

        recordHistory(this.context);

        let manualTasks = this.context.globalState.get('manualTasks', []) || [];
        let priorityTasks = this.context.globalState.get('priorityTasks', []) || [];
        let fileComments = this.context.globalState.get('fileComments', []) || [];

        const isScanned = !!sourceItem.file;

        // 1. Logic: Remove from Priority if moving to another folder (Non-copy move)
        if (targetContext !== 'priorityTab') {
            priorityTasks = priorityTasks.filter(p => (p.id || `${p.file}:${p.line}`) !== sourceId);
        }

        // 2. Logic: Handle Destination
        if (targetContext === 'priorityTab') {
            if (!priorityTasks.some(p => (p.id || `${p.file}:${p.line}`) === sourceId)) {
                priorityTasks.push({ 
                    id: sourceItem.id || null,
                    text: sourceText, 
                    isScanned: isScanned,
                    file: sourceItem.file || null,
                    line: sourceItem.line || null
                });
            }
        } else {
            if (isScanned) {
                const commentIdx = fileComments.findIndex(c => `${c.file}:${c.line}` === sourceId);
                if (commentIdx > -1) fileComments[commentIdx].target = targetLabel;
            } else {
                const taskIdx = manualTasks.findIndex(t => String(t.id) === String(sourceItem.id));
                if (taskIdx > -1) manualTasks[taskIdx].folder = targetLabel;
            }
        }

        await this.context.globalState.update('priorityTasks', priorityTasks);
        await this.context.globalState.update('manualTasks', manualTasks);
        await this.context.globalState.update('fileComments', fileComments);

        logEvent(this.context, 'Move', `'${sourceText}' '${sourceItem.parentLabel || "General Workspace"} ➔ ${targetLabel}'`, sourceItem.file, sourceItem.line);
        this.todoProvider.refresh();
    }
}

module.exports = DragDropController;