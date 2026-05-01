// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerRecycleTaskRestore(context, todoProvider) {
    // 🔄 Command: Restore Task (jargon.taskRestore)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRestore', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []) || [];
        
        // Identity Match: Find unique item in trash
        const itemIdx = trash.findIndex(t => t.isScanned ? (t.originalFile === node.file && t.originalLine === node.line) : (String(t.id) === String(node.id)));

        if (itemIdx > -1) {
            const item = trash.splice(itemIdx, 1)[0];
            if (!item.isScanned) {
                let manual = context.globalState.get('manualTasks', []) || [];
                manual.push({ id: item.id, text: item.text, folder: item.deletedFrom });
                await context.globalState.update('manualTasks', manual);
            }
            // Scanned items ke liye TreeRenderer auto-handle karta hai agar comments file mein wapas aa jayein
            await context.globalState.update('trashData', trash);
            logEvent(context, 'Restore', `'${item.text}' 'Recycle ➔ ${item.deletedFrom}'`, item.originalFile, item.originalLine);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTaskRestore };