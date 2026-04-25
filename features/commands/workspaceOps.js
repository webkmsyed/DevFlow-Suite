// File: features/commands/workspaceOps.js
const vscode = require('vscode');

function registerWorkspaceCommands(context, todoProvider) {
    const register = (cmd, handler) => context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));

    register('jargon.mainExport', async () => {
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
    });

    register('jargon.mainDelete', async () => {
        const res = await vscode.window.showWarningMessage("Wipe workspace memory?", { modal: true }, "Yes, Wipe All");
        if (res === "Yes, Wipe All") {
            await context.globalState.update('manualTasks', []); 
            await context.globalState.update('priorityTasks', []); 
            await context.globalState.update('trashData', []); 
            await context.globalState.update('itemTags', {});
            todoProvider.refresh();
        }
    });

    // Pending buttons ke placeholders yahan daal diye
    const dummy = ['jargon.mainFilter', 'jargon.mainSearch', 'jargon.mainSort', 'jargon.tabExport', 'jargon.tabFilter', 'jargon.tabSort', 'jargon.priExport', 'jargon.priAddAll', 'jargon.recExport', 'jargon.recSearch', 'jargon.taskAddTo'];
    dummy.forEach(cmd => register(cmd, () => {}));
}

module.exports = { registerWorkspaceCommands };