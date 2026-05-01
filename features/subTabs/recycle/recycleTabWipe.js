// File: features/subTabs/recycle/recycleTabWipe.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerRecycleTabWipe(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recDeleteAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Permanently delete all items in Recycle Bin?", { modal: true }, "Empty Bin"
        );
        if (confirm === "Empty Bin") {
            await context.globalState.update('trashData', []);
            logEvent(context, 'Wipe', 'Action ➔ Recycle Bin Emptied Permanently');
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTabWipe };