// File: features/commands/folderOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps'); // 📸 History Engine Bulaya
const { logEvent } = require('../engine/logger');

function registerFolderCommands(context, todoProvider, scanWorkspaceForComments) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.mainFolder', async () => {
        const folderName = await vscode.window.showInputBox({ prompt: "New Folder Name" });
        if (folderName) {
            recordHistory(context); // 🔥 Folder banne se pehle state save ki
            
            let folders = context.globalState.get('userFolders', []);
            folders.push(folderName);
            await context.globalState.update('userFolders', folders);
            logEvent(context, 'Folder Created', `Created new folder '${folderName}'`);
            scanWorkspaceForComments(); 
        }
    });

    register('jargon.tabDelete', async (node) => {
        if (!node) return;
        const confirm = await vscode.window.showWarningMessage(
            `Delete folder '${node.originalText}'?`, { modal: true }, "Yes, Delete"
        );
        if (confirm === "Yes, Delete") {
            recordHistory(context); // 🔥 Folder udne se pehle state save ki
            
            let folders = context.globalState.get('userFolders', []);
            folders = folders.filter(f => f !== node.originalText);
            await context.globalState.update('userFolders', folders);
            await scanWorkspaceForComments();
        }
    });
}

module.exports = { registerFolderCommands };