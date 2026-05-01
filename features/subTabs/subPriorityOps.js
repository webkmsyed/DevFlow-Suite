// File: features/subTabs/priorityOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');
const { recordHistory } = require('../commands/historyOps');

/**
 * Priority Tab ke advanced operations ko handle karta hai.
 * Luxury Minimalist approach: Minimal UI, Maximum Performance.
 */
function registerSubPriorityCommands(context, todoProvider) {
    
    // --- 1. BULK ADD SCANNED (jargon.priAddAll) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priAddAll', async () => {
        // Undo support ke liye current state save karein
        recordHistory(context);
        
        let fileComments = context.globalState.get('fileComments', []);
        let priorityTasks = context.globalState.get('priorityTasks', []);
        let initialCount = priorityTasks.length;

        // Logic: Agar item already priority mein nahi hai, toh hi add karein
        // Formula: $P_{new} = P_{old} \cup \{ c \in C \mid c \notin P_{old} \}$
        fileComments.forEach(comment => {
            const exists = priorityTasks.some(p => 
                p.text === comment.text && 
                p.file === comment.file && 
                p.line === comment.line
            );
            
            if (!exists) {
                priorityTasks.push({
                    text: comment.text,
                    isScanned: true,
                    file: comment.file,
                    line: comment.line
                });
            }
        });

        const addedCount = priorityTasks.length - initialCount;

        if (addedCount > 0) {
            await context.globalState.update('priorityTasks', priorityTasks);
            
            // Professional Audit Log
            logEvent(context, 'Priority', `Bulk Import: Added ${addedCount} items from Workspace`);
            
            todoProvider.refresh();
            vscode.window.showInformationMessage(`DevFlow-Suite: ${addedCount} scanned items pushed to Priority!`);
        } else {
            vscode.window.showInformationMessage("All items are already prioritized.");
        }
    }));

    // --- 2. PRIORITY EXPORT (jargon.priExport) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priExport', async () => {
        const priorityTasks = context.globalState.get('priorityTasks', []);
        
        if (priorityTasks.length === 0) {
            vscode.window.showWarningMessage("Priority list is empty. Nothing to export.");
            return;
        }

        // Professional Markdown Template
        let output = `# 💎 DevFlow-Suite: Priority Report\n`;
        output += `*Generated on: ${new Date().toLocaleString()}*\n\n---\n\n`;

        priorityTasks.forEach((task, index) => {
            const source = task.isScanned ? `  Scanned` : `  Manual`;
            output += `### ${index + 1}. [ ] ${task.text}\n`;
            output += `- **Type:** ${source}\n`;
            if (task.file) {
                output += `- **Ref:** \`${task.file}\` (Line ${task.line})\n`;
            }
            output += `\n`;
        });

        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        vscode.window.showInformationMessage("Priority Workspace exported successfully!");
    }));
}

module.exports = { registerSubPriorityCommands };