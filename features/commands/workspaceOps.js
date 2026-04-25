// File: features/commands/workspaceOps.js
const vscode = require('vscode');

function registerWorkspaceCommands(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainDelete', async () => {
        const res = await vscode.window.showWarningMessage("Wipe Workspace? All folders and tasks will move to Recycle Bin.", { modal: true }, "Yes, Wipe All");
        if (res === "Yes, Wipe All") {
            let trash = context.globalState.get('trashData', []);
            const manualTasks = context.globalState.get('manualTasks', []);
            const userFolders = context.globalState.get('userFolders', []);

            // 1. Saare Manual Tasks ko trash mein dalo
            manualTasks.forEach(t => trash.push({ ...t, deletedFrom: t.folder, isScanned: false }));
            
            // 2. Folder list aur Manual Tasks list khali kar do
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('trashData', trash);
            
            todoProvider.refresh();
            vscode.window.showInformationMessage("Workspace wiped! Check Recycle Bin.");
        }
    }));
}
module.exports = { registerWorkspaceCommands };