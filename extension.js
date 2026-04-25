// File: extension.js
// @ts-check
const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider');

// 📦 Naye Components Import kiye!
const { registerFolderCommands } = require('./features/commands/folderOps');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    console.log('DevFlow-Suite Modular Architecture is active!');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const todoProvider = new TodoProvider(rootPath, context);
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    const register = (cmd, handler) => {
        context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));
    };

    // ==========================================
    // 🚀 SCANNER ENGINE
    // ==========================================
    async function scanWorkspaceForComments() {
        try {
            const comments = [];
            const userFolders = context.globalState.get('userFolders', []);
            const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx,html,css}', '**/{node_modules,.git,dist,build}/**');

            if(files.length === 0) return;

            for (const file of files) {
                const document = await vscode.workspace.openTextDocument(file);
                const lines = document.getText().split('\n');
                lines.forEach((line, index) => {
                    const match = line.match(/(?:^|\s)\/\/\s*(.+)/i);
                    if (match) {
                        const commentText = match[1].trim();
                        let targetFolder = "General Workspace";
                        // @ts-ignore
                        for (const folder of userFolders) {
                            if (commentText.toLowerCase().startsWith(folder.toLowerCase())) { targetFolder = folder; break; }
                        }
                        comments.push({ id: Date.now() + index, text: commentText, file: vscode.workspace.asRelativePath(file), line: index + 1, target: targetFolder });
                    }
                });
            }
            await context.globalState.update('fileComments', comments);
            todoProvider.refresh();
        } catch (error) { console.error(error); }
    }

    vscode.workspace.onDidSaveTextDocument(() => scanWorkspaceForComments());
    register('jargon.mainRefresh', async () => {
        await scanWorkspaceForComments();
        vscode.window.showInformationMessage("Workspace Refreshed!");
    });
    setTimeout(scanWorkspaceForComments, 1000);

    // ==========================================
    // 🧩 MODULAR COMPONENTS INJECTION
    // ==========================================
    // Yahan hum apna naya FolderOps component call kar rahe hain
    registerFolderCommands(context, todoProvider, scanWorkspaceForComments);

    // ==========================================
    // 📁 TASK & TAGS (Inko next phase me extract karenge)
    // ==========================================
    register('jargon.tabTask', async (node) => {
        if (!node) return; 
        const taskText = await vscode.window.showInputBox({ prompt: `Add task to [${node.originalText}]` });
        if (taskText) {
            let tasks = context.globalState.get('manualTasks', []);
            tasks.push({ id: Date.now(), text: taskText, folder: node.originalText });
            await context.globalState.update('manualTasks', tasks);
            todoProvider.refresh();
        }
    });

    register('jargon.taskTag', async (node) => {
        if (!node) return;
        const tag = await vscode.window.showInputBox({ prompt: `Tag for "${node.originalText}" (e.g., UI bug, feature)` });
        if (tag !== undefined) {
            let tagsDict = context.globalState.get('itemTags', {});
            tagsDict[node.originalText] = tag; 
            await context.globalState.update('itemTags', tagsDict);
            todoProvider.refresh();
        }
    });

    // ==========================================
    // ⭐ PRIORITY ENGINE
    // ==========================================
    register('jargon.taskSavePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        if (!priority.some(p => p.text === node.originalText)) {
            priority.push({ text: node.originalText, isScanned: node.description && node.description.includes('Line') });
            await context.globalState.update('priorityTasks', priority);
            todoProvider.refresh();
        }
    });

    register('jargon.taskRemovePri', async (node) => {
        if (!node) return;
        let priority = context.globalState.get('priorityTasks', []);
        priority = priority.filter(t => t.text !== node.originalText);
        await context.globalState.update('priorityTasks', priority);
        todoProvider.refresh();
    });

    // ==========================================
    // 🗑️ UNIVERSAL DELETE ENGINE 
    // ==========================================
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

    // MASTER BATCH FUNCTIONS
    register('jargon.taskCopy', async (node) => {
        if(node) {
            await vscode.env.clipboard.writeText(node.originalText);
            vscode.window.showInformationMessage("Copied to clipboard!");
        }
    });

    register('jargon.mainExport', async () => {
        const tasks = context.globalState.get('manualTasks', []);
        const pri = context.globalState.get('priorityTasks', []);
        let md = `# DevFlow-Suite Export\n\n## ⭐ Priority\n`;
        // @ts-ignore
        pri.forEach(p => md += `- [ ] ${p.text}\n`);
        md += `\n## 📋 Tasks\n`;
        // @ts-ignore
        tasks.forEach(t => md += `- [ ] ${t.text} (Folder: ${t.folder})\n`);
        const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
        await vscode.window.showTextDocument(doc);
    });

    register('jargon.mainDelete', async () => {
        const res = await vscode.window.showWarningMessage("Wipe workspace memory?", { modal: true }, "Yes, Wipe All");
        if (res === "Yes, Wipe All") {
            await context.globalState.update('manualTasks', []); await context.globalState.update('priorityTasks', []); await context.globalState.update('trashData', []); await context.globalState.update('itemTags', {});
            todoProvider.refresh();
        }
    });

    register('jargon.recDeleteAll', async () => {
        await context.globalState.update('trashData', []);
        todoProvider.refresh();
    });

    register('jargon.priRemoveAll', async () => {
        await context.globalState.update('priorityTasks', []);
        todoProvider.refresh();
    });

    const dummy = ['jargon.mainFilter', 'jargon.mainSearch', 'jargon.mainSort', 'jargon.tabExport', 'jargon.tabFilter', 'jargon.tabSort', 'jargon.priExport', 'jargon.priAddAll', 'jargon.recExport', 'jargon.recSearch', 'jargon.taskAddTo'];
    dummy.forEach(cmd => register(cmd, () => {}));
}

module.exports = { activate, deactivate: () => {} };