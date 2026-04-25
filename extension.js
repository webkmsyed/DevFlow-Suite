const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('DevFlow Suite is now active!');

    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    // Corrected: Passing both rootPath and context
    const todoProvider = new TodoProvider(rootPath, context);
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    // 1. Refresh Command
    let refreshCommand = vscode.commands.registerCommand('devflow-suite.refreshTodo', () => {
        todoProvider.refresh();
        vscode.window.showInformationMessage('DevFlow: List Refreshed!');
    });

    // 2. Add Manual Task
    let addManualTodo = vscode.commands.registerCommand('devflow-suite.addManualTodo', async () => {
        const task = await vscode.window.showInputBox({
            placeHolder: "Bhai, kya yaad rakhna hai? (e.g. Fix Navbar UI)",
            prompt: "Add a personal task (Not in code)"
        });

        if (task) {
            let manualTodos = context.globalState.get('manualTodos', []);
            manualTodos.push({ text: task, done: false });
            await context.globalState.update('manualTodos', manualTodos);
            todoProvider.refresh();
            vscode.window.showInformationMessage('Task Saved, Bhai!');
        }
    });

    // 3. Export to Notion (Markdown)
    let exportTasks = vscode.commands.registerCommand('devflow-suite.exportTasks', async () => {
        const manual = context.globalState.get('manualTodos', []);
        if (manual.length === 0) {
            vscode.window.showWarningMessage("Bhai, pehle koi manual task toh dalo!");
            return;
        }

        let markdownText = "# 🚀 DevFlow Suite - Personal Tasks\n\n";
        manual.forEach(t => markdownText += `- [ ] ${t.text}\n`);

        await vscode.env.clipboard.writeText(markdownText);
        vscode.window.showInformationMessage("Markdown copied! Ab Notion par paste kardo. 😎");
    });

    context.subscriptions.push(refreshCommand, addManualTodo, exportTasks);
}

function deactivate() {}

module.exports = { activate, deactivate };