// File: features/subTabTasks/recycle/recycleTaskTag.js
const vscode = require('vscode');

function registerRecycleTaskTag(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recycleTaskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ prompt: `Tag for Trash Item: "${node.originalText}"` });
        
        if (tag !== undefined) {
            let tagsDict = context.globalState.get('itemTags', {}) || {};
            const itemKey = node.id || `${node.file}:${node.line}`; 
            
            if (tag.trim().toLowerCase() === "clear") delete tagsDict[itemKey];
            else if (tag.trim() !== "") tagsDict[itemKey] = tag.trim();

            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTaskTag };