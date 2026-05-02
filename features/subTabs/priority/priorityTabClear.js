// File: features/subTabs/priority/priorityTabClear.js
const vscode = require('vscode');

function registerPriorityTabClear(context, todoProvider) {
    // BUG 2 FIX: was 'jargon.priClearAll' — package.json needs 'jargon.priRemoveAll'
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priRemoveAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Are you sure you want to clear all tasks from Priority?",
            { modal: true }, "Clear All"
        );
        if (confirm === "Clear All") {
            await context.globalState.update('priorityTasks', []);
            await context.globalState.update('priorityItemTags', {});
            todoProvider.refresh();
            vscode.window.showInformationMessage("DevFlow: Priority Tab Cleared.");
        }
    }));
}

module.exports = { registerPriorityTabClear };