// File: features/subTabTasks/recycle/recycleTaskRestore.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

function registerRecycleTaskRestore(context, todoProvider) {
    // BUG 3 FIX: was 'jargon.recycleRestore' — package.json needs 'jargon.taskRestore'
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskRestore', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []) || [];
        const itemIndex = trash.findIndex(t =>
            t.isScanned
                ? (t.originalFile === node.file && t.originalLine === node.line)
                : (String(t.id) === String(node.id))
        );

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
                // Fallback: restore as manual task
                let manual = context.globalState.get('manualTasks', []) || [];
                manual.push({ id: Date.now(), text: item.text, folder: item.deletedFrom || 'General Workspace' });
                await context.globalState.update('manualTasks', manual);
            }
        } else {
            let manual = context.globalState.get('manualTasks', []) || [];
            manual.push({ id: item.id || Date.now(), text: item.text, folder: item.deletedFrom || 'General Workspace' });
            await context.globalState.update('manualTasks', manual);
        }

        trash.splice(itemIndex, 1);
        await context.globalState.update('trashData', trash);

        // Restore priority state if it was pinned before deletion
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

        // Restore tag if it was tagged before deletion
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
