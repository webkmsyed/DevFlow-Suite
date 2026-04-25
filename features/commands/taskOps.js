// File: features/commands/taskOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps'); // 📸 History Engine Import Kiya!

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        if (taskText) {
            recordHistory(context); // 🔥 SNAPSHOT TAKEN BEFORE CHANGE!

            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
        }
    });

    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            placeHolder: "Type tag (e.g., bug) OR type 'clear' to remove" 
        });
        
        if (tag !== undefined) {
            recordHistory(context); // 🔥 SNAPSHOT TAKEN BEFORE CHANGE!

            let tagsDict = context.globalState.get('itemTags', {});
            if (tag.trim().toLowerCase() === "clear") delete tagsDict[node.originalText]; 
            else if (tag.trim() !== "") tagsDict[node.originalText] = tag.trim(); 
            
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    });

    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
        }
    });
}

module.exports = { registerTaskCommands };