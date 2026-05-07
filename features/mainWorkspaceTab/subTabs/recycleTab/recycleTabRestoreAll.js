// File: features/subTabs/recycle/recycleTabRestoreAll.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');
const { restoreItemToWorkspace, restoreItemMeta } = require('./recycleHelpers');

function registerRecycleTabRestoreAll(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recRestoreAll', async () => {
        const trash = context.globalState.get('trashData', []) || [];

        if (trash.length === 0) {
            vscode.window.showInformationMessage("DevFlow: Recycle Bin is already empty.");
            return;
        }

        const realItems = trash.filter(t => !t._isFolderMarker);
        const confirm = await vscode.window.showWarningMessage(
            `Restore all ${realItems.length} item(s) from Recycle Bin?`,
            { modal: true }, "Restore All"
        );
        if (confirm !== "Restore All") return;

        recordHistory(context);

        // Recreate user folders first (from markers and item deletedFrom)
        let userFolders = context.globalState.get('userFolders', []) || [];
        trash.forEach(t => {
            const folder = t._originalFolder || t.deletedFrom;
            if (folder && folder !== 'General Workspace' && !userFolders.includes(folder)) {
                userFolders.push(folder);
            }
        });
        await context.globalState.update('userFolders', userFolders);

        // Clear trash BEFORE restoring so scanner triggered by doc.save won't re-add items
        await context.globalState.update('trashData', []);

        for (const item of realItems) {
            await restoreItemToWorkspace(item, context);
            await restoreItemMeta(item, context);
        }

        todoProvider.refresh();
        logEvent(context, 'Restore', `'All Items' 'Recycle Bin -> Workspace'`);
        vscode.window.showInformationMessage(`DevFlow: All items restored.`);
    }));
}

module.exports = { registerRecycleTabRestoreAll };
