// File: features/subTabs/general/generalTabDelete.js
const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerGeneralTabDelete(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
        if (!node) return;
        const folderName = node.originalText || node.label;

        // Block system folder
        if (folderName === 'General Workspace') {
            vscode.window.showWarningMessage("DevFlow: 'General Workspace' cannot be deleted.");
            return;
        }

        // Ask what to do with tasks inside
        const action = await vscode.window.showWarningMessage(
            `Delete folder "${folderName}"? What should happen to tasks inside?`,
            { modal: true },
            'Move Tasks to Recycle Bin',
            'Move Tasks to General Workspace'
        );

        if (!action) return;
        recordHistory(context);

        let folders = context.globalState.get('userFolders', []) || [];
        let manualTasks = context.globalState.get('manualTasks', []) || [];
        let fileComments = context.globalState.get('fileComments', []) || [];
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        let trash = context.globalState.get('trashData', []) || [];

        // 1. Remove folder from list
        folders = folders.filter(f => f !== folderName);
        await context.globalState.update('userFolders', folders);

        const folderManual = manualTasks.filter(t => t.folder === folderName);
        const folderScanned = fileComments.filter(c => c.target === folderName);

        if (action === 'Move Tasks to Recycle Bin') {
            // Move manual tasks to recycle bin
            folderManual.forEach(t => {
                trash.push({ ...t, deletedFrom: folderName, isScanned: false });
            });

            // Move scanned comments to recycle bin
            folderScanned.forEach(c => {
                trash.push({
                    ...c,
                    id: Date.now() + Math.random(),
                    isScanned: true,
                    originalFile: c.file,
                    originalLine: c.line,
                    deletedFrom: folderName
                });
            });

            // Remove from manualTasks
            manualTasks = manualTasks.filter(t => t.folder !== folderName);
            // Remove from fileComments (they're now in trash)
            fileComments = fileComments.filter(c => c.target !== folderName);

            await context.globalState.update('trashData', trash);
            await context.globalState.update('fileComments', fileComments);

        } else {
            // Move tasks to General Workspace
            manualTasks.forEach(t => {
                if (t.folder === folderName) t.folder = 'General Workspace';
            });
            fileComments.forEach(c => {
                if (c.target === folderName) c.target = 'General Workspace';
            });
            await context.globalState.update('fileComments', fileComments);
        }

        // Update manual tasks either way
        await context.globalState.update('manualTasks', manualTasks);

        // Clean priority tasks that referenced this folder
        priorityTasks = priorityTasks.filter(p => {
            if (p._sourceFolder === `folder:${folderName}`) return false;
            return true;
        });
        await context.globalState.update('priorityTasks', priorityTasks);

        todoProvider.refresh();
        logEvent(context, 'Delete', `'${folderName}' 'Folder -> ${action.includes('Recycle') ? 'Recycle Bin' : 'General'}'`);
        vscode.window.showInformationMessage(`DevFlow: Folder "${folderName}" deleted.`);
    }));
}

module.exports = { registerGeneralTabDelete };
