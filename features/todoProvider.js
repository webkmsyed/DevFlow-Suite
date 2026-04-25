const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class TodoProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    async getChildren(element) {
        if (!element) {
            return [
                new CategoryItem("Project Tasks", "folder", vscode.TreeItemCollapsibleState.Expanded),
                new CategoryItem("Personal Tasks", "pin", vscode.TreeItemCollapsibleState.Expanded)
            ];
        }

        if (element.label === "Project Tasks") {
            return await this.scanForTodos();
        }

        if (element.label === "Personal Tasks") {
            const manual = this.context.globalState.get('manualTodos', []);
            return manual.map(task => {
                const item = new vscode.TreeItem(task.text, vscode.TreeItemCollapsibleState.None);
                item.iconPath = new vscode.ThemeIcon('star-full');
                item.description = "Global";
                return item;
            });
        }
        return [];
    }

    async scanForTodos() {
        const todoList = [];
        if (!this.workspaceRoot) return [];
        
        const files = await vscode.workspace.findFiles('**/*.{js,ts,py,html,css}', '**/node_modules/**');
        for (const file of files) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            content.split('\n').forEach((line, index) => {
                if (/\/\/\s*TODO:/.test(line)) {
                    const item = new vscode.TreeItem(line.replace(/\/\/\s*TODO:/, '').trim());
                    item.description = path.basename(file.fsPath);
                    item.iconPath = new vscode.ThemeIcon('check');
                    item.command = {
                        command: 'vscode.open',
                        arguments: [file, { selection: new vscode.Range(index, 0, index, 0) }],
                        title: 'Open File'
                    };
                    todoList.push(item);
                }
            });
        }
        return todoList;
    }
}

class CategoryItem extends vscode.TreeItem {
    constructor(label, icon, collapsibleState) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}

module.exports = TodoProvider;