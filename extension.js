// File: extension.js
// @ts-check
const vscode = require('vscode');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    try {
        // 📦 Saare imports ab yahan andar hain taaki crash na ho aur error pakad aaye
        const TodoProvider = require('./features/todoProvider');
        const { initScanner } = require('./features/engine/scanner');
        const { registerFolderCommands } = require('./features/commands/folderOps');
        const { registerTaskCommands } = require('./features/commands/taskOps');
        const { registerPriorityCommands } = require('./features/commands/priorityOps');
        const { registerTrashCommands } = require('./features/commands/trashOps');
        const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');
        
        const { registerSearch } = require('./features/main/searchOps');
        const { registerFilter } = require('./features/main/filterOps');
        const { registerSort } = require('./features/main/sortOps');
        const { registerExport } = require('./features/main/exportOps');

        console.log('DevFlow-Suite: Micro-Services Architecture Active! 🚀');

        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const todoProvider = new TodoProvider(rootPath, context);
        vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

        const scanWorkspaceForComments = initScanner(context, todoProvider);

        // 🧩 Injecting Operations
        registerFolderCommands(context, todoProvider, scanWorkspaceForComments);
        registerTaskCommands(context, todoProvider);
        registerPriorityCommands(context, todoProvider);
        registerTrashCommands(context, todoProvider);
        registerWorkspaceCommands(context, todoProvider);
        
        // 🔥 Injecting Main Header Operations
        registerSearch(context, todoProvider);
        registerFilter(context, todoProvider);
        registerSort(context, todoProvider);
        registerExport(context);

        // ==========================================
        // 🟡 PENDING BUTTONS
        // ==========================================
        const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));
        const dummy = [
            'jargon.tabExport', 'jargon.tabFilter', 'jargon.tabSort', 
            'jargon.priExport', 'jargon.priAddAll', 
            'jargon.recExport', 'jargon.recSearch', 'jargon.taskAddTo'
        ];
        dummy.forEach(cmd => register(cmd, () => vscode.window.showInformationMessage(`DevFlow-Suite: Logic pending for this button!`)));

    } catch (error) {
        // 🔥 AGAR KOI FILE MISSING HUI TOH YAHAN POPUP AAYEGA!
        vscode.window.showErrorMessage(`DevFlow-Suite Crash: ${error.message}`);
        console.error("Activation Error:", error);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };