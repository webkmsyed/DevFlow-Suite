// File: features/subTabs/recycle/recycleTabWipe.js
const vscode = require('vscode');

// Helper: physically delete scanned comment lines from source files
async function deleteFromSourceFiles(items) {
    if (!vscode.workspace.workspaceFolders?.[0]) return;

    const byFile = {};
    for (const item of items) {
        const f = item.originalFile || item.file;
        const l = item.originalLine || item.line;
        if (f && l) {
            if (!byFile[f]) byFile[f] = [];
            byFile[f].push(Number(l));
        }
    }

    for (const [relFile, lines] of Object.entries(byFile)) {
        try {
            const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relFile);
            const edit = new vscode.WorkspaceEdit();
            const sorted = [...new Set(lines)].sort((a, b) => b - a);
            for (const ln of sorted) {
                edit.delete(fileUri, new vscode.Range(
                    new vscode.Position(ln - 1, 0),
                    new vscode.Position(ln, 0)
                ));
            }
            await vscode.workspace.applyEdit(edit);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await doc.save();
        } catch (e) { /* file may be read-only or deleted — skip */ }
    }
}

function registerRecycleTabWipe(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recDeleteAll', async () => {
        const trash = context.globalState.get('trashData', []) || [];

        if (trash.length === 0) {
            vscode.window.showInformationMessage("DevFlow: Recycle Bin is already empty.");
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            "Permanently delete all items in Recycle Bin?", { modal: true }, "Empty Bin"
        );
        if (confirm === "Empty Bin") {
            // First, physically delete all scanned items from their source files
            const scannedItems = trash.filter(t => t.isScanned && !t._isFolderMarker);
            await deleteFromSourceFiles(scannedItems);

            // Then clear the trash state (no logEvent — avoids scanner re-run)
            await context.globalState.update('trashData', []);
            todoProvider.refresh();
        }
    }));
}
module.exports = { registerRecycleTabWipe };
