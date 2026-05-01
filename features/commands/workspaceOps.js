// File: features/commands/workspaceOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');
const { recordHistory } = require('./historyOps');

function registerWorkspaceCommands(context, todoProvider) {
    vscode.commands.registerCommand('jargon.mainDelete', async () => {
        const action = await vscode.window.showQuickPick([
            { label: 'Recycle All (Keep Priority)', detail: 'Moves everything except Priority to Recycle Bin.' },
            { label: 'Recycle Everything', detail: 'Moves ALL tasks/folders to Recycle Bin.' },
            { label: 'Permanent Wipe (Total)', detail: 'DANGER: Deletes EVERYTHING permanently!' }
        ], { placeHolder: 'Select Wipe Out Method' });

        if (!action) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []) || [];
        let manualTasks = context.globalState.get('manualTasks', []) || [];
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        let fileComments = context.globalState.get('fileComments', []) || [];

        const deletePhysicalComments = async (comments) => {
            const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (!rootPath || !comments.length) return;
            const edit = new vscode.WorkspaceEdit();
            const grouped = {};
            comments.forEach(c => { if (!grouped[c.file]) grouped[c.file] = []; grouped[c.file].push(c); });
            for (const file in grouped) {
                const fileUri = vscode.Uri.joinPath(rootPath, file);
                const sorted = grouped[file].sort((a, b) => b.line - a.line);
                for (const t of sorted) {
                    edit.delete(fileUri, new vscode.Range(new vscode.Position(t.line - 1, 0), new vscode.Position(t.line, 0)));
                }
            }
            await vscode.workspace.applyEdit(edit);
        };

        if (action.label.includes('Total')) {
            // Confirmation logic remains same for security[cite: 1]
            const confirm1 = await vscode.window.showWarningMessage("🚨 DANGER: Wipe DevFlow-Suite data?", { modal: true }, "Yes, Proceed");
            if (confirm1 !== "Yes, Proceed") return;

            const confirm2 = await vscode.window.showInputBox({ prompt: "TYPE 'WIPE OUT' TO CONFIRM" });
            if (confirm2 !== "WIPE OUT") return;

            await deletePhysicalComments(fileComments);
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('priorityTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('trashData', []);
            await context.globalState.update('itemTags', {});
            logEvent(context, 'Wipe', `'Full Workspace' 'System ➔ Permanently Deleted'`);
        } else {
            const keepPriority = action.label.includes('Keep Priority');
            
            manualTasks.forEach(t => trash.push({ ...t, deletedFrom: t.folder, isScanned: false }));
            if (!keepPriority) {
                priorityTasks.forEach(p => trash.push({ ...p, deletedFrom: 'Priority', isScanned: p.isScanned }));
                await context.globalState.update('priorityTasks', []);
            }
            fileComments.forEach(c => trash.push({ ...c, id: Date.now() + Math.random(), isScanned: true, originalFile: c.file, originalLine: c.line }));
            
            await deletePhysicalComments(fileComments);
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('trashData', trash);
            logEvent(context, 'Delete', `'All Items' 'Workspace ➔ Recycle Bin'`);
        }
        todoProvider.refresh();
    });
}

module.exports = { registerWorkspaceCommands };