// File: features/subTabs/priority/priorityTabClear.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerPriorityTabClear(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priRemoveAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Clear all items from Priority list?", { modal: true }, "Clear All"
        );
        if (confirm === "Clear All") {
            await context.globalState.update('priorityTasks', []);
            logEvent(context, 'Priority', 'Action ➔ Priority Tab Emptied');
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerPriorityTabClear };