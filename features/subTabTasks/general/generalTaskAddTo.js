// File: features/subTabTasks/general/generalTaskAddTo.js
const vscode = require('vscode');

function registerGeneralTaskAddTo(context, todoProvider) {
    // 📂 Command: Move Task to Folder (jargon.taskAddTo)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskAddTo', async (node) => {
        if (!node) return;

        const folders = context.globalState.get('userFolders', []) || [];
        const targetFolders = ["General Workspace", ...folders];

        const selected = await vscode.window.showQuickPick(targetFolders, { placeHolder: 'Select destination folder' });

        if (selected) {
            if (node.id) { // Manual Task[cite: 1]
                let manual = context.globalState.get('manualTasks', []) || [];
                const idx = manual.findIndex(t => String(t.id) === String(node.id));
                if (idx > -1) manual[idx].folder = selected;
                await context.globalState.update('manualTasks', manual);
            } else { // Scanned Task[cite: 1]
                let scanned = context.globalState.get('fileComments', []) || [];
                const idx = scanned.findIndex(c => c.file === node.file && c.line === node.line);
                if (idx > -1) scanned[idx].target = selected;
                await context.globalState.update('fileComments', scanned);
            }
            todoProvider.refresh();
        }
    }));
}

module.exports = { registerGeneralTaskAddTo };