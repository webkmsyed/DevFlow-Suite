// File: features/subTabTasks/recycle/recycleTaskDeletePerm.js
const vscode = require('vscode');

// Helper: physically delete scanned comment lines from source files
// Deletes one line at a time (sequential) to avoid VS Code range-adjustment conflicts
// that silently drop lines when multiple ranges are applied in a single WorkspaceEdit.
async function deleteFromSourceFiles(items) {
    if (!vscode.workspace.workspaceFolders?.[0]) return;

    const byFile = {};
    for (const item of items) {
        const f = item.originalFile || item.file;
        const l = Number(item.originalLine || item.line);
        if (f && l && !isNaN(l) && l > 0) {
            if (!byFile[f]) byFile[f] = new Set();
            byFile[f].add(l);
        }
    }

    for (const [relFile, lineSet] of Object.entries(byFile)) {
        try {
            const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relFile);
            // Sort descending: delete from bottom up so earlier line numbers stay valid
            const sortedLines = [...lineSet].sort((a, b) => b - a);

            for (const ln of sortedLines) {
                // Re-open document each time so we always have fresh line count
                const doc = await vscode.workspace.openTextDocument(fileUri);
                if (ln > doc.lineCount) continue; // line no longer exists — skip

                const edit = new vscode.WorkspaceEdit();
                const isLastLine = ln === doc.lineCount;

                if (isLastLine) {
                    // Last line has no trailing newline — delete from end of previous line
                    const prevLine = doc.lineAt(ln - 2); // 0-indexed
                    edit.delete(fileUri, new vscode.Range(
                        new vscode.Position(prevLine.range.end.line, prevLine.range.end.character),
                        new vscode.Position(ln - 1, doc.lineAt(ln - 1).text.length)
                    ));
                } else {
                    edit.delete(fileUri, new vscode.Range(
                        new vscode.Position(ln - 1, 0),
                        new vscode.Position(ln, 0)
                    ));
                }

                await vscode.workspace.applyEdit(edit);
                await doc.save();
            }
        } catch (e) { /* file may be read-only or deleted — skip */ }
    }
}

function registerRecycleTaskDeletePerm(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelPerm', async (node) => {
        if (!node) return;

        let trash = context.globalState.get('trashData', []) || [];

        // ── Folder node: delete all items in this recycle folder ──────────
        if (node.contextValue === 'recycleFolder') {
            const folderName = node.originalText || node.label;
            const folderItems = trash.filter(t => (t.deletedFrom || 'Unknown') === folderName);

            if (folderItems.length === 0 && !trash.some(t => t._isFolderMarker && t.deletedFrom === folderName)) {
                vscode.window.showInformationMessage("DevFlow: No items found in this recycle folder.");
                return;
            }

            const confirm = await vscode.window.showWarningMessage(
                `Permanently delete all ${folderItems.filter(t => !t._isFolderMarker).length} item(s) in "${folderName}"?`,
                { modal: true }, "Delete All"
            );
            if (confirm !== "Delete All") return;

            // Delete scanned items from source files
            const scannedItems = folderItems.filter(t => t.isScanned && !t._isFolderMarker);
            await deleteFromSourceFiles(scannedItems);

            // Remove all items of this folder from trash (including marker)
            trash = trash.filter(t => (t.deletedFrom || 'Unknown') !== folderName);
            await context.globalState.update('trashData', trash);
            todoProvider.refresh();
            return;
        }

        // ── Single task node ──────────────────────────────────────────────
        const itemToDelete = trash.find(t => t.isScanned
            ? (t.originalFile === node.file && Number(t.originalLine) === Number(node.line))
            : (String(t.id) === String(node.id))
        );

        // Physically delete from source file if it's a scanned comment
        if (itemToDelete && itemToDelete.isScanned) {
            await deleteFromSourceFiles([itemToDelete]);
        }

        trash = trash.filter(t => t.isScanned
            ? (t.originalFile !== node.file || Number(t.originalLine) !== Number(node.line))
            : (String(t.id) !== String(node.id))
        );

        // Update state directly without triggering a scanner re-run via logEvent.
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
    }));
}
module.exports = { registerRecycleTaskDeletePerm };
