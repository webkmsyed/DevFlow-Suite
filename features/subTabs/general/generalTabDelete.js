// File: features/subTabs/general/generalTabDelete.js
const vscode = require('vscode');
const { recordHistory } = require('../../commands/historyOps');
const { logEvent } = require('../../engine/logger');

function registerGeneralTabDelete(context, todoProvider, scanWorkspace) {
    // 🗑️ Command: Delete Tab/Folder (jargon.tabDelete)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
        if (!node || !node.isUser) {
            vscode.window.showWarningMessage("System folders cannot be deleted.");
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Confirm: Move tasks in '${node.originalText}' to General and delete folder?`,
            { modal: true }, "Yes, Delete"
        );

        if (confirm === "Yes, Delete") {
            recordHistory(context);
            
            let folders = context.globalState.get('userFolders', []) || [];
            folders = folders.filter(f => f !== node.originalText);
            await context.globalState.update('userFolders', folders);
            
            // Re-sync scanned comments taaki unka target General Workspace ho jaye
            await scanWorkspace();
            todoProvider.refresh();
            logEvent(context, 'Delete', `'${node.originalText}' 'Action ➔ Folder Removed'`);
        }
    }));
}

module.exports = { registerGeneralTabDelete };