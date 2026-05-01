// File: features/subTabTasks/general/generalTaskTag.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { recordHistory } = require('../../commands/historyOps');

function registerGeneralTaskTag(context, todoProvider) {
    // 🏷️ Command: Add Tag (jargon.taskTag)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskTag', async (node) => {
        if (!node) return;

        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            placeHolder: "e.g., bug, fix, high-priority (Type 'clear' to remove)" 
        });

        if (tag !== undefined) {
            recordHistory(context);
            let tagsDict = context.globalState.get('itemTags', {}) || {};
            
            // Identity Fix: Use ID for Manual, File:Line for Scanned
            const itemKey = node.id || `${node.file}:${node.line}`; 

            if (tag.trim().toLowerCase() === "clear") {
                delete tagsDict[itemKey];
            } else if (tag.trim() !== "") {
                tagsDict[itemKey] = tag.trim();
            }

            await context.globalState.update('itemTags', tagsDict);
            logEvent(context, 'Tag', `'${node.originalText}' 'Action ➔ Tagged as ${tag}'`, node.file, node.line);
            
            todoProvider.refresh();
        }
    }));
}

module.exports = { registerGeneralTaskTag };