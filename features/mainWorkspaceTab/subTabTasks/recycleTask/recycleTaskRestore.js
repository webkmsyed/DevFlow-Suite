// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');
const { restoreItemToWorkspace, restoreItemMeta } = require('../../subTabs/recycleTab/recycleHelpers');

function registerRecycleTaskRestore(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRestore', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []) || [];

        // ── Folder node: restore entire recycled folder ────────────────────
        if (node.contextValue === 'recycleFolder' || node._recycleFolder) {
            const folderName = node._recycleFolder || node.originalText || node.label;
            const folderItems = trash.filter(t =>
                (t.deletedFrom || 'Unknown') === folderName && !t._isFolderMarker
            );

            // Recreate user folder
            let userFolders = context.globalState.get('userFolders', []) || [];
            if (folderName !== 'General Workspace' && !userFolders.includes(folderName)) {
                userFolders.push(folderName);
                await context.globalState.update('userFolders', userFolders);
            }

            // ── COMMIT TRASH FIRST so scanner (triggered by doc.save) sees
            //    these items as restored, not trashed — otherwise scanner skips them
            trash = trash.filter(t => (t.deletedFrom || 'Unknown') !== folderName);
            await context.globalState.update('trashData', trash);

            // Now restore items to files / manualTasks
            for (const item of folderItems) {
                await restoreItemToWorkspace(item, context);
                await restoreItemMeta(item, context);
            }

            todoProvider.refresh();
            logEvent(context, 'Restore', `'${folderName}' 'Recycle Bin -> Folder Restored'`);
            vscode.window.showInformationMessage(`DevFlow: Folder "${folderName}" restored.`);
            return;
        }

        // ── Single task node ───────────────────────────────────────────────
        const itemIndex = trash.findIndex(t => {
            if (t._isFolderMarker) return false;
            if (t.isScanned) {
                return t.originalFile === node.file &&
                       Number(t.originalLine) === Number(node.line);
            }
            return String(t.id) === String(node.id);
        });

        if (itemIndex === -1) {
            vscode.window.showWarningMessage("DevFlow: Item not found in Recycle Bin.");
            return;
        }

        const item = trash[itemIndex];
        trash.splice(itemIndex, 1);

        // Commit updated trash BEFORE restoring to file
        // (so scanner triggered by doc.save won't re-add as trash)
        await context.globalState.update('trashData', trash);

        await restoreItemToWorkspace(item, context);
        await restoreItemMeta(item, context);

        todoProvider.refresh();
        logEvent(context, 'Restore',
            `'${item.text}' 'Recycle Bin -> ${item.deletedFrom || "General Workspace"}'`,
            item.originalFile, item.originalLine
        );
        vscode.window.showInformationMessage(`DevFlow: '${item.text}' restored.`);
    }));
}

module.exports = { registerRecycleTaskRestore };
