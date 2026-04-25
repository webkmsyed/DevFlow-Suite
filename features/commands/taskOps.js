// File: features/commands/taskOps.js
const vscode = require('vscode');

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // 1. Create Task
    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        if (taskText) {
            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
        }
    });

    // 2. Tag Task
    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ prompt: `Tag for "${node.originalText}" (e.g., UI bug, feature)` });
        if (tag !== undefined) {
            let tagsDict = context.globalState.get('itemTags', {});
            tagsDict[node.originalText] = tag; 
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    });

    // 3. Copy Task Text
    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
        }
    });
}

module.exports = { registerTaskCommands };