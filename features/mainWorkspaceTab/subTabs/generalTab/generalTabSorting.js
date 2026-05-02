// File: features/subTabs/general/generalTabSorting.js
const vscode = require('vscode');

function registerGeneralTabSorting(context, todoProvider) {
    // 🔀 Command: Sort Tab (jargon.tabSort)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSort', async () => {
        const mode = await vscode.window.showQuickPick([
            'A-Z (Alphabetical)', 
            'Z-A (Reverse Alphabetical)', 
            'Default (Time Added)'
        ], { placeHolder: 'Sort this Tab by:' });

        if (mode) {
            await context.globalState.update('sortOrder', mode);
            todoProvider.refresh();
        }
    }));
}

module.exports = { registerGeneralTabSorting };