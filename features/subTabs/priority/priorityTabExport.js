// File: features/subTabs/priority/priorityTabExport.js
const vscode = require('vscode');

function registerPriorityTabExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.priExport', async () => {
        const pri = context.globalState.get('priorityTasks', []) || [];
        if (pri.length === 0) return vscode.window.showInformationMessage("Priority list is empty.");

        let md = `# 💎 DevFlow Priority Workspace\n\n`;
        pri.forEach((t, i) => {
            const loc = t.isScanned ? ` (File: ${t.file}, Line: ${t.line})` : ` (Manual)`;
            md += `${i + 1}. [ ] **${t.text}**${loc}\n`;
        });

        const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }));
}
module.exports = { registerPriorityTabExport };