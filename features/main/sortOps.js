// File: features/main/sortOps.js
const vscode = require('vscode');

function registerSort(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSort', async () => {
        const currentSort = context.globalState.get('sortOrder', 'default');
        const newSort = currentSort === 'default' ? 'alphabetical' : 'default';
        await context.globalState.update('sortOrder', newSort);
        
        todoProvider.refresh();
        vscode.window.showInformationMessage(newSort === 'alphabetical' ? "Sorted A-Z" : "Default Sort Applied");
    }));
}
module.exports = { registerSort };