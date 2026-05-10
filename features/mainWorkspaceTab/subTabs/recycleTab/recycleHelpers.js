// File: features/subTabs/recycle/recycleHelpers.js
// Shared helper functions used across all recycle operations.
const vscode = require('vscode');

/**
 * Get a safe insert position in a file.
 * Clamps originalLine to [1, doc.lineCount] so we never go out of bounds.
 */
async function getSafeInsertPosition(fileUri, originalLine) {
    try {
        const doc = await vscode.workspace.openTextDocument(fileUri);
        const safeLine = Math.max(1, Math.min(Number(originalLine) || 1, doc.lineCount + 1));
        return new vscode.Position(safeLine - 1, 0);
    } catch {
        return new vscode.Position(0, 0);
    }
}

/**
 * Restore a single trash item back to the workspace (file or manualTasks).
 */
async function restoreItemToWorkspace(item, context) {
    const targetFolder = item._originalFolder || item.deletedFrom || 'General Workspace';

    if (item.isScanned && item.originalFile && vscode.workspace.workspaceFolders?.[0]) {
        try {
            const fileUri = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders[0].uri, item.originalFile
            );
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const rawLine = Number(item.originalLine) || 1;
            const safeLine = Math.max(1, Math.min(rawLine, doc.lineCount + 1));
            const edit = new vscode.WorkspaceEdit();
            edit.insert(fileUri, new vscode.Position(safeLine - 1, 0), `// ${item.text}\n`);
            await vscode.workspace.applyEdit(edit);
            const updated = await vscode.workspace.openTextDocument(fileUri);
            await updated.save();
            return true;
        } catch {
            // Fall through to manual restore
        }
    }

    // Manual task restore
    let manual = context.globalState.get('manualTasks', []) || [];
    manual.push({ id: item.id || Date.now() + Math.random(), text: item.text, folder: targetFolder });
    await context.globalState.update('manualTasks', manual);
    return false;
}

/**
 * Restore a BATCH of trash items correctly:
 * - Scanned items grouped per file, sorted ASCENDING by originalLine
 *   (ascending so each insertion keeps subsequent original line numbers valid)
 * - Manual items batched into a single globalState write
 * - Falls back to manual if file insert fails
 */
async function restoreItemsBatch(items, context) {
    const scannedByFile = {};
    const manualBatch = [];

    for (const item of items) {
        if (item._isFolderMarker) continue;
        const targetFolder = item._originalFolder || item.deletedFrom || 'General Workspace';
        if (item.isScanned && item.originalFile && vscode.workspace.workspaceFolders?.[0]) {
            if (!scannedByFile[item.originalFile]) scannedByFile[item.originalFile] = [];
            scannedByFile[item.originalFile].push({ item, targetFolder });
        } else {
            manualBatch.push({
                id: item.id || Date.now() + Math.random(),
                text: item.text,
                folder: targetFolder
            });
        }
    }

    // Restore scanned comments per file — ascending line order
    for (const [relFile, entries] of Object.entries(scannedByFile)) {
        // Sort ascending: insert line 1 first, then 3, then 5 etc.
        // Each insertion shifts later content down, so original positions stay correct.
        const sorted = entries.slice().sort((a, b) =>
            Number(a.item.originalLine) - Number(b.item.originalLine)
        );
        try {
            const fileUri = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders[0].uri, relFile
            );
            for (const { item, targetFolder } of sorted) {
                const doc = await vscode.workspace.openTextDocument(fileUri);
                const rawLine = Number(item.originalLine) || 1;
                const safeLine = Math.max(1, Math.min(rawLine, doc.lineCount + 1));
                const edit = new vscode.WorkspaceEdit();
                edit.insert(fileUri, new vscode.Position(safeLine - 1, 0), `// ${item.text}\n`);
                await vscode.workspace.applyEdit(edit);
                const updated = await vscode.workspace.openTextDocument(fileUri);
                await updated.save();
            }
        } catch {
            // Fallback: add all as manual tasks
            for (const { item, targetFolder } of sorted) {
                manualBatch.push({
                    id: item.id || Date.now() + Math.random(),
                    text: item.text,
                    folder: targetFolder
                });
            }
        }
    }

    // Batch-write all manual items at once
    if (manualBatch.length > 0) {
        let manual = context.globalState.get('manualTasks', []) || [];
        manual = manual.concat(manualBatch);
        await context.globalState.update('manualTasks', manual);
    }
}

/**
 * Restore priority and tag for a single item if flags are set.
 */
async function restoreItemMeta(item, context) {
    const targetFolder = item._originalFolder || item.deletedFrom || 'General Workspace';

    if (item._wasInPriority) {
        let priorityTasks = context.globalState.get('priorityTasks', []) || [];
        const alreadyIn = priorityTasks.some(p =>
            item.isScanned
                ? (p.file === item.originalFile && Number(p.line) === Number(item.originalLine))
                : String(p.id) === String(item.id)
        );
        if (!alreadyIn) {
            priorityTasks.push({ ...item, folder: targetFolder, target: targetFolder });
            await context.globalState.update('priorityTasks', priorityTasks);
        }
    }

    if (item._savedTag) {
        let itemTags = context.globalState.get('itemTags', {}) || {};
        const tagKey = item.id ? String(item.id) : `${item.originalFile}:${item.originalLine}`;
        itemTags[tagKey] = item._savedTag;
        await context.globalState.update('itemTags', itemTags);
    }
}

/**
 * Delete a scanned comment line from a source file.
 * Uses rangeIncludingLineBreak — the most reliable way to delete a full line
 * including its newline, works correctly for line 1, last line, and single-line files.
 */
async function deleteLineFromFile(relFile, lineNumber) {
    if (!vscode.workspace.workspaceFolders?.[0]) return;
    try {
        const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, relFile);
        const doc = await vscode.workspace.openTextDocument(fileUri);
        const ln = Number(lineNumber);
        if (!ln || isNaN(ln) || ln < 1 || ln > doc.lineCount) return;

        const lineObj = doc.lineAt(ln - 1); // 0-indexed
        const edit = new vscode.WorkspaceEdit();
        // rangeIncludingLineBreak includes the \n — guaranteed full-line removal
        edit.delete(fileUri, lineObj.rangeIncludingLineBreak);
        await vscode.workspace.applyEdit(edit);
        // Re-open to get updated version, then save
        const updatedDoc = await vscode.workspace.openTextDocument(fileUri);
        await updatedDoc.save();
    } catch { /* read-only or missing — skip */ }
}

/**
 * Delete multiple scanned items from their source files (sequential, bottom-up per file).
 */
async function deleteItemsFromFiles(items) {
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
        const sortedLines = [...lineSet].sort((a, b) => b - a);
        for (const ln of sortedLines) {
            await deleteLineFromFile(relFile, ln);
        }
    }
}

/**
 * Remove items belonging to a folder from priorityTasks.
 */
async function removeFolderFromPriority(folderName, context) {
    let priorityTasks = context.globalState.get('priorityTasks', []) || [];
    const before = priorityTasks.length;
    priorityTasks = priorityTasks.filter(p =>
        p.folder !== folderName && p.target !== folderName &&
        p.deletedFrom !== folderName
    );
    if (priorityTasks.length !== before) {
        await context.globalState.update('priorityTasks', priorityTasks);
    }
}

module.exports = {
    getSafeInsertPosition,
    restoreItemToWorkspace,
    restoreItemsBatch,
    restoreItemMeta,
    deleteLineFromFile,
    deleteItemsFromFiles,
    removeFolderFromPriority
};
