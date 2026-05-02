const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerUserCreatedTabCreate(context, todoProvider, scanWorkspaceForComments) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainFolder', async () => {
        const folderName = await vscode.window.showInputBox({ 
            prompt: "Enter a unique name for the Workspace Folder",
            placeHolder: "e.g., UI Components, API Logic"
        });

        if (!folderName || folderName.trim() === '') return;

        const trimmed = folderName.trim();
        recordHistory(context);
        let folders = context.globalState.get('userFolders', []) || [];

        if (folders.includes(trimmed)) {
            vscode.window.showWarningMessage(`DevFlow: Folder '${trimmed}' already exists!`);
            return;
        }

        folders.push(trimmed);
        await context.globalState.update('userFolders', folders);
        todoProvider.refresh();
        logEvent(context, 'Create', `'${trimmed}' 'Action -> New Folder Created'`);

        // FIX: Auto-scan so file comments matching this folder name appear immediately
        setTimeout(() => {
            vscode.commands.executeCommand('jargon.mainRefresh');
        }, 300);
    }));
}

module.exports = { registerUserCreatedTabCreate };
