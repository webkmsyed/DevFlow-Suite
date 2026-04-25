// File: features/main/filterOps.js
const vscode = require('vscode');

function registerFilter(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainFilter', async () => {
        // Saari filter states ko default par set karo
        await context.globalState.update('searchQuery', ''); 
        await context.globalState.update('activeFilter', 'All Items');
        await context.globalState.update('sortOrder', 'Default');
        
        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow-Suite: All Filters & Search Cleared!");
    }));
}
module.exports = { registerFilter };