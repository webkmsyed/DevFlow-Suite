// File: features/subTabs/general/generalTabTaskCreate.js
const vscode = require('vscode');
const { recordHistory } = require('../../commands/historyOps');
const { logEvent } = require('../../engine/logger');

function registerGeneralTabTaskCreate(context, todoProvider) {
    // ➕ Command: Create Task INSIDE this folder (jargon.tabTask)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTask', async (node) => {
        if (!node) return;
        const folderName = node.originalText; // Target folder name

        const taskText = await vscode.window.showInputBox({ 
            prompt: `Add new task to folder: ${folderName}`,
            placeHolder: "Task description..."
        });

        if (taskText && taskText.trim() !== "") {
            recordHistory(context);
            let tasks = context.globalState.get('manualTasks', []) || [];
            
            // Add new task with folder name as target
            tasks.push({ 
                id: Date.now(), 
                text: taskText.trim(), 
                folder: folderName 
            });

            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
            logEvent(context, 'Create', `'${taskText}' 'Action ➔ Task added to ${folderName}'`);
        }
    }));
}

module.exports = { registerGeneralTabTaskCreate };