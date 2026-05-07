// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

function registerRecycleTaskRestore(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRestore', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []) || [];

        // ── Folder node: restore all items in this recycle folder ──────────
        if (node.contextValue === 'recycleFolder' || node._recycleFolder) {
            const folderName = node._recycleFolder || node.originalText || node.label;
            const folderItems = trash.filter(t =>
                (t.deletedFrom || 'Unknown') === folderName && !t._isFolderMarker
            );

            // Recreate the user folder if it was a custom folder
            let userFolders = context.globalState.get('userFolders', []) || [];
            if (folderName !== 'General Workspace' && !userFolders.includes(folderName)) {
                userFolders.push(folderName);
                await context.globalState.update('userFolders', userFolders);
            }

            let manual = context.globalState.get('manualTasks', []) || [];
            let priorityTasks = context.globalState.get('priorityTasks', []) || [];
            let itemTags = context.globalState.get('itemTags', {}) || {};

            for (const item of folderItems) {
                const targetFolder = item._originalFolder || item.deletedFrom || folderName;

                if (item.isScanned && item.originalFile) {
                    try {
                        const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, item.originalFile);
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(fileUri, new vscode.Position((item.originalLine || 1) - 1, 0), `// ${item.text}\n`);
                        await vscode.workspace.applyEdit(edit);
                        const doc = await vscode.workspace.openTextDocument(fileUri);
                        await doc.save();
                    } catch (err) {
                        manual.push({ id: Date.now() + Math.random(), text: item.text, folder: targetFolder });
                    }
                } else {
                    manual.push({ id: item.id || Date.now() + Math.random(), text: item.text, folder: targetFolder });
                }

                // Restore priority
                if (item._wasInPriority) {
                    const alreadyIn = priorityTasks.some(p =>
                        item.isScanned
                            ? (p.file === item.originalFile && Number(p.line) === Number(item.originalLine))
                            : String(p.id) === String(item.id)
                    );
                    if (!alreadyIn) {
                        priorityTasks.push({ ...item, folder: targetFolder, target: targetFolder });
                    }
                }

                // Restore tag
                if (item._savedTag) {
                    const tagKey = item.id ? String(item.id) : `${item.originalFile}:${item.originalLine}`;
                    itemTags[tagKey] = item._savedTag;
                }
            }

            // Remove all entries for this folder from trash (items + folder marker)
            trash = trash.filter(t => (t.deletedFrom || 'Unknown') !== folderName);

            await context.globalState.update('manualTasks', manual);
            await context.globalState.update('priorityTasks', priorityTasks);
            await context.globalState.update('itemTags', itemTags);
            await context.globalState.update('trashData', trash);
            todoProvider.refresh();
            logEvent(context, 'Restore', `'${folderName}' 'Recycle Bin -> Folder Restored'`);
            vscode.window.showInformationMessage(`DevFlow: Folder "${folderName}" restored.`);
            return;
        }

        // ── Single task node ──────────────────────────────────────────────
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

        if (item.isScanned && item.originalFile) {
            try {
                const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, item.originalFile);
                const edit = new vscode.WorkspaceEdit();
                edit.insert(fileUri, new vscode.Position((item.originalLine || 1) - 1, 0), `// ${item.text}\n`);
                await vscode.workspace.applyEdit(edit);
                const doc = await vscode.workspace.openTextDocument(fileUri);
                await doc.save();
            } catch (err) {
                let manual = context.globalState.get('manualTasks', []) || [];
                manual.push({ id: Date.now(), text: item.text, folder: item.deletedFrom || 'General Workspace' });
                await context.globalState.update('manualTasks', manual);
            }
        } else {
            let manual = context.globalState.get('manualTasks', []) || [];
            manual.push({ id: item.id || Date.now(), text: item.text, folder: item._originalFolder || item.deletedFrom || 'General Workspace' });
            await context.globalState.update('manualTasks', manual);
        }

        trash.splice(itemIndex, 1);
        await context.globalState.update('trashData', trash);

        // Restore priority
        if (item._wasInPriority) {
            let priorityTasks = context.globalState.get('priorityTasks', []) || [];
            const alreadyIn = priorityTasks.some(p =>
                item.isScanned
                    ? (p.file === item.originalFile && Number(p.line) === Number(item.originalLine))
                    : String(p.id) === String(item.id)
            );
            if (!alreadyIn) {
                priorityTasks.push({
                    ...item,
                    folder: item._originalFolder || item.deletedFrom || 'General Workspace',
                    target: item._originalFolder || item.deletedFrom || 'General Workspace'
                });
                await context.globalState.update('priorityTasks', priorityTasks);
            }
        }

        // Restore tag
        if (item._savedTag) {
            let itemTags = context.globalState.get('itemTags', {}) || {};
            const tagKey = item.id ? String(item.id) : `${item.originalFile}:${item.originalLine}`;
            itemTags[tagKey] = item._savedTag;
            await context.globalState.update('itemTags', itemTags);
        }

        todoProvider.refresh();
        logEvent(context, 'Restore', `'${item.text}' 'Recycle Bin -> ${item.deletedFrom || "General Workspace"}'`, item.originalFile, item.originalLine);
        vscode.window.showInformationMessage(`DevFlow: '${item.text}' restored.`);
    }));
}

module.exports = { registerRecycleTaskRestore };
