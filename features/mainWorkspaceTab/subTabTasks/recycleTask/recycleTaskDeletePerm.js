// File: features/subTabTasks/recycle/recycleTaskDeletePerm.js
const vscode = require('vscode');
const { deleteItemsFromFiles } = require('../../subTabs/recycleTab/recycleHelpers');

function registerRecycleTaskDeletePerm(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelPerm', async (node) => {
        if (!node) return;

        let trash = context.globalState.get('trashData', []) || [];

        if (node.contextValue === 'recycleFolder') {
            const folderName = node.originalText || node.label;
            const folderItems = trash.filter(t => (t.deletedFrom || 'Unknown') === folderName);

            const realItems = folderItems.filter(t => !t._isFolderMarker);
            if (realItems.length === 0 && !folderItems.some(t => t._isFolderMarker)) {
                vscode.window.showInformationMessage("DevFlow: No items found in this recycle folder.");
                return;
            }

            const confirm = await vscode.window.showWarningMessage(
                `Permanently delete all ${realItems.length} item(s) in "${folderName}"?`,
                { modal: true }, "Delete All"
            );
            if (confirm !== "Delete All") return;

            // Remove from trash FIRST (scanner race fix)
            trash = trash.filter(t => (t.deletedFrom || 'Unknown') !== folderName);
            await context.globalState.update('trashData', trash);

            // Remove from priority
            let priorityTasks = context.globalState.get('priorityTasks', []) || [];
            const itemKeys = new Set(realItems.map(t =>
                t.isScanned ? `${t.originalFile}:${t.originalLine}` : String(t.id)
            ));
            priorityTasks = priorityTasks.filter(p => {
                const key = p.file ? `${p.file}:${p.line}` : String(p.id);
                return !itemKeys.has(key);
            });
            await context.globalState.update('priorityTasks', priorityTasks);

            // Delete scanned items from source files
            await deleteItemsFromFiles(realItems.filter(t => t.isScanned));

            todoProvider.refresh();
            return;
        }

        const itemToDelete = trash.find(t => {
            if (t._isFolderMarker) return false;
            return t.isScanned
                ? (t.originalFile === node.file && Number(t.originalLine) === Number(node.line))
                : (String(t.id) === String(node.id));
        });

        // Remove from trash FIRST
        trash = trash.filter(t => {
            if (t._isFolderMarker) return true;
            return t.isScanned
                ? (t.originalFile !== node.file || Number(t.originalLine) !== Number(node.line))
                : (String(t.id) !== String(node.id));
        });
        await context.globalState.update('trashData', trash);

        // Remove from priority
        if (itemToDelete) {
            let priorityTasks = context.globalState.get('priorityTasks', []) || [];
            const key = itemToDelete.isScanned
                ? `${itemToDelete.originalFile}:${itemToDelete.originalLine}`
                : String(itemToDelete.id);
            priorityTasks = priorityTasks.filter(p => {
                const pKey = p.file ? `${p.file}:${p.line}` : String(p.id);
                return pKey !== key;
            });
            await context.globalState.update('priorityTasks', priorityTasks);

            // Delete from source file
            if (itemToDelete.isScanned) {
                await deleteItemsFromFiles([itemToDelete]);
            }
        }

        todoProvider.refresh();
    }));
}
module.exports = { registerRecycleTaskDeletePerm };
