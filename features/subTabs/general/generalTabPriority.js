// File: features/subTabs/general/generalTabPriority.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

/**
 * Handle Folder-Level Priority (Star/Unstar).
 * Logic: Recursive Toggle (Folder + All Tasks).
 */
function registerGeneralTabPriority(context, todoProvider) {
    
    const togglePriority = async (node) => {
        if (!node) return;

        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        const manualTasks = context.globalState.get('manualTasks', []) || [];
        const fileComments = context.globalState.get('fileComments', []) || [];

        const folderName = node.originalText || node.label;
        const folderId = `folder:${folderName}`;

        const isPinned = priorityTasks.some(p => p.id === folderId);

        if (isPinned) {
            // --- ❌ UNSTAR LOGIC: Remove Folder and its Tasks ---
            priorityTasks = priorityTasks.filter(p => 
                p.id !== folderId && 
                p.folder !== folderName && 
                p.target !== folderName
            );
            logEvent(context, 'Priority', `Unpinned: '${folderName}' and items removed from Priority`);
            vscode.window.showInformationMessage(`DevFlow: '${folderName}' removed from Priority.`);
        } else {
            // --- ⭐ STAR LOGIC: Add Folder and All Current Tasks ---
            // 1. Add Folder Instance
            priorityTasks.push({ 
                id: folderId, 
                text: folderName, 
                type: 'folder', 
                isScanned: false 
            });

            // 2. Add Manual Tasks belonging to this folder
            const folderManual = manualTasks.filter(t => t.folder === folderName);
            folderManual.forEach(t => {
                if (!priorityTasks.some(p => String(p.id) === String(t.id))) {
                    priorityTasks.push({ ...t, type: 'task', isScanned: false });
                }
            });

            // 3. Add Scanned Comments belonging to this folder
            const folderScanned = fileComments.filter(c => c.target === folderName);
            folderScanned.forEach(c => {
                const scanId = `${c.file}:${c.line}`;
                if (!priorityTasks.some(p => p.id === scanId)) {
                    priorityTasks.push({ ...c, id: scanId, type: 'task', isScanned: true });
                }
            });

            logEvent(context, 'Priority', `Pinned: '${folderName}' and all items added to Priority`);
            vscode.window.showInformationMessage(`DevFlow: '${folderName}' pinned to Priority.`);
        }

        await context.globalState.update('priorityTasks', priorityTasks);
        todoProvider.refresh();
    };

    // Fix for Bug 2 & 8: Registering both command IDs
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSavePri', togglePriority));
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subFolderPriority', togglePriority));
}

module.exports = { registerGeneralTabPriority };