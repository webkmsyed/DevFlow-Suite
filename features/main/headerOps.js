// File: features/main/headerOps.js
const vscode = require('vscode');

function registerHeaderCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // 1. 🔍 SEARCH WORKSPACE
    register('jargon.mainSearch', async () => {
        const query = await vscode.window.showInputBox({ 
            prompt: "Search Tasks or Comments",
            placeHolder: "Type to search..." 
        });
        
        if (query !== undefined) {
            await context.globalState.update('searchQuery', query.toLowerCase());
            todoProvider.refresh();
            if (query) vscode.window.showInformationMessage(`Searching for: "${query}"`);
        }
    });

    // 2. 🧹 CLEAR FILTER / SEARCH
    register('jargon.mainFilter', async () => {
        await context.globalState.update('searchQuery', ''); // Search clear kar dega
        todoProvider.refresh();
        vscode.window.showInformationMessage("Filters and Search cleared!");
    });

    // 3. 🔀 SORT ALPHABETICALLY (Toggle)
    register('jargon.mainSort', async () => {
        const currentSort = context.globalState.get('sortOrder', 'default');
        const newSort = currentSort === 'default' ? 'alphabetical' : 'default';
        await context.globalState.update('sortOrder', newSort);
        
        todoProvider.refresh();
        vscode.window.showInformationMessage(newSort === 'alphabetical' ? "Sorted A-Z" : "Default Sort Applied");
    });
}

module.exports = { registerHeaderCommands };