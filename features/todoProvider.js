const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context; // Persistence ke liye context chahiye
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    async getChildren() {
        const scannedTodos = await this.scanForTodos();
        const manualTodos = this.context.globalState.get('manualTodos', []);
        
        // Dono ko merge karke display karo
        const allTodos = [...scannedTodos, ...manualTodos];

        return allTodos.map(todo => {
            const item = new vscode.TreeItem(todo.text, vscode.TreeItemCollapsibleState.None);
            item.description = `${todo.filePath}:${todo.line + 1}`; // Har todo ke saath file/line dikhega
            item.iconPath = todo.filePath === 'Global' ? new vscode.ThemeIcon('star-full') : new vscode.ThemeIcon('check');
            
            if(todo.filePath !== 'Global') {
                item.command = {
                    command: 'vscode.open',
                    arguments: [vscode.Uri.file(path.join(this.workspaceRoot, todo.filePath)), {
                        selection: new vscode.Range(todo.line, 0, todo.line, 0)
                    }],
                    title: 'Open'
                };
            }
            return item;
        });
    }

    async scanForTodos() {
        const todoList = [];
        if (!this.workspaceRoot) return [];
        const files = await vscode.workspace.findFiles('**/*.{js,ts,py,html,css}', '**/node_modules/**');
        for (const file of files) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            content.split('\n').forEach((line, index) => {
                if (/\/\/\s*TODO:/.test(line)) {
                    todoList.push({
                        text: line.replace(/\/\/\s*TODO:/, '').trim(),
                        filePath: vscode.workspace.asRelativePath(file),
                        line: index
                    });
                }
            });
        }
        return todoList;
    }
}
module.exports = TodoProvider;