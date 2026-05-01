// File: features/subTabs/priority/priorityTabAddAll.js
const vscode = require('vscode');

function registerPriorityTabAddAll(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priAddAll', async () => {
        const manual = context.globalState.get('manualTasks', []) || [];
        const scanned = context.globalState.get('fileComments', []) || [];
        
        // Combine all and mark as priority
        const allTasks = [...manual, ...scanned];
        
        if (allTasks.length === 0) {
            vscode.window.showInformationMessage("DevFlow: No tasks found to add.");
            return;
        }

        await context.globalState.update('priorityTasks', allTasks);
        todoProvider.refresh();
        vscode.window.showInformationMessage(`DevFlow: Added ${allTasks.length} tasks to Priority.`);
    }));
}

module.exports = { registerPriorityTabAddAll };