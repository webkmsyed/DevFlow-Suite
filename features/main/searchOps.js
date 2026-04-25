// File: features/main/searchOps.js
const vscode = require('vscode');

function registerSearch(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainSearch', async () => {
        const query = await vscode.window.showInputBox({ 
            prompt: "Search Tasks or Comments",
            placeHolder: "Type to search... (Leave empty to clear search)" 
        });
        
        // Agar user ne 'Escape' dabaya (undefined) toh kuch mat karo
        if (query === undefined) return;

        // Agar user ne kuch likha hai toh search karo, warna clear kar do
        const searchQuery = query.trim().toLowerCase();
        await context.globalState.update('searchQuery', searchQuery);
        
        todoProvider.refresh();
        
        if (searchQuery === "") {
            vscode.window.showInformationMessage("DevFlow-Suite: Search Cleared!");
        } else {
            vscode.window.showInformationMessage(`DevFlow-Suite: Results for "${query}"`);
        }
    }));
}
module.exports = { registerSearch };