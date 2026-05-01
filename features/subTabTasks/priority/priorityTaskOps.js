// File: features/subTabTasks/priority/priorityTaskOps.js
const vscode = require('vscode');

function registerPriorityTaskOps(context, todoProvider) {
    
    // --- 📋 Copy Task ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priTaskCopy', (node) => {
        if (!node || !node.label) return;
        vscode.env.clipboard.writeText(String(node.label));
        vscode.window.showInformationMessage("Copied to clipboard!");
    }));

    // --- ⭐ Remove Star (Command: jargon.taskRemovePri) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let pri = context.globalState.get('priorityTasks', []) || [];
        const id = node.id || `${node.file}:${node.line}`;
        
        // Filter out this specific task
        pri = pri.filter(t => (t.id || `${t.file}:${t.line}`) !== id);
        
        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();
        vscode.window.showInformationMessage("Removed from Priority.");
    }));

    // --- 🏷️ Priority Emoji Tags (Start of Label) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priTaskTag', async (node) => {
        if (!node) return;
        const id = node.id || `${node.file}:${node.line}`;
        const priTags = context.globalState.get('priorityItemTags', {}) || {};
        
        const selection = await vscode.window.showQuickPick([
            { label: '🔴 High Priority' },
            { label: '🟡 Medium Priority' },
            { label: '🟢 Low Priority' },
            { label: '⚪ Clear Tag' }
        ], { placeHolder: 'Select Priority Emoji Tag' });

        if (selection) {
            if (selection.label === '⚪ Clear Tag') {
                delete priTags[id];
            } else {
                priTags[id] = selection.label.split(' ')[0]; // Pick only the emoji (🔴, 🟡, etc.)
            }
            await context.globalState.update('priorityItemTags', priTags);
            todoProvider.refresh();
        }
    }));

    // --- 📂 Remove Whole Folder from Priority ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priFolderRemove', async (node) => {
        if (!node || !node.originalText) return;
        const folderName = node.originalText;
        let pri = context.globalState.get('priorityTasks', []) || [];

        // Remove all tasks belonging to this folder
        pri = pri.filter(t => (t.folder || t.target) !== folderName);

        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();
        vscode.window.showInformationMessage(`Folder '${folderName}' removed from Priority.`);
    }));
}

module.exports = { registerPriorityTaskOps };