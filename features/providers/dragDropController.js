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
        const sourceText = sourceItem.originalText || sourceItem.label;

        let targetLabel = target.originalText || target.label;
        let targetContext = target.contextValue;

        // 🧠 Intelligent Target Resolution
        if (!['standardTab', 'priorityTab', 'recycleTab'].includes(targetContext)) {
            if (targetContext === 'priorityTask') {
                targetLabel = "Priority Items";
                targetContext = "priorityTab";
            } else if (targetContext === 'recycleTask') {
                targetLabel = "Recycle Bin";
                targetContext = "recycleTab";
            } else {
                let manualTasks = this.context.globalState.get('manualTasks') || [];
                let fileComments = this.context.globalState.get('fileComments') || [];
                let foundManual = manualTasks.find(t => t.text === targetLabel);
                let foundScanned = fileComments.find(c => c.text === targetLabel);

                if (foundManual) targetLabel = foundManual.folder;
                else if (foundScanned) targetLabel = foundScanned.target;
                else targetLabel = "General Workspace";

                targetContext = "standardTab";
            }
        }

        if (['standardTab', 'priorityTab', 'recycleTab'].includes(sourceItem.contextValue)) return;
        if (targetContext === 'recycleTab' || targetLabel === 'Recycle Bin') {
            vscode.window.showInformationMessage("Use the Delete button to move items to Recycle Bin.");
            return;
        }

        recordHistory(this.context);

        let manualTasks = this.context.globalState.get('manualTasks') || [];
        let priorityTasks = this.context.globalState.get('priorityTasks') || [];
        let fileComments = this.context.globalState.get('fileComments') || [];

        // 🔥 Solid Check for Scanned vs Manual
        const isScanned = fileComments.some(c => c.text === sourceText);

        if (targetContext !== 'priorityTab') {
            priorityTasks = priorityTasks.filter(p => p.text !== sourceText);
        }

        if (targetContext === 'priorityTab') {
            if (!priorityTasks.some(p => p.text === sourceText)) {
                // Priority mein dalte waqt location bhi save kar rahe hain for Smart Sync
                priorityTasks.push({ 
                    text: sourceText, 
                    isScanned: isScanned,
                    file: sourceItem.file || null,
                    line: sourceItem.line || null
                });
            }
        } else {
            if (isScanned) {
                const commentIdx = fileComments.findIndex(c => c.text === sourceText);
                if (commentIdx > -1) {
                    fileComments[commentIdx].target = targetLabel;
                }
            } else {
                const taskIdx = manualTasks.findIndex(t => t.text === sourceText);
                if (taskIdx > -1) {
                    manualTasks[taskIdx].folder = targetLabel;
                } else {
                    manualTasks.push({ id: Date.now(), text: sourceText, folder: targetLabel });
                }
            }
        }

        await this.context.globalState.update('priorityTasks', priorityTasks);
        await this.context.globalState.update('manualTasks', manualTasks);
        await this.context.globalState.update('fileComments', fileComments);

        // ✅ Professional Audit Logging
        const taskFile = sourceItem.file || null;
        const taskLine = sourceItem.line || null;
        const sourceLoc = sourceItem.parentLabel || "General Workspace";

        // Format: 'Comment' 'Source ➔ Destination'
        logEvent(this.context, 'Move', `'${sourceText}' '${sourceLoc} ➔ ${targetLabel}'`, taskFile, taskLine);

        this.todoProvider.refresh();
    }
}

module.exports = DragDropController;