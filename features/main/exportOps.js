// File: features/main/exportOps.js
const vscode = require('vscode');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        const format = await vscode.window.showQuickPick(['Markdown (.md)', 'CSV (.csv)'], { placeHolder: 'Select Export Format' });
        if (!format) return;

        const tasks = context.globalState.get('manualTasks', []);
        let content = "";

        if (format.includes('Markdown')) {
            content = `# DevFlow-Suite Export\n\n` + tasks.map(t => `- [ ] ${t.text} (${t.folder})`).join('\n');
        } else {
            content = `Task,Folder\n` + tasks.map(t => `"${t.text}","${t.folder}"`).join('\n');
        }

        const doc = await vscode.workspace.openTextDocument({ content, language: format.includes('Markdown') ? 'markdown' : 'plaintext' });
        await vscode.window.showTextDocument(doc);
    }));
}
module.exports = { registerExport };