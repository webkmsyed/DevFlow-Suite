// File: features/subTabs/priority/priorityTabExport.js
const vscode = require('vscode');

function registerPriorityTabExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priExport', async () => {
        const priTasks = context.globalState.get('priorityTasks', []) || [];
        if (priTasks.length === 0) {
            vscode.window.showInformationMessage("DevFlow: Priority Tab is empty.");
            return;
        }

        // --- Logic: Grouping tasks by Folder ---
        let groups = {};
        let standalone = [];

        priTasks.forEach(t => {
            const folderName = t.folder || t.target; // 'folder' for manual, 'target' for scanned
            if (folderName) {
                if (!groups[folderName]) groups[folderName] = [];
                groups[folderName].push(t);
            } else {
                standalone.push(t);
            }
        });

        // --- Building Markdown Content ---
        let output = "# 🌟 DevFlow Priority Report\n\n";

        // 1. Grouped Folders
        Object.keys(groups).forEach(topic => {
            output += `## 📂 Folder: ${topic}\n`;
            groups[topic].forEach(t => {
                output += `- [ ] ${t.text}\n`;
            });
            output += "\n";
        });

        // 2. Individual Tasks (Standalone)
        if (standalone.length > 0) {
            output += `## 📝 Individual Tasks\n`;
            standalone.forEach(t => {
                output += `- [ ] ${t.text}\n`;
            });
        }

        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'markdown' });
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    }));
}

module.exports = { registerPriorityTabExport };