// File: features/main/filterOps.js
const vscode = require('vscode');

function registerFilter(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainFilter', async () => {
        const choice = await vscode.window.showQuickPick([
            'All Items (Default)', 
            'Manual Tasks Only', 
            'Scanned Comments Only',
            'Bugs Only (🔴)',          // Pro feature: Sirf bugs dikhayega
            'Untagged Items Only',     // Pro feature: Jo tasks tag nahi hue unhe highlight karega
            'Clear Search & Filters'   // Reset button
        ], { placeHolder: 'Advanced Filter Workspace By:' });

        if (choice) {
            if (choice === 'Clear Search & Filters' || choice === 'All Items (Default)') {
                await context.globalState.update('searchQuery', ''); 
                await context.globalState.update('activeFilter', 'All Items');
                vscode.window.showInformationMessage("DevFlow-Suite: All Filters & Search Cleared!");
            } else {
                await context.globalState.update('activeFilter', choice);
                vscode.window.showInformationMessage(`DevFlow-Suite: Filtered by ${choice}`);
            }
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerFilter };