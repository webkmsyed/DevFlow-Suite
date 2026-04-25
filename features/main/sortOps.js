// File: features/main/sortOps.js
const vscode = require('vscode');
function registerSort(context, todoProvider) {
    vscode.commands.registerCommand('jargon.mainSort', async () => {
        const mode = await vscode.window.showQuickPick(['A-Z', 'Task Count (High to Low)', 'Default'], { placeHolder: 'Select Sort Order' });
        if (mode) {
            await context.globalState.update('sortOrder', mode);
            todoProvider.refresh();
        }
    });
}
module.exports = { registerSort };