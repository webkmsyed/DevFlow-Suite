// File: features/commands/trashOps.js
const vscode = require('vscode');

function registerTrashCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.taskDelTemp', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []);
        const isScanned = node.description && node.description.includes('Line');
        const newItem = { id: Date.now(), text: node.originalText, description: node.description, isScanned: isScanned, deletedFrom: node.parentLabel || "General Workspace", originalLine: null, originalFile: null };

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
                } catch (err) {}
            }
        } else {
            let tasks = context.globalState.get('manualTasks', []);
            tasks = tasks.filter(t => t.text !== node.originalText);
            await context.globalState.update('manualTasks', tasks);
        }
        
        let pri = context.globalState.get('priorityTasks', []);
        pri = pri.filter(t => t.text !== node.originalText);
        await context.globalState.update('priorityTasks', pri);

        trash.push(newItem);
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
    });

    register('jargon.taskRestore', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []);
        const itemIndex = trash.findIndex(t => t.text === node.originalText);

        if (itemIndex > -1) {
            const item = trash[itemIndex];
            if (item.isScanned && item.originalFile && vscode.workspace.workspaceFolders) {
                const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, item.originalFile);
                try {
                    const edit = new vscode.WorkspaceEdit();
                    edit.insert(fileUri, new vscode.Position(item.originalLine - 1, 0), `// ${item.text}\n`);
                    await vscode.workspace.applyEdit(edit);
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await doc.save();
                } catch (err) {}
            } else if (!item.isScanned) {
                let tasks = context.globalState.get('manualTasks', []);
                tasks.push({ id: item.id, text: item.text, folder: item.deletedFrom });
                await context.globalState.update('manualTasks', tasks);
            }
            trash.splice(itemIndex, 1);
            await context.globalState.update('trashData', trash);
            todoProvider.refresh();
        }
    });

    register('jargon.taskDelPerm', async (node) => {
        if (!node) return;
        let trash = context.globalState.get('trashData', []);
        trash = trash.filter(t => t.text !== node.originalText);
        await context.globalState.update('trashData', trash);
        todoProvider.refresh();
    });

    register('jargon.recDeleteAll', async () => {
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
    });
}

module.exports = { registerTrashCommands };