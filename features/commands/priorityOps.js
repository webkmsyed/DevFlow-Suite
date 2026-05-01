// File: features/commands/priorityOps.js
const vscode = require('vscode');

function registerPriorityCommands(context, todoProvider) {
    
    // --- 1. SAVE TO PRIORITY (Main Button) ---
    vscode.commands.registerCommand('jargon.taskSavePri', async (node) => {
        if (!node) return;

        let pri = context.globalState.get('priorityTasks', []);
        
        // Identity Check: ID logic for Manual tasks OR File:Line for Scanned tasks
        const nodeId = node.id || `${node.file}:${node.line}`;
        
        const exists = pri.some(p => {
            const priId = p.id || `${p.file}:${p.line}`;
            return priId === nodeId;
        });

        if (!exists) {
            pri.push({ 
                id: node.id || null, // Manual ID
                text: node.originalText, 
                isScanned: node.contextValue === 'standardTask',
                file: node.file || null,
                line: node.line || null
            });
            await context.globalState.update('priorityTasks', pri);
            todoProvider.refresh();
            vscode.window.showInformationMessage("Moved to Priority Workspace.");
        } else {
            vscode.window.showWarningMessage("Item already exists in Priority.");
        }
    });

    // --- 2. REMOVE FROM PRIORITY ---
    vscode.commands.registerCommand('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        
        const nodeId = node.id || `${node.file}:${node.line}`;
        priority = priority.filter(p => (p.id || `${p.file}:${p.line}`) !== nodeId);
        
        await context.globalState.update('priorityTasks', priority);
        todoProvider.refresh();
    });

    // --- 3. CLEAR ENTIRE TAB ---
    vscode.commands.registerCommand('jargon.priRemoveAll', async () => {
        await context.globalState.update('priorityTasks', []);
        todoProvider.refresh();
        vscode.window.showInformationMessage("Priority Tab Cleared.");
    });
}

module.exports = { registerPriorityCommands };