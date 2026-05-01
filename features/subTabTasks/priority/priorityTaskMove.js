// File: features/subTabTasks/priority/priorityTaskMove.js
const vscode = require('vscode');

function registerPriorityTaskMove(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priorityTaskMove', async (node) => {
        if (!node) return;
        const folders = ["General Workspace", ...(context.globalState.get('userFolders', []) || [])];
        const selected = await vscode.window.showQuickPick(folders, { placeHolder: 'Move priority item back to:' });
        
        if (selected) {
            if (node.id) { // Manual
                let manual = context.globalState.get('manualTasks', []) || [];
                const idx = manual.findIndex(t => String(t.id) === String(node.id));
                if (idx > -1) manual[idx].folder = selected;
                await context.globalState.update('manualTasks', manual);
            } else { // Scanned
                let scanned = context.globalState.get('fileComments', []) || [];
                const idx = scanned.findIndex(c => c.file === node.file && c.line === node.line);
                if (idx > -1) scanned[idx].target = selected;
                await context.globalState.update('fileComments', scanned);
            }
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerPriorityTaskMove };