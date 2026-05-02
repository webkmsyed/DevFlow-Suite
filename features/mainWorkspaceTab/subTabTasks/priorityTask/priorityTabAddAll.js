// File: features/subTabs/priority/priorityTabAddAll.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerPriorityTabAddAll(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priAddAll', async () => {
        let pri = context.globalState.get('priorityTasks', []) || [];
        const manual = context.globalState.get('manualTasks', []) || [];
        const scanned = context.globalState.get('fileComments', []) || [];

        // Identity Fix: Sabko unique IDs ke sath dump karein
        manual.forEach(t => {
            if (!pri.some(p => p.id === t.id)) {
                pri.push({ ...t, type: 'task', isScanned: false });
            }
        });

        scanned.forEach(c => {
            const scanId = `${c.file}:${c.line}`;
            if (!pri.some(p => p.file === c.file && p.line === c.line)) {
                pri.push({ ...c, id: scanId, type: 'task', isScanned: true });
            }
        });

        await context.globalState.update('priorityTasks', pri);
        logEvent(context, 'Priority', 'Action ➔ All Workspace items added to Priority');
        todoProvider.refresh();
        vscode.window.showInformationMessage("DevFlow: All items added to Priority.");
    }));
}
module.exports = { registerPriorityTabAddAll };