// File: extension.js
// @ts-check
const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider');

// 📦 Saare Components Import kiye (Clean & Modular!)
const { initScanner } = require('./features/engine/scanner');
const { registerFolderCommands } = require('./features/commands/folderOps');
const { registerTaskCommands } = require('./features/commands/taskOps');
const { registerPriorityCommands } = require('./features/commands/priorityOps');
const { registerTrashCommands } = require('./features/commands/trashOps');
const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    console.log('DevFlow-Suite: 100% Modular Architecture Active! 🚀');

    // 1. Initialize UI Provider
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const todoProvider = new TodoProvider(rootPath, context);
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    // 2. Initialize Scanner Engine
    const scanWorkspaceForComments = initScanner(context, todoProvider);

    // 3. Inject Dependencies into Controllers
    registerFolderCommands(context, todoProvider, scanWorkspaceForComments);
    registerTaskCommands(context, todoProvider);
    registerPriorityCommands(context, todoProvider);
    registerTrashCommands(context, todoProvider);
    registerWorkspaceCommands(context, todoProvider);
}

function deactivate() {}

module.exports = { activate, deactivate };