// File: features/commands/priorityOps.js
const vscode = require('vscode');

function registerPriorityCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // 1. Save to Priority

    register('jargon.taskSavePri', async (node) => {
        if (!node) return;
        
        // Agar history/logger import kiya hai toh unhe yahan call karein
        // if(recordHistory) recordHistory(context); 

        let pri = context.globalState.get('priorityTasks', []);
        
        // Pura exact check (Same file + Same Line + Same Text)
        const exists = pri.some(p => p.text === node.originalText && p.file === node.file && p.line === node.line);

        if (!exists) {
            pri.push({ 
                text: node.originalText, 
                isScanned: node.contextValue === 'standardTask',
                file: node.file, // 🔥 Naya: File Save kiya
                line: node.line  // 🔥 Naya: Line Save kiya
            });
            await context.globalState.update('priorityTasks', pri);
            todoProvider.refresh();
            
            // 🔥 Naya: CCTV Log
            // logEvent(context, 'Priority', `Saved '${node.originalText}' to Priority`, node.file, node.line);
        } else {
            vscode.window.showInformationMessage("This specific item is already in Priority!");
        }
    });

    // 2. Remove from Priority
    register('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        priority = priority.filter(t => t.text !== node.originalText);
        await context.globalState.update('priorityTasks', priority);
        todoProvider.refresh();
    });

    // 3. Remove All Priorities (Clear Tab)
    register('jargon.priRemoveAll', async () => {
        await context.globalState.update('priorityTasks', []);
        todoProvider.refresh();
        vscode.window.showInformationMessage("All priorities cleared.");
    });
}

module.exports = { registerPriorityCommands };