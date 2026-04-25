const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class TodoProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!this.workspaceRoot) {
            return [];
        }

        // Agar hum root par hain, toh files scan karo
        const todos = await this.scanForTodos();
        return todos.map(todo => {
            const treeItem = new vscode.TreeItem(todo.text, vscode.TreeItemCollapsibleState.None);
            treeItem.description = todo.fileName;
            treeItem.tooltip = `File: ${todo.fileName} | Line: ${todo.line}`;
            treeItem.iconPath = new vscode.ThemeIcon('check'); // Simple check icon
            
            // Is par click karne se file khulni chahiye
            treeItem.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [vscode.Uri.file(path.join(this.workspaceRoot, todo.filePath)), {
                    selection: new vscode.Range(todo.line, 0, todo.line, 0)
                }]
            };
            return treeItem;
        });
    }

    async scanForTodos() {
        const todoList = [];
        // Professional Way: Sirf coding files scan karo (Exclude node_modules)
        const files = await vscode.workspace.findFiles('**/*.{js,ts,py,html,css}', '**/node_modules/**');

        for (const file of files) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                if (line.includes('// TODO:')) {
                    todoList.push({
                        text: line.replace('// TODO:', '').trim(),
                        fileName: path.basename(file.fsPath),
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