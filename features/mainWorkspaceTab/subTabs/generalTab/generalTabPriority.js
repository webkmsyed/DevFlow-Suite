// File: features/subTabs/general/generalTabPriority.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');

function registerGeneralTabPriority(context, todoProvider) {

    const togglePriority = async (node) => {
        if (!node) return;

        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        const manualTasks = context.globalState.get('manualTasks', []) || [];
        const fileComments = context.globalState.get('fileComments', []) || [];

        const folderName = node.originalText || node.label;
        const folderId = `folder:${folderName}`;

        // Check if this folder is already pinned (by checking if any task with this folder exists in priority)
        const isAlreadyPinned = priorityTasks.some(p => p._sourceFolder === folderId);

        if (isAlreadyPinned) {
            // UNSTAR: Remove all tasks that came from this folder
            priorityTasks = priorityTasks.filter(p => p._sourceFolder !== folderId);
            logEvent(context, 'Priority', `'${folderName}' 'Action -> Folder Unpinned from Priority'`);
            vscode.window.showInformationMessage(`DevFlow: '${folderName}' removed from Priority.`);
        } else {
            // STAR: Add all tasks from this folder to priority
            // FIX: Do NOT add the folder itself as an item — only add its tasks
            // FIX: Items STAY in general tab (we only add references to priority, not move them)

            const folderManual = manualTasks.filter(t => t.folder === folderName);
            folderManual.forEach(t => {
                const alreadyIn = priorityTasks.some(p => p.id && String(p.id) === String(t.id));
                if (!alreadyIn) {
                    priorityTasks.push({
                        ...t,
                        type: 'task',
                        isScanned: false,
                        _sourceFolder: folderId  // Track which folder this came from
                    });
                }
            });

            const folderScanned = fileComments.filter(c => c.target === folderName);
            folderScanned.forEach(c => {
                const scanId = `${c.file}:${c.line}`;
                const alreadyIn = priorityTasks.some(p => p.file === c.file && p.line === c.line);
                if (!alreadyIn) {
                    priorityTasks.push({
                        ...c,
                        id: scanId,
                        type: 'task',
                        isScanned: true,
                        _sourceFolder: folderId  // Track which folder this came from
                    });
                }
            });

            if (folderManual.length === 0 && folderScanned.length === 0) {
                vscode.window.showInformationMessage(`DevFlow: '${folderName}' is empty — no tasks to pin.`);
                return;
            }

            logEvent(context, 'Priority', `'${folderName}' 'Action -> Folder Pinned to Priority'`);
            vscode.window.showInformationMessage(`DevFlow: '${folderName}' pinned to Priority.`);
        }

        await context.globalState.update('priorityTasks', priorityTasks);
        todoProvider.refresh();
    };

    // FIX: Only ONE command for folder priority — removed jargon.subFolderPriority duplicate
    // The package.json should only have jargon.tabSavePri for standardTab (remove subFolderPriority from menus)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabSavePri', togglePriority));
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subFolderPriority', togglePriority)); // kept for backward compat
}

module.exports = { registerGeneralTabPriority };