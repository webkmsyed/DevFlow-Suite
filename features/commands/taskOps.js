// File: features/commands/taskOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps'); 
const { logEvent } = require('../engine/logger'); 

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        
        if (taskText) {
            recordHistory(context); 

            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            
            todoProvider.refresh();
            
            // 🔥 PROFESSIONAL LOG: 'Task Content' 'Source ➔ Destination'
            // Format: 'Naya Task' 'New ➔ Folder Name'
            logEvent(context, 'Create', `'${taskText}' 'New ➔ ${node.originalText}'`, null, null);
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
            let logTagText = "";

            if (tag.trim().toLowerCase() === "clear") {
                delete tagsDict[node.originalText]; 
                logTagText = "Cleared";
            } 
            else if (tag.trim() !== "") {
                tagsDict[node.originalText] = tag.trim(); 
                logTagText = tag.trim();
            }
            
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();

            // 🔥 PROFESSIONAL LOG: 'Task Content' 'Action ➔ Tag Value'
            if (logTagText !== "") {
                logEvent(context, 'Tag', `'${node.originalText}' 'Tag ➔ ${logTagText}'`, node.file, node.line);
            }
        }
    });

    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
            
            // 🔥 PROFESSIONAL LOG (Optional): 'Task Content' 'Action'
            logEvent(context, 'Copy', `'${node.originalText}' 'Reference ➔ Clipboard'`, node.file, node.line);
        }
    });
}

module.exports = { registerTaskCommands };