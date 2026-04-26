// File: features/commands/taskOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps'); 
const { logEvent } = require('../engine/logger'); // 🔥 Logger Import Zaroori Tha!

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        
        if (taskText) {
            recordHistory(context); // Snapshot Taken

            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            
            todoProvider.refresh();
            
            // 🔥 CCTV LOG: Naya task ab auto-sync hoga!
            logEvent(context, 'Create', `Created task '${taskText}' in '${node.originalText}'`, null, null);
        }
    });

    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            placeHolder: "Type tag (e.g., bug) OR type 'clear' to remove" 
        });
        
        if (tag !== undefined) {
            recordHistory(context); 

            let tagsDict = context.globalState.get('itemTags', {});
            let actionText = "";

            if (tag.trim().toLowerCase() === "clear") {
                delete tagsDict[node.originalText]; 
                actionText = `Cleared tag from '${node.originalText}'`;
            } 
            else if (tag.trim() !== "") {
                tagsDict[node.originalText] = tag.trim(); 
                actionText = `Added tag [${tag.trim()}] to '${node.originalText}'`;
            }
            
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();

            // 🔥 CCTV LOG: Tag update bhi auto-sync hoga!
            if (actionText !== "") {
                logEvent(context, 'Tag', actionText, null, null);
            }
        }
    });

    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
            
            // 🔥 Optional: Copy ko bhi track karna chaho toh
            // logEvent(context, 'Copy', `Copied task '${node.originalText}'`, null, null);
        }
    });
}

module.exports = { registerTaskCommands };