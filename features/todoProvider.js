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
                new CategoryItem("Personal Tasks", "pin", vscode.TreeItemCollapsibleState.Expanded),
                new CategoryItem("Code Comments", "code", vscode.TreeItemCollapsibleState.Collapsed),
                new CategoryItem("Trash", "trash", vscode.TreeItemCollapsibleState.Collapsed)
            ];
        }

        if (element.label === "Personal Tasks") {
            const manual = this.context.globalState.get('manualTodos', []);
            return manual.map(t => {
                const item = new vscode.TreeItem(t.text, vscode.TreeItemCollapsibleState.None);
                item.contextValue = 'manualTodo';
                item.iconPath = new vscode.ThemeIcon('circle-outline');
                return item;
            });
        }

        if (element.label === "Trash") {
            const trash = this.context.globalState.get('trashTodos', []);
            return trash.map(t => new vscode.TreeItem(t.text, vscode.TreeItemCollapsibleState.None));
        }

        if (element.label === "Code Comments") {
            return await this.scanFoldersForComments();
        }

        return [];
    }

    async scanFoldersForComments() {
        if (!this.workspaceRoot) return [];
        const items = [];
        const files = await vscode.workspace.findFiles('**/*.{js,ts,css}', '**/node_modules/**');

        for (const file of files) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                // Matches // TODO: or just general // comments
                if (/\/\//.test(line)) {
                    const cleanText = line.split('//')[1].trim();
                    if (cleanText) {
                        const item = new vscode.TreeItem(cleanText);
                        item.description = path.basename(file.fsPath);
                        item.command = {
                            command: 'vscode.open',
                            arguments: [file, { selection: new vscode.Range(index, 0, index, 0) }],
                            title: 'Open'
                        };
                        items.push(item);
                    }
                }
            });
        }
        return items;
    }
}

class CategoryItem extends vscode.TreeItem {
    constructor(label, icon, collapsibleState) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}

module.exports = TodoProvider;