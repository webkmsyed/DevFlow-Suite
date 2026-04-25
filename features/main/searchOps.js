// File: features/main/searchOps.js
const vscode = require('vscode');

function registerSearch(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSearch', async () => {
        const query = await vscode.window.showInputBox({ 
            prompt: "Search Tasks or Comments", placeHolder: "Type to search..." 
        });
        if (query !== undefined) {
            await context.globalState.update('searchQuery', query.toLowerCase());
            todoProvider.refresh();
            if (query) vscode.window.showInformationMessage(`DevFlow-Suite: Searching for "${query}"`);
        }
    }));
}
module.exports = { registerSearch };