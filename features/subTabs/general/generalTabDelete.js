// File: features/subTabs/general/generalTabDelete.js
const vscode = require('vscode');
const { recordHistory } = require('../../commands/historyOps');

function registerGeneralTabDelete(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
        if (!node) return;
        const folderName = node.originalText;

        // 🛡️ Bug 5 Fix: Block ONLY "General Workspace"
        if (folderName === "General Workspace") {
            vscode.window.showWarningMessage("DevFlow: 'General Workspace' is a system folder and cannot be deleted.");
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Delete folder '${folderName}'? Tasks inside will move to General Workspace.`,
            { modal: true }, "Delete"
        );

        if (confirm === "Delete") {
            recordHistory(context);
            
            // 1. Remove from user folders
            let folders = context.globalState.get('userFolders', []) || [];
            folders = folders.filter(f => f !== folderName);
            await context.globalState.update('userFolders', folders);
            
            // 2. Move manual tasks in this folder back to General Workspace
            let tasks = context.globalState.get('manualTasks', []) || [];
            tasks.forEach(t => { if (t.folder === folderName) t.folder = "General Workspace"; });
            await context.globalState.update('manualTasks', tasks);

            todoProvider.refresh();
        }
    }));
}
module.exports = { registerGeneralTabDelete };