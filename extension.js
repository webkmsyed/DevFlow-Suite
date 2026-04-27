// File: extension.js
const vscode = require('vscode');

function activate(context) {
    try {
        const TodoProvider = require('./features/todoProvider');
        const { initScanner } = require('./features/engine/scanner');
        const { registerFolderCommands } = require('./features/commands/folderOps');
        const { registerTaskCommands } = require('./features/commands/taskOps');
        const { registerPriorityCommands } = require('./features/commands/priorityOps');
        const { registerTrashCommands } = require('./features/commands/trashOps');
        const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');
        const { registerHistoryCommands } = require('./features/commands/historyOps');
        const { registerSearch } = require('./features/main/searchOps');
        const { registerFilter } = require('./features/main/filterOps');
        const { registerSort } = require('./features/main/sortOps');
        const { registerExport } = require('./features/main/exportOps');
        const { registerNoteCommands } = require('./features/notes/noteEngine');
        const { registerTimeline } = require('./features/main/timelineOps');

        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const todoProvider = new TodoProvider(rootPath, context);
        const scanWorkspaceForComments = initScanner(context, todoProvider);

        const treeView = vscode.window.createTreeView('todo-explorer', {
            treeDataProvider: todoProvider,
            dragAndDropController: todoProvider,
            canSelectMany: false,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);

        registerFolderCommands(context, todoProvider, scanWorkspaceForComments);
        registerTaskCommands(context, todoProvider);
        registerPriorityCommands(context, todoProvider);
        registerTrashCommands(context, todoProvider);
        registerWorkspaceCommands(context, todoProvider);
        registerHistoryCommands(context, todoProvider);
        registerSearch(context, todoProvider);
        registerFilter(context, todoProvider);
        registerSort(context, todoProvider);
        registerExport(context);
        registerNoteCommands(context);
        registerTimeline(context);

        context.subscriptions.push(vscode.commands.registerCommand('jargon.openFile', async (file, line) => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) return;
            const fileUri = vscode.Uri.file(require('path').join(workspaceRoot, file));
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(doc);
            const pos = new vscode.Position(line - 1, 0);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos));
        }));

        // 🛡️ ANTI-SPAM: Sirf final save log hoga
        let previousComments = context.globalState.get('fileComments', []);
        let saveTimeout = null;

        vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
                const currentComments = context.globalState.get('fileComments', []);
                const newComments = currentComments.filter(curr =>
                    !previousComments.some(prev => prev.text === curr.text && prev.file === curr.file && prev.line === curr.line)
                );

                newComments.forEach(comment => {
                    require('./features/engine/logger').logEvent(
                        context, 
                        'Create', 
                        `'${comment.text}' 'Code File ➔ Scanned Task'`, 
                        comment.file, 
                        comment.line
                    );
                });
                previousComments = currentComments;
            }, 2000); // 2 Seconds Wait
        });

    } catch (error) {
        vscode.window.showErrorMessage(`DevFlow-Suite Crash: ${error.message}`);
    }
}

function deactivate() { }
module.exports = { activate, deactivate };