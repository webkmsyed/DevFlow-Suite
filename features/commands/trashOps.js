// File: features/commands/trashOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');
const { recordHistory } = require('./historyOps');

function registerTrashCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    // --- MOVE TO RECYCLE BIN ---
    register('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []);
        let pri = context.globalState.get('priorityTasks', []);
        const isScanned = node.contextValue !== 'standardTask' && node.file;

        const newItem = { 
            id: node.id || null, 
            text: node.originalText, 
            description: node.description, 
            isScanned: isScanned, 
            deletedFrom: node.parentLabel || "General Workspace", 
            originalLine: node.line || null, 
            originalFile: node.file || null, 
            isPriority: pri.some(p => (p.id === node.id) || (p.file === node.file && p.line === node.line)) 
        };

        if (isScanned) {
            const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, node.file);
            try {
                const edit = new vscode.WorkspaceEdit();
                edit.delete(fileUri, new vscode.Range(new vscode.Position(node.line - 1, 0), new vscode.Position(node.line, 0)));
                await vscode.workspace.applyEdit(edit);
                const doc = await vscode.workspace.openTextDocument(fileUri);
                await doc.save();
            } catch (err) { }
        } else {
            let tasks = context.globalState.get('manualTasks', []);
            tasks = tasks.filter(t => t.id !== node.id); 
            await context.globalState.update('manualTasks', tasks);
        }

        const nodeId = node.id || `${node.file}:${node.line}`;
        pri = pri.filter(p => (p.id || `${p.file}:${p.line}`) !== nodeId);
        
        await context.globalState.update('priorityTasks', pri);
        trash.push(newItem);
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();

        const source = node.parentLabel || "General Workspace";
        logEvent(context, 'Delete', `'${node.originalText}' '${source} ➔ Recycle Bin'`, node.file, node.line);
    });

    // --- SMART RESTORE ---
    register('jargon.taskRestore', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []);
        // Match using Unique Identity (ID or File:Line)[cite: 1]
        const itemIndex = trash.findIndex(t => 
            t.isScanned ? (t.originalFile === node.file && t.originalLine === node.line) : (t.id === node.id)
        );

        if (itemIndex > -1) {
            const item = trash[itemIndex];
            if (item.isScanned && item.originalFile) {
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
            trash.splice(itemIndex, 1);
            await context.globalState.update('trashData', trash);
            todoProvider.refresh();
            logEvent(context, 'Restore', `'${item.text}' 'Recycle Bin ➔ ${item.deletedFrom}'`, item.originalFile, item.originalLine);
        }
    });

    // --- PERMANENT DELETE (One Item) ---
    register('jargon.taskDelPerm', async (node) => {
        if (!node) return;
        recordHistory(context);

        let trash = context.globalState.get('trashData', []);
        trash = trash.filter(t => t.isScanned ? (t.originalFile !== node.file || t.originalLine !== node.line) : (t.id !== node.id));
        
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
        logEvent(context, 'Wipe', `'${node.originalText}' 'Recycle Bin ➔ Permanently Deleted'`, null, null);
    });

    // --- EMPTY RECYCLE BIN ---
    register('jargon.recDeleteAll', async () => {
        recordHistory(context);
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
        vscode.window.showInformationMessage("Recycle bin emptied.");
        logEvent(context, 'Delete', `'Recycle Bin' 'Cleaning ➔ Emptied Completely'`, null, null);
    });
}

module.exports = { registerTrashCommands };