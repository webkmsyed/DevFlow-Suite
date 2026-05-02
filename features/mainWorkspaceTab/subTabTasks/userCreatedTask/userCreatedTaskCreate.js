const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerUserCreatedTaskCreate(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTask', async (node) => {
        if (!node) return;
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });

        if (taskText) {
            recordHistory(context);
            let tasks = context.globalState.get('manualTasks', []);
            
            const newTask = { 
                id: Date.now() + Math.floor(Math.random() * 1000), 
                text: taskText, 
                folder: node.originalText 
            };
            
            tasks.push(newTask);
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
            
            logEvent(context, 'Create', `'${taskText}' 'New -> ${node.originalText}'`, null, null);
        }
    }));
}

module.exports = { registerUserCreatedTaskCreate };
