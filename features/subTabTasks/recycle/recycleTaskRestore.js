// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');

function registerRecycleTaskRestore(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recycleRestore', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []) || [];
        let manual = context.globalState.get('manualTasks', []) || [];

        const itemToRestore = trash.find(t => String(t.id) === String(node.id));
        if (itemToRestore) {
            // Remove from trash
            trash = trash.filter(t => String(t.id) !== String(node.id));
            // Add back to manual (or original location)
            manual.push({
                id: itemToRestore.id,
                text: itemToRestore.text,
                folder: itemToRestore.deletedFrom || "General Workspace"
            });

            await context.globalState.update('trashData', trash);
            await context.globalState.update('manualTasks', manual);
            todoProvider.refresh();
            vscode.window.showInformationMessage("Item restored to original folder.");
        }
    }));
}
module.exports = { registerRecycleTaskRestore };