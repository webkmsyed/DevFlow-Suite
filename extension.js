// File: extension.js
const vscode = require('vscode');

function activate(context) {
    try {
        const TodoProvider = require('./features/todoProvider');
        const { initScanner } = require('./features/engine/scanner');
        
        // --- 1. GLOBAL COMMANDS ---
        const { registerSearch } = require('./features/main/searchOps');
        const { registerFilter } = require('./features/main/filterOps');
        const { registerSort } = require('./features/main/sortOps');
        const { registerExport } = require('./features/main/exportOps');
        const { registerTimeline } = require('./features/main/timelineOps');
        const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');
        const { registerHistoryCommands } = require('./features/commands/historyOps');
        const { registerNoteCommands } = require('./features/notes/noteEngine');

        // --- 2. MODULAR SUB-TAB OPS (Index Files) ---
        const { registerGeneralTabOps } = require('./features/subTabs/general/generalTabIndex');
        const { registerGeneralTaskOps } = require('./features/subTabTasks/general/generalTaskIndex');
        const { registerPriorityTabOps } = require('./features/subTabs/priority/priorityTabIndex');
        const { registerPriorityTaskOps } = require('./features/subTabTasks/priority/priorityTaskIndex');
        const { registerRecycleTabOps } = require('./features/subTabs/recycle/recycleTabIndex');
        const { registerRecycleTaskOps } = require('./features/subTabTasks/recycle/recycleTaskIndex');

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

        // --- REGISTER ALL MODULAR OPS ---
        registerGeneralTabOps(context, todoProvider, scanWorkspaceForComments);
        registerGeneralTaskOps(context, todoProvider);
        registerPriorityTabOps(context, todoProvider);
        registerPriorityTaskOps(context, todoProvider);
        registerRecycleTabOps(context, todoProvider);
        registerRecycleTaskOps(context, todoProvider);

        // Global Main Ops
        registerSearch(context, todoProvider);
        registerFilter(context, todoProvider); // jargon.mainClearFilters included here
        registerSort(context, todoProvider);
        registerExport(context);
        registerTimeline(context);
        registerWorkspaceCommands(context, todoProvider);
        registerHistoryCommands(context, todoProvider);
        registerNoteCommands(context);

        // --- GLOBAL UTILITIES ---
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

        // --- SMART AUDIT LOGGING (Anti-Spam) ---
        let previousComments = context.globalState.get('fileComments', []) || [];
        let saveTimeout = null;

        vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
                const currentComments = context.globalState.get('fileComments', []) || [];
                const newComments = currentComments.filter(curr =>
                    !previousComments.some(prev => prev.file === curr.file && prev.line === curr.line)
                );

                newComments.forEach(comment => {
                    require('./features/engine/logger').logEvent(
                        context, 'Create', `'${comment.text}' 'Code File ➔ Scanned Task'`, comment.file, comment.line
                    );
                });
                previousComments = currentComments;
            }, 2000);
        });

    } catch (error) {
        vscode.window.showErrorMessage(`DevFlow-Suite Crash: ${error.message}`);
    }
}

function deactivate() {}
module.exports = { activate, deactivate };