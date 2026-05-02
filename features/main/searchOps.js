// File: features/main/searchOps.js
const vscode = require('vscode');

function registerSearch(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSearch', async () => {
        const currentQuery = context.globalState.get('searchQuery', '') || '';

        const query = await vscode.window.showInputBox({
            prompt: 'Search tasks and comments',
            placeHolder: 'Type to search… leave empty to clear',
            value: currentQuery
        });

        // Escaped (pressed Escape)
        if (query === undefined) return;

        const searchQuery = query.trim().toLowerCase();
        await context.globalState.update('searchQuery', searchQuery);

        if (searchQuery === '') {
            // Clear search
            todoProvider.search('');
            vscode.commands.executeCommand('setContext', 'devflow.searchActive', false);
            vscode.window.showInformationMessage('DevFlow: Search cleared.');
        } else {
            // Activate search — shows X button in title bar
            vscode.commands.executeCommand('setContext', 'devflow.searchActive', true);
            todoProvider.search(searchQuery);
            vscode.window.showInformationMessage(`DevFlow: Results for "${query}" — press ✕ to clear`);
        }
    }));
}

module.exports = { registerSearch };