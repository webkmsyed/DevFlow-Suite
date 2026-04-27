// File: features/commands/trashOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');

// Bulletproof import logic
let recordHistory;
try { recordHistory = require('./historyOps').recordHistory; }
catch (e) { recordHistory = require('../engine/historyOps').recordHistory; }

function registerTrashCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        if (recordHistory) recordHistory(context);

        let trash = context.globalState.get('trashData', []);
        let pri = context.globalState.get('priorityTasks', []);

        const isScanned = node.description && node.description.includes('Line');
        const wasPriority = pri.some(t => t.text === node.originalText);

        const newItem = { id: Date.now(), text: node.originalText, description: node.description, isScanned: isScanned, deletedFrom: node.parentLabel || "General Workspace", originalLine: null, originalFile: null, isPriority: wasPriority };

        if (isScanned) {
            const comments = context.globalState.get('fileComments', []);
            const target = comments.find(c => c.text === node.originalText);
            if (target && vscode.workspace.workspaceFolders) {
                newItem.originalLine = target.line; newItem.originalFile = target.file;
                const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, target.file);
                try {
                    const edit = new vscode.WorkspaceEdit();
                    edit.delete(fileUri, new vscode.Range(new vscode.Position(target.line - 1, 0), new vscode.Position(target.line, 0)));
                    await vscode.workspace.applyEdit(edit);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (err) { }
            }
        } else {
            let tasks = context.globalState.get('manualTasks', []);
            tasks = tasks.filter(t => t.text !== node.originalText);
            await context.globalState.update('manualTasks', tasks);
        }

        pri = pri.filter(t => t.text !== node.originalText);
        await context.globalState.update('priorityTasks', pri);

        trash.push(newItem);
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();

        // 🔥 PROFESSIONAL LOG: 'Task Text' 'Source ➔ Destination'
        const source = node.parentLabel || "General Workspace";
        logEvent(context, 'Delete', `'${node.originalText}' '${source} ➔ Recycle Bin'`, node.file, node.line);
    });

    register('jargon.taskRestore', async (node) => {
        if (!node) return;
        if (recordHistory) recordHistory(context);

        let trash = context.globalState.get('trashData', []);
        const itemIndex = trash.findIndex(t => t.text === node.originalText);
        let restoredFile = null;
        let restoredLine = null;

        if (itemIndex > -1) {
            const item = trash[itemIndex];
            if (item.isScanned && item.originalFile && vscode.workspace.workspaceFolders) {
                restoredFile = item.originalFile;
                restoredLine = item.originalLine;
                const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, item.originalFile);
                try {
                    const edit = new vscode.WorkspaceEdit();
                    edit.insert(fileUri, new vscode.Position(item.originalLine - 1, 0), `// ${item.text}\n`);
                    await vscode.workspace.applyEdit(edit);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (err) { }
            } else if (!item.isScanned) {
                let tasks = context.globalState.get('manualTasks', []);
                tasks.push({ id: item.id, text: item.text, folder: item.deletedFrom });
                await context.globalState.update('manualTasks', tasks);
            }
            if (item.isPriority) {
                let pri = context.globalState.get('priorityTasks', []);
                if (!pri.some(p => p.text === item.text)) {
                    pri.push({ text: item.text, isScanned: item.isScanned });
                    await context.globalState.update('priorityTasks', pri);
                }
            }
            trash.splice(itemIndex, 1);
            await context.globalState.update('trashData', trash);
            todoProvider.refresh();

            // 🔥 PROFESSIONAL LOG: 'Text' 'Recycle ➔ Destination'
            logEvent(context, 'Restore', `'${item.text}' 'Recycle Bin ➔ ${item.deletedFrom}'`, restoredFile, restoredLine);
            
        }
    });

    register('jargon.taskDelPerm', async (node) => {
        if (!node) return;
        if (recordHistory) recordHistory(context);
        let trash = context.globalState.get('trashData', []);
        trash = trash.filter(t => t.text !== node.originalText);
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
        
        // 🔥 PROFESSIONAL LOG: 'Text' 'X ➔ Y'
        logEvent(context, 'Wipe', `'${node.originalText}' 'Recycle Bin ➔ Permanently Deleted'`, null, null);
    });

    register('jargon.recDeleteAll', async () => {
        if (recordHistory) recordHistory(context);
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
        vscode.window.showInformationMessage("Recycle bin emptied.");

        // 🔥 PROFESSIONAL LOG: General Action
        logEvent(context, 'Delete', `'Recycle Bin' 'Cleaning ➔ Emptied Completely'`, null, null);
    });
}

module.exports = { registerTrashCommands };