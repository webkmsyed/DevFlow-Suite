// File: features/subTabTasks/priority/priorityTaskRemove.js
const vscode = require('vscode');

function registerPriorityTaskRemove(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let pri = context.globalState.get('priorityTasks', []) || [];
        const nodeId = node.id || `${node.file}:${node.line}`;

        pri = pri.filter(p => (p.id || `${p.file}:${p.line}`) !== nodeId);
        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();
    }));
}
module.exports = { registerPriorityTaskRemove };