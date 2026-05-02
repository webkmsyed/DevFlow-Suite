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
        todoProvider.refresh();
        logEvent(context, 'Restore', `'${item.text}' 'Recycle Bin -> ${item.deletedFrom || "General Workspace"}'`, item.originalFile, item.originalLine);
        vscode.window.showInformationMessage(`DevFlow: '${item.text}' restored.`);
    }));
}

module.exports = { registerRecycleTaskRestore };
