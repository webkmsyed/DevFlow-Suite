// File: features/providers/dragDropController.js
const vscode = require('vscode');
const { recordHistory } = require('../commands/historyOps');

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

        // 🧠 INTELLIGENT TARGET RESOLUTION (The Bug Fix)
        // Agar user ne kisi folder ke badle "Task" ke upar drop kar diya hai
        if (!['standardTab', 'priorityTab', 'recycleTab'].includes(targetContext)) {
            if (targetContext === 'priorityTask') {
                targetLabel = "Priority Items";
                targetContext = "priorityTab";
            } else if (targetContext === 'recycleTask') {
                targetLabel = "Recycle Bin";
                targetContext = "recycleTab";
            } else {
                // Find parent folder of the task we dropped on
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

        // ❌ Rule: Folders ko drag nahi kar sakte
        if (['standardTab', 'priorityTab', 'recycleTab'].includes(sourceItem.contextValue)) return;

        // ❌ Rule: Recycle Bin mein drop disable
        if (targetContext === 'recycleTab' || targetLabel === 'Recycle Bin') {
            vscode.window.showInformationMessage("Use the Delete button to move items to Recycle Bin.");
            return;
        }

        recordHistory(this.context); // 📸 Undo Snapshot (Time Machine)

        let manualTasks = this.context.globalState.get('manualTasks') || [];
        let priorityTasks = this.context.globalState.get('priorityTasks') || [];
        let fileComments = this.context.globalState.get('fileComments') || [];
        const isScanned = sourceItem.description && sourceItem.description.includes('Line');

        // --- PHASE 1: REMOVE FROM OLD STATE ---
        // Agar hum Priority se kahin aur ja rahe hain, toh Priority se delete karo
        if (targetContext !== 'priorityTab') {
            priorityTasks = priorityTasks.filter(p => p.text !== sourceText);
        }

        // --- PHASE 2: ADD TO NEW STATE ---
        if (targetContext === 'priorityTab') {
            // Target Priority Hai
            if (!priorityTasks.some(p => p.text === sourceText)) {
                priorityTasks.push({ text: sourceText, isScanned: isScanned });
            }
        } else {
            // Target Normal Folder Hai
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

        // --- PHASE 3: SAVE & REFRESH ---
        await this.context.globalState.update('priorityTasks', priorityTasks);
        await this.context.globalState.update('manualTasks', manualTasks);
        await this.context.globalState.update('fileComments', fileComments);
        
        this.todoProvider.refresh();
    }
}

module.exports = DragDropController;