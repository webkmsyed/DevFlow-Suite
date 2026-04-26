// File: features/commands/workspaceOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps'); // 📸 History Engine Bulaya!

function registerWorkspaceCommands(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainDelete', async () => {
        const action = await vscode.window.showQuickPick([
            { label: 'Recycle All (Keep Priority)', detail: 'Moves everything except Priority items to Recycle Bin.' },
            { label: 'Recycle Everything', detail: 'Moves ALL tasks and folders to Recycle Bin.' },
            { label: 'Permanent Wipe (Keep Priority)', detail: 'DANGER: Deletes all user folders & tasks permanently!' }
        ], { placeHolder: 'Select Wipe Out Method' });

        if (!action) return;

        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to proceed with: ${action.label}?`,
            { modal: true },
            "Yes, Proceed"
        );

        if (confirm !== "Yes, Proceed") return;

        recordHistory(context); // 🔥 WIPE OUT SE PEHLE BHI SNAPSHOT LE LIYA! (Ab Undo kaam karega)

        let trash = context.globalState.get('trashData') || [];
        let manualTasks = context.globalState.get('manualTasks') || [];
        let priorityTasks = context.globalState.get('priorityTasks') || [];
        let fileComments = context.globalState.get('fileComments') || [];

        // 🚀 THE PHYSICAL DELETE ENGINE
        const deletePhysicalComments = async (comments) => {
            if (!comments || comments.length === 0) return;
            const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (!rootPath) return;

            const edit = new vscode.WorkspaceEdit();
            const grouped = {};
            comments.forEach(c => { if (!grouped[c.file]) grouped[c.file] = []; grouped[c.file].push(c); });

            for (const file in grouped) {
                const fileUri = vscode.Uri.joinPath(rootPath, file);
                const sortedComments = grouped[file].sort((a, b) => b.line - a.line);
                for (const target of sortedComments) {
                    edit.delete(fileUri, new vscode.Range(new vscode.Position(target.line - 1, 0), new vscode.Position(target.line, 0)));
                }
            }
            await vscode.workspace.applyEdit(edit);

            for (const file in grouped) {
                try {
                    const fileUri = vscode.Uri.joinPath(rootPath, file);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (e) { }
            }
        };

        if (action.label.includes('Permanent Wipe')) {
            // 🔥 NAYA NUCLEAR LOGIC: Sab delete hoga par Priority bachi rahegi
            await deletePhysicalComments(fileComments);

            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('fileComments', []);
            await context.globalState.update('trashData', []);

            // Priority ke tags bachane ka logic
            const currentTags = context.globalState.get('itemTags') || {};
            const safePriorityTags = {};
            priorityTasks.forEach(p => {
                if (currentTags[p.text]) safePriorityTags[p.text] = currentTags[p.text];
            });
            await context.globalState.update('itemTags', safePriorityTags);

            vscode.window.showInformationMessage("DevFlow-Suite: User folders & tasks wiped permanently! (Priority safe)");
        }
        else {
            // ♻️ RECYCLE LOGIC
            const keepPriority = action.label.includes('Keep Priority');

            manualTasks.forEach(t => trash.push({ ...t, deletedFrom: t.folder, isScanned: false, isPriority: false }));

            if (!keepPriority) {
                priorityTasks.forEach(p => trash.push({ ...p, deletedFrom: 'Priority', isScanned: p.isScanned, isPriority: true }));
                await context.globalState.update('priorityTasks', []);
            }

            fileComments.forEach(c => {
                trash.push({ id: Date.now() + Math.random(), text: c.text, deletedFrom: c.target, isScanned: true, originalLine: c.line, originalFile: c.file, isPriority: priorityTasks.some(p => p.text === c.text) });
            });

            await deletePhysicalComments(fileComments);

            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('fileComments', []);
            await context.globalState.update('trashData', trash);

            vscode.window.showInformationMessage(`DevFlow-Suite: Workspace recycled! ${keepPriority ? '(Priority Saved)' : ''}`);
        }

        todoProvider.refresh();
    }));
}

module.exports = { registerWorkspaceCommands };