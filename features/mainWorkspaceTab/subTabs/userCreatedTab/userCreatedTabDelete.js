const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerUserCreatedTabDelete(context, todoProvider, scanWorkspaceForComments) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
        if (!node) return;
        
        const confirm = await vscode.window.showWarningMessage(
            `Confirm: Move tasks in '${node.originalText}' to General and delete folder?`,
            { modal: true }, "Yes, Delete"
        );

        if (confirm === "Yes, Delete") {
            recordHistory(context);
            
            let folders = context.globalState.get('userFolders', []);
            folders = folders.filter(f => f !== node.originalText);
            await context.globalState.update('userFolders', folders);
            
            // Tasks are not deleted, they lose their folder tag and fall back to General
            if (scanWorkspaceForComments) await scanWorkspaceForComments();
            todoProvider.refresh();
            logEvent(context, 'Folder Deleted', `Removed: '${node.originalText}'`);
        }
    }));
}

module.exports = { registerUserCreatedTabDelete };
