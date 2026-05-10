// File: features/subTabTasks/general/generalTaskDelete.js
const vscode = require('vscode');
const { logEvent } = require('../../../engine/logger');
const { recordHistory } = require('../../../commands/historyOps');

function registerGeneralTaskDelete(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        recordHistory(context);

        const isScanned = node.contextValue === 'scannedTask' || !!node.file;
        let trash = context.globalState.get('trashData', []) || [];
        let pri = context.globalState.get('priorityTasks', []) || [];
        let itemTags = context.globalState.get('itemTags', {}) || {};

        // Determine the tag key for this task and save/clear it
        const itemKey = node.id ? String(node.id) : `${node.file}:${node.line}`;
        const savedTag = itemTags[itemKey] || '';
        if (savedTag) {
            delete itemTags[itemKey];
            await context.globalState.update('itemTags', itemTags);
        }

        // Check if this task is currently in priority (BEFORE removing it)
        const nodeId = node.id ? String(node.id) : `${node.file}:${node.line}`;
        const wasInPriority = pri.some(p => {
            const pId = p.id ? String(p.id) : `${p.file}:${p.line}`;
            return pId === nodeId;
        });

        // Build trash entry — save tag + priority state for restore
        const trashEntry = {
            id: node.id || Date.now() + Math.random(),
            text: node.originalText || node.label,
            isScanned: isScanned,
            deletedFrom: node.parentLabel || node.folder || 'General Workspace',
            originalFile: node.file || null,
            originalLine: node.line || null,
            file: node.file || null,
            line: node.line || null,
            _savedTag: savedTag,
            _wasInPriority: wasInPriority
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
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    const ln = Number(node.line);
                    if (ln >= 1 && ln <= doc.lineCount) {
                        const edit = new vscode.WorkspaceEdit();
                        edit.delete(fileUri, doc.lineAt(ln - 1).rangeIncludingLineBreak);
                        await vscode.workspace.applyEdit(edit);
                        const updated = await vscode.workspace.openTextDocument(fileUri);
                        await updated.save();
                    }
                } catch (e) { /* file might be read-only — just remove from state */ }
            }
        } else {
            // Manual task: remove from manualTasks
            let manual = context.globalState.get('manualTasks', []) || [];
            manual = manual.filter(t => String(t.id) !== String(node.id));
            await context.globalState.update('manualTasks', manual);
        }

        // Remove from priority
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
