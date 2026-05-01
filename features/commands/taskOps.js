// File: features/commands/taskOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps');
const { logEvent } = require('../engine/logger');

function registerTaskCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // --- ADD MANUAL TASK ---
    register('jargon.tabTask', async (node) => {
        if (!node) return;
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });

        if (taskText) {
            recordHistory(context);
            let tasks = context.globalState.get('manualTasks', []);
            
            // Unique ID generation for manual tasks
            const newTask = { 
                id: Date.now() + Math.floor(Math.random() * 1000), 
                text: taskText, 
                folder: node.originalText 
            };
            
            tasks.push(newTask);
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
            
            logEvent(context, 'Create', `'${taskText}' 'New ➔ ${node.originalText}'`, null, null);
        }
    });

    // --- ADD/REMOVE TAGS ---
    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ 
            prompt: `Tag for "${node.originalText}"`,
            placeHolder: "Type tag (e.g., bug) OR type 'clear' to remove" 
        });

        if (tag !== undefined) {
            recordHistory(context);
            let tagsDict = context.globalState.get('itemTags', {});
            
            // Identity Fix: Tagging based on unique ID or File:Line[cite: 1]
            const itemKey = node.id || `${node.file}:${node.line}`; 
            let logTagText = "";

            if (tag.trim().toLowerCase() === "clear") {
                delete tagsDict[itemKey];
                logTagText = "Cleared";
            } else if (tag.trim() !== "") {
                tagsDict[itemKey] = tag.trim();
                logTagText = tag.trim();
            }

            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
            if (logTagText !== "") {
                logEvent(context, 'Tag', `'${node.originalText}' 'Tag ➔ ${logTagText}'`, node.file, node.line);
            }
        }
    });

    // --- COPY TEXT ---
    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
            logEvent(context, 'Copy', `'${node.originalText}' 'Reference ➔ Clipboard'`, node.file, node.line);
        }
    });
}

module.exports = { registerTaskCommands };