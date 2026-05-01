// File: features/subTabs/general/generalTabTag.js
const vscode = require('vscode');

function registerGeneralTabTag(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTag', async (node) => {
        if (!node) return;
        const folderName = node.originalText;
        const folderKey = `folder:${folderName}`;
        
        const tags = context.globalState.get('itemTags', {}) || {};
        const oldTag = tags[folderKey] || "";

        const newTag = await vscode.window.showInputBox({ 
            prompt: `Tag for folder: ${folderName}`, 
            value: oldTag 
        });

        if (newTag !== undefined) {
            if (newTag.trim() === "" || newTag.toLowerCase() === "clear") {
                delete tags[folderKey];
            } else {
                tags[folderKey] = newTag.trim();
            }
            await context.globalState.update('itemTags', tags);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerGeneralTabTag };