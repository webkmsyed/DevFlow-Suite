// File: features/subTabTasks/general/generalTaskPriority.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerGeneralTaskPriority(context, todoProvider) {
    // ⭐ Command: Save Single Task to Priority (jargon.taskSavePri)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskSavePri', async (node) => {
        if (!node) return;

        let pri = context.globalState.get('priorityTasks', []) || [];
        const nodeId = node.id || `${node.file}:${node.line}`; // Unique ID Fix[cite: 1]

        const exists = pri.some(p => (p.id || `${p.file}:${p.line}`) === nodeId);

        if (!exists) {
            pri.push({ 
                id: node.id || null, 
                text: node.originalText, 
                isScanned: node.contextValue !== 'standardTask',
                file: node.file || null,
                line: node.line || null
            });
            await context.globalState.update('priorityTasks', pri);
            todoProvider.refresh();
            logEvent(context, 'Priority', `'${node.originalText}' 'General ➔ Priority'`);
        } else {
            vscode.window.showInformationMessage("Already in Priority.");
        }
    }));
}

module.exports = { registerGeneralTaskPriority };