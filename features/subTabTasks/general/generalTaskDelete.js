// File: features/subTabTasks/general/generalTaskDelete.js
const vscode = require('vscode');
const { logEvent } = require('../../engine/logger');
const { recordHistory } = require('../../commands/historyOps');

function registerGeneralTaskDelete(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        recordHistory(context);

        const isScanned = node.contextValue === 'scannedTask' || !!node.file;
        let trash = context.globalState.get('trashData', []) || [];
        let pri = context.globalState.get('priorityTasks', []) || [];

        // Build trash entry
        const trashEntry = {
            id: node.id || Date.now() + Math.random(),
            text: node.originalText || node.label,
            isScanned: isScanned,
            deletedFrom: node.parentLabel || node.folder || 'General Workspace',
            originalFile: node.file || null,
            originalLine: node.line || null,
            file: node.file || null,
            line: node.line || null
        };

        if (isScanned) {
            // For scanned tasks: remove from fileComments (physical delete handled if needed)
            let fileComments = context.globalState.get('fileComments', []) || [];
            fileComments = fileComments.filter(c => !(c.file === node.file && c.line === node.line));
            await context.globalState.update('fileComments', fileComments);

            // Optionally delete from source file
            if (node.file && vscode.workspace.workspaceFolders?.[0]) {
                try {
                    const fileUri = vscode.Uri.joinPath(
                        vscode.workspace.workspaceFolders[0].uri, node.file
                    );
                    const edit = new vscode.WorkspaceEdit();
                    edit.delete(fileUri, new vscode.Range(
                        new vscode.Position(node.line - 1, 0),
                        new vscode.Position(node.line, 0)
                    ));
                    await vscode.workspace.applyEdit(edit);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (e) { /* file might be read-only — just remove from state */ }
            }
        } else {
            // Manual task: remove from manualTasks
            let manual = context.globalState.get('manualTasks', []) || [];
            manual = manual.filter(t => String(t.id) !== String(node.id));
            await context.globalState.update('manualTasks', manual);
        }

        // Remove from priority if pinned
        const nodeId = node.id ? String(node.id) : `${node.file}:${node.line}`;
        pri = pri.filter(p => {
            const pId = p.id ? String(p.id) : `${p.file}:${p.line}`;
            return pId !== nodeId;
        });
        await context.globalState.update('priorityTasks', pri);

        trash.push(trashEntry);
        await context.globalState.update('trashData', trash);

        todoProvider.refresh();
        logEvent(context, 'Delete',
            `'${trashEntry.text}' '${trashEntry.deletedFrom} -> Recycle Bin'`,
            node.file, node.line
        );
    }));
}

module.exports = { registerGeneralTaskDelete };