// File: features/subTabs/priority/priorityTabClear.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { recordHistory } = require('../../commands/historyOps');

function registerPriorityTabClear(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priRemoveAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Remove all items from Priority list?", { modal: true }, "Yes, Clear All"
        );
        if (confirm === "Yes, Clear All") {
            recordHistory(context);
            await context.globalState.update('priorityTasks', []);
            logEvent(context, 'Priority', 'Action ➔ Priority Tab Cleared');
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerPriorityTabClear };