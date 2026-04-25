// File: features/commands/folderOps.js
const vscode = require('vscode');

function registerFolderCommands(context, todoProvider, scanWorkspaceForComments) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // 1. Create Folder
    register('jargon.mainFolder', async () => {
        const folderName = await vscode.window.showInputBox({ prompt: "New Folder Name" });
        if (folderName) {
            let folders = context.globalState.get('userFolders', []);
            folders.push(folderName);
            await context.globalState.update('userFolders', folders);
            scanWorkspaceForComments(); 
        }
    });

    // 2. Delete Folder
    register('jargon.tabDelete', async (node) => {
        if (!node) return;
        // Notice: Ab hum node.originalText use kar rahe hain taaki tag label ko disturb na kare
        const confirm = await vscode.window.showWarningMessage(
            `Delete folder '${node.originalText}'?`, { modal: true }, "Yes, Delete"
        );
        if (confirm === "Yes, Delete") {
            let folders = context.globalState.get('userFolders', []);
            folders = folders.filter(f => f !== node.originalText);
            await context.globalState.update('userFolders', folders);
            await scanWorkspaceForComments();
        }
    });
}

module.exports = { registerFolderCommands };