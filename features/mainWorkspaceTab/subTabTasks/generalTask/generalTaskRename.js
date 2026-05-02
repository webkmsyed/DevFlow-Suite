// File: features/subTabTasks/general/generalTaskRename.js
const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerGeneralTaskRename(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRename', async (node) => {
        if (!node) return;

        // Only manual tasks can be renamed (scanned tasks are tied to source code)
        if (node.file) {
            vscode.window.showWarningMessage(
                'DevFlow: Scanned code comments cannot be renamed here. Edit the source file instead.'
            );
            return;
        }

        const oldText = node.originalText || node.label;
        const newText = await vscode.window.showInputBox({
            prompt: 'Rename task:',
            value: oldText,
            placeHolder: 'New task name'
        });

        if (!newText || newText.trim() === '' || newText.trim() === oldText) return;

        const trimmed = newText.trim();
        recordHistory(context);

        // Update in manualTasks
        let manual = context.globalState.get('manualTasks', []) || [];
        const idx = manual.findIndex(t => String(t.id) === String(node.id));
        if (idx > -1) manual[idx].text = trimmed;
        await context.globalState.update('manualTasks', manual);

        // Update in priorityTasks if pinned
        let pri = context.globalState.get('priorityTasks', []) || [];
        const priIdx = pri.findIndex(p => p.id && String(p.id) === String(node.id));
        if (priIdx > -1) pri[priIdx].text = trimmed;
        await context.globalState.update('priorityTasks', pri);

        todoProvider.refresh();
        logEvent(context, 'Update', `'${oldText}' 'Action -> Renamed to ${trimmed}'`);
        vscode.window.showInformationMessage(`DevFlow: Task renamed to '${trimmed}'.`);
    }));
}

module.exports = { registerGeneralTaskRename };
