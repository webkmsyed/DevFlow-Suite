// File: features/main/searchOps.js
const vscode = require('vscode');

/**
 * Handle Global Search Logic.
 * Fixes: Updates both GlobalState and Provider for real-time UI filtering.
 */
function registerSearch(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSearch', async () => {
        const query = await vscode.window.showInputBox({ 
            prompt: "Search Tasks or Comments",
            placeHolder: "Type to search... (Leave empty to clear search)" 
        });
        
        // Escape check
        if (query === undefined) return;

        const searchQuery = query.trim().toLowerCase();
        
        // 1. Update State (For persistence if needed)
        await context.globalState.update('searchQuery', searchQuery);
        
        // 2. 🔥 Trigger Provider Search Logic (Quick Access Results)
        if (todoProvider && typeof todoProvider.search === 'function') {
            todoProvider.search(searchQuery);
        }
        
        // 3. UI Feedback
        if (searchQuery === "") {
            vscode.window.showInformationMessage("DevFlow-Suite: Search Cleared!");
        } else {
            vscode.window.showInformationMessage(`DevFlow-Suite: Results for "${query}"`);
        }
    }));
}

module.exports = { registerSearch };