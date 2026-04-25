const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider'); // Humari nayi file

function activate(context) {
    console.log('DevFlow Suite is now active!');

    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    // 1. Initialize our Provider
    const todoProvider = new TodoProvider(rootPath);

    // 2. Register it to the UI (View ID must match package.json)
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    // 3. Refresh Command
    let refreshCommand = vscode.commands.registerCommand('devflow-suite.refreshTodo', () => {
        todoProvider.refresh();
        vscode.window.showInformationMessage('TODO List Refreshed, Bhai!');
    });

    context.subscriptions.push(refreshCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
// TODO: Bhai ye UI check karni hai

// extension.js ke activate function ke andar ye dalo:
let addManualTodo = vscode.commands.registerCommand('devflow-suite.addManualTodo', async () => {
    const task = await vscode.window.showInputBox({
        placeHolder: "Bhai, kya yaad rakhna hai? (e.g. Fix Navbar)",
        prompt: "Add a manual task to DevFlow Suite"
    });

    if (task) {
        // VS Code ki internal storage mein save karo
        let manualTodos = context.globalState.get('manualTodos', []);
        manualTodos.push({ text: task, done: false });
        await context.globalState.update('manualTodos', manualTodos);
        
        TodoProvider.refresh(); // Sidebar ko update karo
        vscode.window.showInformationMessage('Task Saved, Bhai!');
    }
});

context.subscriptions.push(addManualTodo);