// File: features/commands/workspaceOps.js
const vscode = require('vscode');

function registerWorkspaceCommands(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainDelete', async () => {
        // 1. Selection Option
        const action = await vscode.window.showQuickPick([
            { label: 'Recycle All (Keep Priority)', detail: 'Moves everything except Priority items to Recycle Bin.' },
            { label: 'Recycle Everything', detail: 'Moves ALL tasks and folders to Recycle Bin.' },
            { label: 'Permanent Wipe (Nuclear)', detail: 'DANGER: Deletes all data permanently. Cannot be undone!' }
        ], { placeHolder: 'Select Wipe Out Method' });

        if (!action) return;

        // 2. Confirmation Alert
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to proceed with: ${action.label}?`,
            { modal: true },
            "Yes, Proceed", "Cancel"
        );

        if (confirm !== "Yes, Proceed") return;

        let trash = context.globalState.get('trashData', []);
        let manualTasks = context.globalState.get('manualTasks', []);
        let priorityTasks = context.globalState.get('priorityTasks', []);
        let fileComments = context.globalState.get('fileComments', []);
        let userFolders = context.globalState.get('userFolders', []);

        if (action.label.includes('Permanent Wipe')) {
            // 🔥 NUCLEAR OPTION: Everything to null
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('priorityTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('trashData', []);
            await context.globalState.update('itemTags', {});
            vscode.window.showErrorMessage("DevFlow-Suite: Workspace wiped permanently!");
        } 
        else {
            // ♻️ RECYCLE LOGIC
            const keepPriority = action.label.includes('Keep Priority');
            
            // Manual Tasks move to trash
            manualTasks.forEach(t => trash.push({ ...t, deletedFrom: t.folder, isScanned: false }));
            
            // Priority move to trash (if not keeping)
            if (!keepPriority) {
                priorityTasks.forEach(p => trash.push({ ...p, deletedFrom: 'Priority', isScanned: p.isScanned }));
                await context.globalState.update('priorityTasks', []);
            }

            // Scanned comments logic: 
            // Wiping scanned means adding them to trash so provider hides them
            fileComments.forEach(c => trash.push({ ...c, deletedFrom: c.target, isScanned: true }));

            // Clean States
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []); // Folders removed, but contents in trash
            await context.globalState.update('trashData', trash);
            
            vscode.window.showInformationMessage(`DevFlow-Suite: Workspace recycled! ${keepPriority ? '(Priority Saved)' : ''}`);
        }

        todoProvider.refresh();
    }));
}

module.exports = { registerWorkspaceCommands };