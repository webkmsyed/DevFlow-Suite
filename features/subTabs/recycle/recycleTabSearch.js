// File: features/subTabs/recycle/recycleTabSearch.js
const vscode = require('vscode');

function registerRecycleTabSearch(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recSearch', async () => {
        const trash = context.globalState.get('trashData', []) || [];
        if (trash.length === 0) return vscode.window.showInformationMessage("Recycle Bin is empty.");

        const items = trash.map(t => ({ label: t.text, description: `From: ${t.deletedFrom}`, task: t }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: "Search deleted tasks..." });

        if (selected) {
            // Restore logic trigger
            vscode.commands.executeCommand('jargon.taskRestore', selected.task);
        }
    }));
}
module.exports = { registerRecycleTabSearch };