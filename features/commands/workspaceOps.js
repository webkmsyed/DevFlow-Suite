// File: features/commands/workspaceOps.js
const vscode = require('vscode');
const { recordHistory } = require('./historyOps');

function registerWorkspaceCommands(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainDelete', async () => {
        const action = await vscode.window.showQuickPick([
            { label: 'Recycle All (Keep Priority)', detail: 'Moves everything except Priority to Recycle Bin.' },
            { label: 'Recycle Everything', detail: 'Moves ALL tasks/folders to Recycle Bin.' },
            { label: 'Permanent Wipe (Total)', detail: 'DANGER: Deletes EVERYTHING including Priority & Folders permanently!' }
        ], { placeHolder: 'Select Wipe Out Method' });

        if (!action) return;

        // 🔥 MULTI-STEP VERIFICATION LOGIC
        if (action.label.includes('Total')) {
            // Step 1: Explicit Warning Dialog
            const confirm1 = await vscode.window.showWarningMessage(
                "🚨 DANGER: This will permanently delete:\n1. All User Folders & Tasks\n2. All Priority Items\n3. The Entire Recycle Bin\n4. ALL Scanned Comments physically from your code files!\n\nAre you absolutely sure?",
                { modal: true },
                "Yes, Proceed to Final Step"
            );
            
            if (confirm1 !== "Yes, Proceed to Final Step") return;

            // Step 2: Typing Verification (The GitHub Style Lock)
            const confirm2 = await vscode.window.showInputBox({
                prompt: "TYPE 'WIPE OUT' TO CONFIRM PERMANENT DELETION.",
                placeHolder: "WIPE OUT",
                validateInput: text => {
                    return text === "WIPE OUT" ? null : "Type exactly 'WIPE OUT' (all caps) to proceed.";
                }
            });

            if (confirm2 !== "WIPE OUT") {
                vscode.window.showInformationMessage("DevFlow-Suite: Wipe out aborted. Your data is safe.");
                return;
            }
        } else {
            // Normal Recycle Warning
            const confirm = await vscode.window.showWarningMessage(
                `Proceed with ${action.label}?`,
                { modal: true },
                "Yes, Do it"
            );
            if (confirm !== "Yes, Do it") return;
        }

        recordHistory(context); // 📸 Snapshot taken

        let trash = context.globalState.get('trashData') || [];
        let manualTasks = context.globalState.get('manualTasks') || [];
        let priorityTasks = context.globalState.get('priorityTasks') || [];
        let fileComments = context.globalState.get('fileComments') || [];

        const deletePhysicalComments = async (comments) => {
            if (!comments || comments.length === 0) return;
            const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri;
            if (!rootPath) return;
            const edit = new vscode.WorkspaceEdit();
            const grouped = {};
            comments.forEach(c => { if(!grouped[c.file]) grouped[c.file] = []; grouped[c.file].push(c); });
            for (const file in grouped) {
                const fileUri = vscode.Uri.joinPath(rootPath, file);
                const sorted = grouped[file].sort((a, b) => b.line - a.line);
                for (const t of sorted) {
                    edit.delete(fileUri, new vscode.Range(new vscode.Position(t.line - 1, 0), new vscode.Position(t.line, 0)));
                }
            }
            await vscode.workspace.applyEdit(edit);
            for (const f in grouped) {
                try { const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(rootPath, f)); await doc.save(); } catch(e){}
            }
        };

        if (action.label.includes('Total')) {
            // 🔥 NUCLEAR
            await deletePhysicalComments(fileComments);
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('priorityTasks', []); 
            await context.globalState.update('userFolders', []);
            await context.globalState.update('fileComments', []);
            await context.globalState.update('trashData', []);
            await context.globalState.update('itemTags', {});
            vscode.window.showErrorMessage("DevFlow-Suite: Workspace completely wiped!");
        } else {
            // ♻️ RECYCLE
            const keepPriority = action.label.includes('Keep Priority');
            manualTasks.forEach(t => trash.push({ ...t, deletedFrom: t.folder, isScanned: false, isPriority: false }));
            if (!keepPriority) {
                priorityTasks.forEach(p => trash.push({ ...p, deletedFrom: 'Priority', isScanned: p.isScanned, isPriority: true }));
                await context.globalState.update('priorityTasks', []); 
            }
            fileComments.forEach(c => {
                trash.push({ id: Date.now()+Math.random(), text: c.text, deletedFrom: c.target, isScanned: true, originalLine: c.line, originalFile: c.file, isPriority: priorityTasks.some(p => p.text === c.text) });
            });
            await deletePhysicalComments(fileComments);
            await context.globalState.update('manualTasks', []);
            await context.globalState.update('userFolders', []);
            await context.globalState.update('fileComments', []);
            await context.globalState.update('trashData', trash);
            vscode.window.showInformationMessage("DevFlow-Suite: Items moved to Recycle Bin.");
        }
        todoProvider.refresh();
    }));
}
module.exports = { registerWorkspaceCommands };