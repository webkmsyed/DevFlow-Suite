// File: features/subTabs/recycle/recycleTabRestoreAll.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

function registerRecycleTabRestoreAll(context, todoProvider) {
    // BUG 8 FIX: jargon.recRestoreAll was in package.json but NEVER registered anywhere
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

        for (const item of trash) {
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
                    manual.push({ id: Date.now() + Math.random(), text: item.text, folder: item.deletedFrom || 'General Workspace' });
                }
            } else {
                manual.push({
                    id: item.id || Date.now() + Math.random(),
                    text: item.text,
                    folder: item.deletedFrom || 'General Workspace'
                });
            }
        }

        await context.globalState.update('manualTasks', manual);
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
        logEvent(context, 'Restore', `'All Items' 'Recycle Bin -> Workspace (${trash.length} items)'`);
        vscode.window.showInformationMessage(`DevFlow: ${trash.length} item(s) restored.`);
    }));
}

module.exports = { registerRecycleTabRestoreAll };
