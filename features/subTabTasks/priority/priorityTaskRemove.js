// File: features/subTabTasks/priority/priorityTaskRemove.js
const vscode = require('vscode');

function registerPriorityTaskRemove(context, todoProvider) {
    // 🌟 Bug 9 Fix: Remove from Priority when star is clicked
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priTaskRemove', async (node) => {
        if (!node) return;
        let pri = context.globalState.get('priorityTasks', []) || [];
        const nodeId = node.id || `${node.file}:${node.line}`;

        // Filter out the item
        pri = pri.filter(p => (p.id || `${p.file}:${p.line}`) !== nodeId);
        
        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();
        vscode.window.showInformationMessage("Removed from Priority.");
    }));
}
module.exports = { registerPriorityTaskRemove };