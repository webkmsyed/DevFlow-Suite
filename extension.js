const vscode = require('vscode');
const TodoProvider = require('./features/todoProvider');

function activate(context) {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const todoProvider = new TodoProvider(rootPath, context);
    vscode.window.registerTreeDataProvider('todo-explorer', todoProvider);

    // Command: Add Personal Task
    let addTodo = vscode.commands.registerCommand('devflow-suite.addManualTodo', async () => {
        const task = await vscode.window.showInputBox({
            placeHolder: "e.g., Finalize UI Design",
            prompt: "Enter a new personal task"
        });
        if (task) {
            let manual = context.globalState.get('manualTodos', []);
            manual.push({ id: Date.now(), text: task });
            await context.globalState.update('manualTodos', manual);
            todoProvider.refresh();
            vscode.window.showInformationMessage('Task added successfully.');
        }
    });

    // Command: Delete Task (Move to Trash)
    let deleteTodo = vscode.commands.registerCommand('devflow-suite.deleteTask', async (item) => {
        let manual = context.globalState.get('manualTodos', []);
        let trash = context.globalState.get('trashTodos', []);
        
        const taskToDelete = manual.find(t => t.text === item.label);
        if (taskToDelete) {
            trash.push(taskToDelete);
            manual = manual.filter(t => t.id !== taskToDelete.id);
            await context.globalState.update('manualTodos', manual);
            await context.globalState.update('trashTodos', trash);
            todoProvider.refresh();
            vscode.window.showInformationMessage('Task moved to Trash.');
        }
    });

    // Command: Copy to Clipboard
    let copyTask = vscode.commands.registerCommand('devflow-suite.copyTask', async (item) => {
        await vscode.env.clipboard.writeText(item.label);
        vscode.window.showInformationMessage('Copied to clipboard.');
    });

    context.subscriptions.push(addTodo, deleteTodo, copyTask);
}

exports.activate = activate;