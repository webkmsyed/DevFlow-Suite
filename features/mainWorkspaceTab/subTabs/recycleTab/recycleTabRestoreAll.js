// File: features/subTabs/recycle/recycleTabRestoreAll.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

function registerRecycleTabRestoreAll(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recRestoreAll', async () => {
        const trash = context.globalState.get('trashData', []) || [];

        if (trash.length === 0) {
            vscode.window.showInformationMessage("DevFlow: Recycle Bin is already empty.");
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Restore all ${trash.length} item(s) from Recycle Bin?`,
            { modal: true }, "Restore All"
        );
        if (confirm !== "Restore All") return;

        recordHistory(context);
        let manual = context.globalState.get('manualTasks', []) || [];
        let userFolders = context.globalState.get('userFolders', []) || [];
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];

        for (const item of trash) {
            // Skip folder marker entries — they are not real tasks
            if (item._isFolderMarker) {
                // Recreate the folder if it no longer exists
                const folderName = item._originalFolder || item.deletedFrom;
                if (folderName && folderName !== 'General Workspace' && !userFolders.includes(folderName)) {
                    userFolders.push(folderName);
                }
                continue;
            }

            // Recreate the source folder if needed
            const targetFolder = item._originalFolder || item.deletedFrom || 'General Workspace';
            if (targetFolder !== 'General Workspace' && !userFolders.includes(targetFolder)) {
                userFolders.push(targetFolder);
            }

            if (item.isScanned && item.originalFile) {
                try {
                    const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, item.originalFile);
                    const edit = new vscode.WorkspaceEdit();
                    edit.insert(fileUri, new vscode.Position((item.originalLine || 1) - 1, 0), `// ${item.text}\n`);
                    await vscode.workspace.applyEdit(edit);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (err) {
                    // Fallback: restore as manual task in its original folder
                    manual.push({ id: Date.now() + Math.random(), text: item.text, folder: targetFolder });
                }
            } else {
                manual.push({
                    id: item.id || Date.now() + Math.random(),
                    text: item.text,
                    folder: targetFolder
                });
            }

            // Re-add to priority if it was there before deletion
            if (item._wasInPriority) {
                const alreadyInPriority = priorityTasks.some(p =>
                    item.isScanned
                        ? (p.file === item.originalFile && p.line === item.originalLine)
                        : String(p.id) === String(item.id)
                );
                if (!alreadyInPriority) {
                    priorityTasks.push({ ...item, folder: targetFolder, target: targetFolder });
                }
            }
        }

        await context.globalState.update('userFolders', userFolders);
        await context.globalState.update('manualTasks', manual);
        await context.globalState.update('priorityTasks', priorityTasks);
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
        logEvent(context, 'Restore', `'All Items' 'Recycle Bin -> Workspace'`);
        vscode.window.showInformationMessage(`DevFlow: All items restored.`);
    }));
}

module.exports = { registerRecycleTabRestoreAll };
