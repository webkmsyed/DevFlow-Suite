// File: features/subTabTasks/general/generalTaskDelete.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { recordHistory } = require('../../commands/historyOps');

function registerGeneralTaskDelete(context, todoProvider) {
    // 🗑️ Command: Move to Recycle (jargon.taskDelTemp)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []) || [];
        const isScanned = node.contextValue !== 'standardTask' && node.file;

        const newItem = { 
            id: node.id || Date.now(), 
            text: node.originalText, 
            isScanned: isScanned, 
            deletedFrom: node.parentLabel || "General Workspace",
            originalFile: node.file || null,
            originalLine: node.line || null
        };

        // Logic: Agar manual task hai toh main list se hatao
        if (!isScanned) {
            let tasks = context.globalState.get('manualTasks', []) || [];
            tasks = tasks.filter(t => String(t.id) !== String(node.id));
            await context.globalState.update('manualTasks', tasks);
        } else {
            // Scanned comments ke liye humne treeRenderer mein filter lagaya hai[cite: 1]
        }

        trash.push(newItem);
        await context.globalState.update('trashData', trash);
        
        logEvent(context, 'Delete', `'${node.originalText}' 'General ➔ Recycle Bin'`, node.file, node.line);
        todoProvider.refresh();
    }));
}

module.exports = { registerGeneralTaskDelete };