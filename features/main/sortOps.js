// File: features/main/sortOps.js
const vscode = require('vscode');

function registerSort(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSort', async () => {
        const mode = await vscode.window.showQuickPick([
            'Default (Time Added)', 
            'A-Z (Alphabetical)', 
            'Z-A (Reverse Alphabetical)',
            'Folder Size (High to Low)', // Bade folders upar
            'Folder Size (Low to High)'  // Chote folders upar
        ], { placeHolder: 'Advanced Sort Workspace By:' });

        if (mode) {
            await context.globalState.update('sortOrder', mode);
            todoProvider.refresh();
            vscode.window.showInformationMessage(`DevFlow-Suite: Sorted by ${mode}`);
        }
    }));
}
module.exports = { registerSort };