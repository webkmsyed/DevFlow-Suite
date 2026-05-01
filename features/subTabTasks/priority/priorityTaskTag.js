// File: features/subTabTasks/priority/priorityTaskTag.js
const vscode = require('vscode');

function registerPriorityTaskTag(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priorityTaskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ prompt: `Tag for Priority Item: "${node.originalText}"` });
        if (tag !== undefined) {
            let tagsDict = context.globalState.get('itemTags', {}) || {};
            const itemKey = node.id || `${node.file}:${node.line}`; 
            tagsDict[itemKey] = tag.trim();
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerPriorityTaskTag };