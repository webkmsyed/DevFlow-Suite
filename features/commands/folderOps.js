// File: features/commands/folderOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps');
const { logEvent } = require('../engine/logger');

function registerFolderCommands(context, todoProvider, scanWorkspaceForComments) {
    
    // --- 1. CREATE FOLDER ---
    vscode.commands.registerCommand('jargon.mainFolder', async () => {
        const folderName = await vscode.window.showInputBox({ 
            prompt: "Enter a unique name for the Luxury Folder",
            placeHolder: "e.g., UI Components, API Logic"
        });

        if (folderName) {
            let folders = context.globalState.get('userFolders', []);
            
            // Check for duplicate folder names
            if (folders.includes(folderName)) {
                vscode.window.showErrorMessage(`Folder '${folderName}' already exists!`);
                return;
            }

            recordHistory(context);
            folders.push(folderName);
            await context.globalState.update('userFolders', folders);
            
            logEvent(context, 'Folder Created', `New Workspace: '${folderName}'`);
            scanWorkspaceForComments(); 
            todoProvider.refresh();
        }
    });

    // --- 2. DELETE FOLDER ---
    vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
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
            
            // Note: Tasks are not deleted, they just lose their folder tag (fall back to General)
            await scanWorkspaceForComments();
            todoProvider.refresh();
            logEvent(context, 'Folder Deleted', `Removed: '${node.originalText}'`);
        }
    });
}

module.exports = { registerFolderCommands };