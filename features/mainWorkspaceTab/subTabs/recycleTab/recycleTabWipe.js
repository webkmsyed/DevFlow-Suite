// File: features/subTabs/recycle/recycleTabWipe.js
const vscode = require('vscode');
const { deleteItemsFromFiles, removeFolderFromPriority } = require('./recycleHelpers');

function registerRecycleTabWipe(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recDeleteAll', async () => {
        const trash = context.globalState.get('trashData', []) || [];

        if (trash.length === 0) {
            vscode.window.showInformationMessage("DevFlow: Recycle Bin is already empty.");
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            "Permanently delete all items in Recycle Bin?", { modal: true }, "Empty Bin"
        );
        if (confirm !== "Empty Bin") return;

        // Clear state FIRST so scanner (triggered by file saves) sees empty trash
        await context.globalState.update('trashData', []);

        // Remove all trashed items from priority
        const deletedFolders = new Set(trash.map(t => t.deletedFrom || 'Unknown'));
        for (const folder of deletedFolders) {
            await removeFolderFromPriority(folder, context);
        }
        // Also remove individual items from priority (for items without a folder group)
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        const trashKeys = new Set(trash.map(t =>
            t.isScanned ? `${t.originalFile}:${t.originalLine}` : String(t.id)
        ));
        priorityTasks = priorityTasks.filter(p => {
            const key = p.file ? `${p.file}:${p.line}` : String(p.id);
            return !trashKeys.has(key);
        });
        await context.globalState.update('priorityTasks', priorityTasks);

        // Physically delete scanned comments from source files
        const scannedItems = trash.filter(t => t.isScanned && !t._isFolderMarker);
        await deleteItemsFromFiles(scannedItems);

        todoProvider.refresh();
    }));
}
module.exports = { registerRecycleTabWipe };
