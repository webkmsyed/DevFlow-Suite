// File: features/subTabs/general/generalTabExport.js
const vscode = require('vscode');

function registerGeneralTabExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.tabExport', async (node) => {
        if (!node) return;
        const folderName = node.originalText;

        const manual = context.globalState.get('manualTasks', []) || [];
        const items = manual.filter(t => t.folder === folderName).map(t => `- [ ] ${t.text}`);

        let output = `# Report: ${folderName}\n\n${items.join('\n')}`;
        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'markdown' });
        
        // 🚀 Bug 4 Fix: Open beside current window as a new tab
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: false });
    }));
}
module.exports = { registerGeneralTabExport };