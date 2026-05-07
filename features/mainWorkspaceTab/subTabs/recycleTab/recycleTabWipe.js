// File: features/subTabs/recycle/recycleTabWipe.js
const vscode = require('vscode');

function registerRecycleTabWipe(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recDeleteAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Permanently delete all items in Recycle Bin?", { modal: true }, "Empty Bin"
        );
        if (confirm === "Empty Bin") {
            // Update state directly without triggering a scanner re-run via logEvent.
            await context.globalState.update('trashData', []);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTabWipe };
