// File: features/commands/priorityOps.js
const vscode = require('vscode');

function registerPriorityCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // 1. Save to Priority
    register('jargon.taskSavePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        if (!priority.some(p => p.text === node.originalText)) {
            priority.push({ text: node.originalText, isScanned: node.description && node.description.includes('Line') });
            await context.globalState.update('priorityTasks', priority);
            todoProvider.refresh();
        }
    });

    // 2. Remove from Priority
    register('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        priority = priority.filter(t => t.text !== node.originalText);
        await context.globalState.update('priorityTasks', priority);
        todoProvider.refresh();
    });

    // 3. Remove All Priorities (Clear Tab)
    register('jargon.priRemoveAll', async () => {
        await context.globalState.update('priorityTasks', []);
        todoProvider.refresh();
        vscode.window.showInformationMessage("All priorities cleared.");
    });
}

module.exports = { registerPriorityCommands };