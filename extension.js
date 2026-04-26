// File: extension.js
// @ts-check
const vscode = require('vscode');
const { registerNoteCommands } = require('./features/notes/noteEngine');
const { registerTimeline } = require('./features/main/timelineOps');

function activate(context) {
    try {
        // 📦 MODULE IMPORTS
        const TodoProvider = require('./features/todoProvider');
        const { initScanner } = require('./features/engine/scanner');

        // 📦 COMMAND IMPORTS (Make sure all these files are inside features/commands/)
        const { registerFolderCommands } = require('./features/commands/folderOps');
        const { registerTaskCommands } = require('./features/commands/taskOps');
        const { registerPriorityCommands } = require('./features/commands/priorityOps');
        const { registerTrashCommands } = require('./features/commands/trashOps');
        const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');
        const { registerHistoryCommands } = require('./features/commands/historyOps');


        // 📦 MAIN HEADER IMPORTS
        const { registerSearch } = require('./features/main/searchOps');
        const { registerFilter } = require('./features/main/filterOps');
        const { registerSort } = require('./features/main/sortOps');
        const { registerExport } = require('./features/main/exportOps');
        

        console.log('DevFlow-Suite: Micro-Services Architecture Active! 🚀');

        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const todoProvider = new TodoProvider(rootPath, context);

        // 🔥 NAYA: TreeView ko Drag & Drop ke sath initialize kiya!
        const treeView = vscode.window.createTreeView('todo-explorer', {
            treeDataProvider: todoProvider,
            dragAndDropController: todoProvider,
            canSelectMany: false,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);

        const scanWorkspaceForComments = initScanner(context, todoProvider);

        // 🧩 INJECTING OPERATIONS
        registerFolderCommands(context, todoProvider, scanWorkspaceForComments);
        registerTaskCommands(context, todoProvider);
        registerPriorityCommands(context, todoProvider);
        registerTrashCommands(context, todoProvider);
        registerWorkspaceCommands(context, todoProvider);
        registerHistoryCommands(context, todoProvider); // Undo/Redo Engine

        // 🔥 INJECTING HEADER OPERATIONS
        registerSearch(context, todoProvider);
        registerFilter(context, todoProvider);
        registerSort(context, todoProvider);
        registerExport(context);
        registerNoteCommands(context); // 📝 Operation 10: Markdown Notes
        registerTimeline(context); // ⏳ Operation 11: Timeline UI

        // 📂 FILE NAVIGATION COMMAND (Fixed Scope Error)
        context.subscriptions.push(vscode.commands.registerCommand('jargon.openFile', async (file, line) => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) return;
            const fileUri = vscode.Uri.file(require('path').join(workspaceRoot, file));
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(doc);

            // Navigate directly to the line
            const pos = new vscode.Position(line - 1, 0);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos));
        }));

        // ==========================================
        // 🟡 PENDING BUTTONS (Strictly tracked)
        // ==========================================
        const dummy = [
            'jargon.tabExport', 'jargon.tabFilter', 'jargon.tabSort',
            'jargon.priExport', 'jargon.priAddAll',
            'jargon.recExport', 'jargon.recSearch', 'jargon.taskAddTo'
        ];
        dummy.forEach(cmd => {
            context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
                vscode.window.showInformationMessage(`DevFlow-Suite: Logic pending for this button!`);
            }));
        });

    } catch (error) {
        // Safe Error Catching
        vscode.window.showErrorMessage(`DevFlow-Suite Crash: ${error.message}`);
        console.error("Activation Error:", error);
    }
}

function deactivate() { }

module.exports = { activate, deactivate };