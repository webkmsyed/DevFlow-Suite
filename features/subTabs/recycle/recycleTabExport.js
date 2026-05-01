// File: features/subTabs/recycle/recycleTabExport.js
const vscode = require('vscode');

function registerRecycleTabExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recExport', async () => {
        const trash = context.globalState.get('trashData', []) || [];
        if (trash.length === 0) return vscode.window.showInformationMessage("Recycle Bin is empty.");

        let md = `# 🗑️ DevFlow Recycle Bin Report\n\n`;
        trash.forEach((t, i) => {
            md += `${i + 1}. [ ] **${t.text}** (Deleted From: ${t.deletedFrom})\n`;
        });

        const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }));
}
module.exports = { registerRecycleTabExport };