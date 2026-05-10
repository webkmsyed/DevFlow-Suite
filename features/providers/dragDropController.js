// File: features/providers/dragDropController.js
const vscode = require('vscode');
const { recordHistory } = require('../commands/historyOps');
const { logEvent } = require('../engine/logger');

const FOLDER_CONTEXTS = ['generalTab', 'userTab', 'standardTab', 'priorityTab', 'recycleTab'];
const TASK_CONTEXTS   = ['standardTask', 'scannedTask', 'priorityTask', 'recycleTask', 'priorityFolder', 'recycleFolder', 'searchResult'];

class DragDropController {
    constructor(context, todoProvider) {
        this.context = context;
        this.todoProvider = todoProvider;
        this.dragMimeTypes = ['application/vnd.code.tree.devflow'];
        this.dropMimeTypes = ['application/vnd.code.tree.devflow'];
    }

    handleDrag(source, dataTransfer, token) {
        if (source && source[0]) {
            dataTransfer.set('application/vnd.code.tree.devflow', new vscode.DataTransferItem(source[0]));
        }
    }

    async handleDrop(target, dataTransfer, token) {
        const transferItem = dataTransfer.get('application/vnd.code.tree.devflow');
        if (!transferItem || !target) return;

        const sourceItem = transferItem.value;
        if (!sourceItem) return;

        const sourceId   = sourceItem.id ? String(sourceItem.id) : `${sourceItem.file}:${sourceItem.line}`;
        const sourceText = sourceItem.originalText || sourceItem.label || '';

        let targetLabel   = target.originalText || target.label || 'General Workspace';
        let targetContext = target.contextValue  || '';

        if (!FOLDER_CONTEXTS.includes(targetContext)) {
            // Dropped on a task — figure out its parent folder
            if (targetContext === 'priorityTask' || targetContext === 'priorityFolder') {
                targetLabel   = 'Priority Items';
                targetContext = 'priorityTab';
            } else if (targetContext === 'recycleTask' || targetContext === 'recycleFolder') {
                targetLabel   = 'Recycle Bin';
                targetContext = 'recycleTab';
            } else {
                // standardTask / scannedTask / searchResult → go to their folder
                targetLabel   = target.folder || target.target || target.parentLabel || 'General Workspace';
                targetContext = 'generalTab';
            }
        }

        // Don't allow dragging a tab/folder header
        if (FOLDER_CONTEXTS.includes(sourceItem.contextValue)) return;

        // Block direct drag-to-recycle for safety
        if (targetContext === 'recycleTab') {
            vscode.window.showInformationMessage('DevFlow: Use the Delete button to move items to Recycle Bin.');
            return;
        }

        // Same position — no-op
        const sourceFolder = sourceItem.folder || sourceItem.target || 'General Workspace';
        if (targetLabel === sourceFolder && targetContext !== 'priorityTab') return;

        recordHistory(this.context);

        let manualTasks   = this.context.globalState.get('manualTasks', [])   || [];
        let priorityTasks = this.context.globalState.get('priorityTasks', []) || [];
        let fileComments  = this.context.globalState.get('fileComments', [])  || [];

        const isScanned = !!sourceItem.file;

        if (targetContext === 'priorityTab') {
            // Pin to priority (don't remove from source)
            const alreadyPinned = priorityTasks.some(p =>
                (p.id ? String(p.id) : `${p.file}:${p.line}`) === sourceId
            );
            if (!alreadyPinned) {
                priorityTasks.push({
                    id:        sourceItem.id   || null,
                    text:      sourceText,
                    isScanned: isScanned,
                    file:      sourceItem.file || null,
                    line:      sourceItem.line || null,
                    folder:    sourceFolder,
                    target:    sourceFolder
                });
            }
        } else {
            // Move to another standard folder
            if (isScanned) {
                const idx = fileComments.findIndex(c =>
                    c.file === sourceItem.file && c.line === sourceItem.line
                );
                if (idx > -1) fileComments[idx].target = targetLabel;

                // Persist manual assignment so scanner respects it on next scan
                let manualAssignments = this.context.globalState.get('manualAssignments', {}) || {};
                manualAssignments[sourceId] = targetLabel;
                await this.context.globalState.update('manualAssignments', manualAssignments);
            } else {
                const idx = manualTasks.findIndex(t => String(t.id) === String(sourceItem.id));
                if (idx > -1) manualTasks[idx].folder = targetLabel;
            }

            // Update priority reference too if task is pinned
            const priIdx = priorityTasks.findIndex(p =>
                (p.id ? String(p.id) : `${p.file}:${p.line}`) === sourceId
            );
            if (priIdx > -1) {
                priorityTasks[priIdx].folder = targetLabel;
                priorityTasks[priIdx].target = targetLabel;
            }
        }

        await this.context.globalState.update('priorityTasks', priorityTasks);
        await this.context.globalState.update('manualTasks',   manualTasks);
        await this.context.globalState.update('fileComments',  fileComments);

        this.todoProvider.refresh();
        logEvent(
            this.context, 'Move',
            `'${sourceText}' '${sourceFolder} -> ${targetLabel}'`,
            sourceItem.file, sourceItem.line
        );
    }
}

module.exports = DragDropController;