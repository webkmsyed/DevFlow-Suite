// File: features/subTabTasks/general/generalTaskTag.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { recordHistory } = require('../../commands/historyOps');

/**
 * Handle Task-Level Tagging.
 * Bug Fix: Ensures unique ID matching and immediate provider refresh.
 */
function registerGeneralTaskTag(context, todoProvider) {
    
    // 🏷️ Command: Add/Remove Tag (jargon.taskTag)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskTag', async (node) => {
        if (!node) return;

        const currentTags = context.globalState.get('itemTags', {}) || {};
        const itemKey = node.id || `${node.file}:${node.line}`;
        const existingTag = currentTags[itemKey] || "";

        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            value: existingTag,
            placeHolder: "Type tag name or 'clear' to remove" 
        });

        if (tag !== undefined) {
            recordHistory(context);
            let tagsDict = context.globalState.get('itemTags', {}) || {};
            
            if (tag.trim().toLowerCase() === "clear" || tag.trim() === "") {
                delete tagsDict[itemKey];
                logEvent(context, 'Tag', `'${node.originalText}' 'Action ➔ Tag Removed'`);
            } else {
                tagsDict[itemKey] = tag.trim();
                logEvent(context, 'Tag', `'${node.originalText}' 'Action ➔ Tagged as ${tag}'`);
            }

            await context.globalState.update('itemTags', tagsDict);
            
            // 🔥 Force refresh to show the new tag in UI
            todoProvider.refresh();
            vscode.window.showInformationMessage(`DevFlow: Tag updated for '${node.originalText}'`);
        }
    }));
}

module.exports = { registerGeneralTaskTag };