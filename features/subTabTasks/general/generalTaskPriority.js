// File: features/subTabTasks/general/generalTaskPriority.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

/**
 * Handle Task-Level Priority (Star/Unstar Toggle).
 * Logic: Persistent in original folder, metadata for UI color.
 */
function registerGeneralTaskPriority(context, todoProvider) {
    
    // ⭐ Command: Toggle Task Priority (jargon.taskSavePri)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskSavePri', async (node) => {
        if (!node) return;

        let pri = context.globalState.get('priorityTasks', []) || [];
        
        // Identity Fix: Use ID for Manual, File:Line for Scanned
        const nodeId = node.id || `${node.file}:${node.line}`;
        const isScanned = !!node.file;

        const existingIdx = pri.findIndex(p => (p.id || `${p.file}:${p.line}`) === nodeId);

        if (existingIdx > -1) {
            // --- ❌ REMOVE: Toggle Off ---
            pri.splice(existingIdx, 1);
            logEvent(context, 'Priority', `Unstarred: '${node.originalText}' removed from Priority`);
        } else {
            // --- ⭐ ADD: Toggle On with Metadata ---
            pri.push({ 
                id: node.id || null, 
                text: node.originalText, 
                isScanned: isScanned, // For Blue (Scanned) vs Green (Manual)
                file: node.file || null,
                line: node.line || null,
                folder: node.parentLabel || "General Workspace"
            });
            logEvent(context, 'Priority', `Starred: '${node.originalText}' added to Priority`);
        }

        await context.globalState.update('priorityTasks', pri);
        todoProvider.refresh();
    }));
}

module.exports = { registerGeneralTaskPriority };