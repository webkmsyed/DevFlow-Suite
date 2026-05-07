// File: features/subTabs/general/generalTabDelete.js
const vscode = require('vscode');
const { recordHistory } = require('../../../commands/historyOps');
const { logEvent } = require('../../../engine/logger');

function registerGeneralTabDelete(context, todoProvider) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabDelete', async (node) => {
        if (!node) return;
        const folderName = node.originalText || node.label;

        // For General Workspace: move all its items to recycle bin, do not delete the folder itself
        if (folderName === 'General Workspace') {
            const confirm = await vscode.window.showWarningMessage(
                "Move all items in 'General Workspace' to the Recycle Bin?",
                { modal: true },
                'Move to Recycle Bin'
            );
            if (!confirm) return;
            recordHistory(context);

            let manualTasks = context.globalState.get('manualTasks', []) || [];
            let fileComments = context.globalState.get('fileComments', []) || [];
            let trash = context.globalState.get('trashData', []) || [];
            let priorityTasks = context.globalState.get('priorityTasks', []) || [];

            // Move all General Workspace manual tasks to trash
            const generalManual = manualTasks.filter(t => (t.folder || 'General Workspace') === 'General Workspace');
            generalManual.forEach(t => {
                const wasInPriority = priorityTasks.some(p => String(p.id) === String(t.id));
                trash.push({ ...t, deletedFrom: 'General Workspace', isScanned: false, _wasInPriority: wasInPriority });
            });
            manualTasks = manualTasks.filter(t => (t.folder || 'General Workspace') !== 'General Workspace');

            // Move all General Workspace scanned comments to trash
            // NOTE: scanner may store items with target=null/undefined — treat those as General Workspace too
            const generalScanned = fileComments.filter(c => (c.target || 'General Workspace') === 'General Workspace');
            generalScanned.forEach(c => {
                const pKey = `${c.file}:${c.line}`;
                const wasInPriority = priorityTasks.some(p => `${p.file}:${p.line}` === pKey);
                trash.push({
                    ...c,
                    id: Date.now() + Math.random(),
                    isScanned: true,
                    originalFile: c.file,
                    originalLine: c.line,
                    deletedFrom: 'General Workspace',
                    _wasInPriority: wasInPriority
                });
            });
            fileComments = fileComments.filter(c => (c.target || 'General Workspace') !== 'General Workspace');

            // Remove all General Workspace items from priority
            priorityTasks = priorityTasks.filter(p =>
                p.folder !== 'General Workspace' && p.target !== 'General Workspace'
            );
            await context.globalState.update('priorityTasks', priorityTasks);

            // ── COMMIT STATE FIRST so scanner sees correct trashData/fileComments ──
            await context.globalState.update('trashData', trash);
            await context.globalState.update('manualTasks', manualTasks);
            await context.globalState.update('fileComments', fileComments);

            // Physically delete scanned comment lines from source files (sequential, one at a time)
            if (generalScanned.length > 0 && vscode.workspace.workspaceFolders?.[0]) {
                const byFile = {};
                generalScanned.forEach(c => {
                    const l = Number(c.line);
                    if (c.file && l && !isNaN(l) && l > 0) {
                        if (!byFile[c.file]) byFile[c.file] = new Set();
                        byFile[c.file].add(l);
                    }
                });
                for (const [relFile, lineSet] of Object.entries(byFile)) {
                    try {
                        const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relFile);
                        const sortedLines = [...lineSet].sort((a, b) => b - a);
                        for (const ln of sortedLines) {
                            const doc = await vscode.workspace.openTextDocument(fileUri);
                            if (ln > doc.lineCount) continue;
                            const edit = new vscode.WorkspaceEdit();
                            const isLastLine = ln === doc.lineCount;
                            if (isLastLine) {
                                const prevLine = doc.lineAt(ln - 2);
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
                    } catch (e) { /* file may be read-only — skip */ }
                }
            }

            todoProvider.refresh();
            logEvent(context, 'Delete', `'General Workspace' 'All items -> Recycle Bin'`);
            vscode.window.showInformationMessage("DevFlow: All General Workspace items moved to Recycle Bin.");
            return;
        }


        // Ask what to do with tasks inside
        const action = await vscode.window.showWarningMessage(
            `Delete folder "${folderName}"?`,
            { modal: true },
            'Move to Recycle Bin',
            'Move Tasks to General Workspace'
        );

        if (!action) return;
        recordHistory(context);

        let folders = context.globalState.get('userFolders', []) || [];
        let manualTasks = context.globalState.get('manualTasks', []) || [];
        let fileComments = context.globalState.get('fileComments', []) || [];
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        let trash = context.globalState.get('trashData', []) || [];

        // 1. Remove folder from list
        folders = folders.filter(f => f !== folderName);
        await context.globalState.update('userFolders', folders);

        const folderManual = manualTasks.filter(t => t.folder === folderName);
        const folderScanned = fileComments.filter(c => c.target === folderName);

        if (action === 'Move to Recycle Bin') {
            // Push a folder marker so the recycle bin shows the folder group even if empty
            const alreadyHasFolder = trash.some(t => t._isFolderMarker && t.deletedFrom === folderName);
            if (!alreadyHasFolder) {
                trash.push({ _isFolderMarker: true, id: `folder_${folderName}_${Date.now()}`, text: `[Folder] ${folderName}`, deletedFrom: folderName, isScanned: false, _originalFolder: folderName });
            }

            // Move manual tasks — preserve priority state
            folderManual.forEach(t => {
                const wasInPriority = priorityTasks.some(p => String(p.id) === String(t.id));
                trash.push({ ...t, deletedFrom: folderName, isScanned: false, _wasInPriority: wasInPriority, _originalFolder: folderName });
            });

            // Move scanned comments — preserve priority state and delete from source files
            // Group by file so we can batch the edits per file
            const byFile = {};
            folderScanned.forEach(c => {
                const pKey = `${c.file}:${c.line}`;
                const wasInPriority = priorityTasks.some(p => `${p.file}:${p.line}` === pKey);
                trash.push({
                    ...c,
                    id: Date.now() + Math.random(),
                    isScanned: true,
                    originalFile: c.file,
                    originalLine: c.line,
                    deletedFrom: folderName,
                    _wasInPriority: wasInPriority,
                    _originalFolder: folderName
                });
                if (!byFile[c.file]) byFile[c.file] = [];
                byFile[c.file].push(c.line);
            });

            // ── COMMIT STATE FIRST so scanner sees correct trashData/fileComments ──
            manualTasks = manualTasks.filter(t => t.folder !== folderName);
            fileComments = fileComments.filter(c => c.target !== folderName);
            await context.globalState.update('trashData', trash);
            await context.globalState.update('fileComments', fileComments);

            // Delete comment lines from source files (sequential, one at a time)
            if (vscode.workspace.workspaceFolders?.[0]) {
                const byFile2 = {};
                folderScanned.forEach(c => {
                    const l = Number(c.line);
                    if (c.file && l && !isNaN(l) && l > 0) {
                        if (!byFile2[c.file]) byFile2[c.file] = new Set();
                        byFile2[c.file].add(l);
                    }
                });
                for (const [relFile, lineSet] of Object.entries(byFile2)) {
                    try {
                        const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relFile);
                        const sortedLines = [...lineSet].sort((a, b) => b - a);
                        for (const ln of sortedLines) {
                            const doc = await vscode.workspace.openTextDocument(fileUri);
                            if (ln > doc.lineCount) continue;
                            const edit = new vscode.WorkspaceEdit();
                            const isLastLine = ln === doc.lineCount;
                            if (isLastLine) {
                                const prevLine = doc.lineAt(ln - 2);
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
                    } catch (e) { /* file may be read-only — skip physical delete */ }
                }
            }

        } else {
            // Move tasks to General Workspace
            manualTasks.forEach(t => {
                if (t.folder === folderName) t.folder = 'General Workspace';
            });
            fileComments.forEach(c => {
                if (c.target === folderName) c.target = 'General Workspace';
            });
            await context.globalState.update('fileComments', fileComments);
        }

        await context.globalState.update('manualTasks', manualTasks);

        // Remove all priority tasks that belonged to this folder
        priorityTasks = priorityTasks.filter(p => (p.folder !== folderName && p.target !== folderName));
        await context.globalState.update('priorityTasks', priorityTasks);

        todoProvider.refresh();
        logEvent(context, 'Delete', `'${folderName}' 'Folder -> ${action.includes('Recycle') ? 'Recycle Bin' : 'General'}'`);
        vscode.window.showInformationMessage(`DevFlow: Folder "${folderName}" deleted.`);
    }));
}

module.exports = { registerGeneralTabDelete };
