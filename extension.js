// File: extension.js
// @ts-check

const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider');

const { initScanner } = require('./features/engine/scanner');
const { registerFolderCommands } = require('./features/commands/folderOps');
const { registerTaskCommands } = require('./features/commands/taskOps');
const { registerPriorityCommands } = require('./features/commands/priorityOps');
const { registerTrashCommands } = require('./features/commands/trashOps');
const { registerWorkspaceCommands } = require('./features/commands/workspaceOps');

// 📦 Naya Header Ops Import Kiya!
const { registerHeaderCommands } = require('./features/main/headerOps');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    console.log('DevFlow-Suite: 100% Modular Architecture Active! 🚀');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const todoProvider = new TodoProvider(rootPath, context);
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    const scanWorkspaceForComments = initScanner(context, todoProvider);

    // Saare Components Inject Kar Diye
    registerFolderCommands(context, todoProvider, scanWorkspaceForComments);
    registerTaskCommands(context, todoProvider);
    registerPriorityCommands(context, todoProvider);
    registerTrashCommands(context, todoProvider);
    registerWorkspaceCommands(context, todoProvider);
    
    // 🔥 Naya Header Engine Inject Kiya
    registerHeaderCommands(context, todoProvider);
}

function deactivate() {}

module.exports = { activate, deactivate };