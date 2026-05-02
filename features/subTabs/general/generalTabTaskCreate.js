// File: features/subTabs/general/generalTabTaskCreate.js
const vscode = require('vscode');
const { recordHistory } = require('../../commands/historyOps');
const { logEvent } = require('../../engine/logger');

function registerGeneralTabTaskCreate(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabTask', async (node) => {
        if (!node) return;
        // Support both generalTab and userTab — use originalText or label
        const folderName = node.originalText || node.label || 'General Workspace';

        const taskText = await vscode.window.showInputBox({
            prompt: `Add new task to: "${folderName}"`,
            placeHolder: 'Task description…'
        });

        if (!taskText || taskText.trim() === '') return;

        recordHistory(context);
        let tasks = context.globalState.get('manualTasks', []) || [];
        tasks.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            text: taskText.trim(),
            folder: folderName
        });

        await context.globalState.update('manualTasks', tasks);
        todoProvider.refresh();
        logEvent(context, 'Create', `'${taskText.trim()}' 'Action -> Task added to ${folderName}'`);
        vscode.window.showInformationMessage(`DevFlow: Task added to "${folderName}".`);
    }));
}

module.exports = { registerGeneralTabTaskCreate };