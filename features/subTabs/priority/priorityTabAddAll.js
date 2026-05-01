// File: features/subTabs/priority/priorityTabAddAll.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerPriorityTabAddAll(context, todoProvider) {
    // 🌟 Command: Add All Workspace Items to Priority (jargon.priAddAll)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priAddAll', async () => {
        let pri = context.globalState.get('priorityTasks', []) || [];
        const manual = context.globalState.get('manualTasks', []) || [];
        const scanned = context.globalState.get('fileComments', []) || [];

        // Logic: Unique ID check taaki duplicates na hon
        manual.forEach(t => {
            if (!pri.some(p => String(p.id) === String(t.id))) {
                pri.push({ ...t, type: 'task', isScanned: false });
            }
        });

        scanned.forEach(c => {
            const scanId = `${c.file}:${c.line}`; // Identity Fix
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