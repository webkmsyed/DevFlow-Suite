// File: features/main/exportOps.js
const vscode = require('vscode');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        const tasks = context.globalState.get('manualTasks', []);
        const pri = context.globalState.get('priorityTasks', []);
        
        let md = `# DevFlow-Suite Export\n\n## ⭐ Priority\n`;
        // @ts-ignore
        pri.forEach(p => md += `- [ ] ${p.text}\n`);
        md += `\n## 📋 Tasks\n`;
        // @ts-ignore
        tasks.forEach(t => md += `- [ ] ${t.text} (Folder: ${t.folder})\n`);
        
        const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
        await vscode.window.showTextDocument(doc);
    }));
}
module.exports = { registerExport };