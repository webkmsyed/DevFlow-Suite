// File: features/subTabs/priority/priorityTabCreate.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');

function registerPriorityTabCreate(context, todoProvider) {
    // Add a manual task directly into Priority tab
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priCreateTask', async () => {
        const taskText = await vscode.window.showInputBox({
            prompt: 'Add task directly to Priority',
            placeHolder: 'Task description…'
        });

        if (!taskText || taskText.trim() === '') return;

        const trimmed = taskText.trim();
        let pri = context.globalState.get('priorityTasks', []) || [];
        let manual = context.globalState.get('manualTasks', []) || [];

        // Create the manual task in General Workspace as well
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const newTask = { id: newId, text: trimmed, folder: 'General Workspace' };
        manual.push(newTask);

        // Also pin it directly to priority
        pri.push({
            id: newId,
            text: trimmed,
            type: 'task',
            isScanned: false,
            folder: 'General Workspace'
        });

        await context.globalState.update('manualTasks', manual);
        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();

        logEvent(context, 'Create', `'${trimmed}' 'Action -> Created in Priority'`);
        vscode.window.showInformationMessage(`DevFlow: Task "${trimmed}" added to Priority.`);
    }));
}

module.exports = { registerPriorityTabCreate };
