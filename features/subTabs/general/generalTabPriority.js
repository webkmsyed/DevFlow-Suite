// File: features/subTabs/general/generalTabPriority.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerGeneralTabPriority(context, todoProvider) {
    // 🌟 Command: Star Whole Folder (jargon.tabSavePri)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSavePri', async (node) => {
        if (!node) return;

        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        const manualTasks = context.globalState.get('manualTasks', []) || [];
        const fileComments = context.globalState.get('fileComments', []) || [];

        const folderName = node.originalText;
        const folderId = `folder:${folderName}`;

        // 1. Logic: Add Folder Instance to Priority
        if (!priorityTasks.some(p => p.id === folderId)) {
            priorityTasks.push({ id: folderId, text: folderName, type: 'folder', isScanned: false });
        }

        // 2. Logic: Add all child tasks to Priority
        // Formula: $P_{new} = P_{old} \cup \{ \text{Folder} \} \cup \{ \text{Tasks} \in \text{Folder} \}$
        const folderManual = manualTasks.filter(t => t.folder === folderName);
        const folderScanned = fileComments.filter(c => c.target === folderName);

        folderManual.forEach(t => {
            if (!priorityTasks.some(p => p.id === t.id)) {
                priorityTasks.push({ ...t, type: 'task', isScanned: false });
            }
        });

        folderScanned.forEach(c => {
            if (!priorityTasks.some(p => p.file === c.file && p.line === c.line)) {
                priorityTasks.push({ ...c, id: `${c.file}:${c.line}`, type: 'task', isScanned: true });
            }
        });

        await context.globalState.update('priorityTasks', priorityTasks);
        logEvent(context, 'Priority', `Tab Star: Listed '${folderName}' in Priority Workspace`);
        
        todoProvider.refresh();
        vscode.window.showInformationMessage(`DevFlow: '${folderName}' and its tasks are now pinned in Priority.`);
    }));
}

module.exports = { registerGeneralTabPriority };