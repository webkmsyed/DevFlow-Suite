// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerRecycleTaskRestore(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRestore', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []) || [];
        const itemIdx = trash.findIndex(t => t.text === node.originalText); // Identity match using text for simple restore

        if (itemIdx > -1) {
            const item = trash.splice(itemIdx, 1)[0];
            if (!item.isScanned) {
                let manual = context.globalState.get('manualTasks', []) || [];
                manual.push({ id: item.id, text: item.text, folder: item.deletedFrom });
                await context.globalState.update('manualTasks', manual);
            }
            // Scanned restore logic would re-insert // TODO if physical delete was used
            await context.globalState.update('trashData', trash);
            logEvent(context, 'Restore', `'${item.text}' 'Recycle ➔ ${item.deletedFrom}'`);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTaskRestore };