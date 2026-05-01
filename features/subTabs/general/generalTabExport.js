// File: features/subTabs/general/generalTabExport.js
const vscode = require('vscode');

function registerGeneralTabExport(context) {
    // 📤 Command: Export Tab (jargon.tabExport)
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabExport', async (node) => {
        if (!node) return;
        const folderName = node.originalText;

        const manualTasks = context.globalState.get('manualTasks', []) || [];
        const fileComments = context.globalState.get('fileComments', []) || [];

        const items = [
            ...manualTasks.filter(t => t.folder === folderName).map(t => `- [ ] ${t.text} (Manual)`),
            ...fileComments.filter(c => c.target === folderName).map(c => `- [ ] ${c.text} (Scanned: ${c.file})`)
        ];

        if (items.length === 0) {
            vscode.window.showInformationMessage(`Tab '${folderName}' is empty.`);
            return;
        }

        let output = `# 📂 DevFlow Tab Report: ${folderName}\n\n${items.join('\n')}`;
        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'markdown' });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }));
}

module.exports = { registerGeneralTabExport };