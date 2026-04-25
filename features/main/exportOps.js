// File: features/main/exportOps.js
const vscode = require('vscode');

function registerExport(context) {
    context.subscriptions.push(vscode.commands.registerCommand('jargon.mainExport', async () => {
        const format = await vscode.window.showQuickPick(['Markdown (.md)', 'CSV (.csv)'], { placeHolder: 'Select Export Format' });
        if (!format) return;

        // Saare data sources fetch kiye
        const manualTasks = context.globalState.get('manualTasks', []);
        const fileComments = context.globalState.get('fileComments', []);
        const priorityTasks = context.globalState.get('priorityTasks', []);
        const globalTags = context.globalState.get('itemTags', {});

        // Tag Formatting Helper
        const getTag = (txt) => {
            const t = globalTags[txt];
            if(!t) return "";
            return (t.toLowerCase().includes("bug") && !t.includes("🔴")) ? `[🔴 ${t}]` : `[${t}]`;
        };

        let content = "";

        if (format.includes('Markdown')) {
            content = `# DevFlow-Suite Export\n\n`;
            
            content += `## ⭐ Priority Items\n`;
            if(priorityTasks.length === 0) content += `*No priority items*\n`;
            priorityTasks.forEach(p => content += `- [ ] ${getTag(p.text)} **${p.text}**\n`);

            content += `\n## 📋 Manual Tasks\n`;
            if(manualTasks.length === 0) content += `*No manual tasks*\n`;
            manualTasks.forEach(t => content += `- [ ] ${getTag(t.text)} **${t.text}** *(Folder: ${t.folder})*\n`);

            content += `\n## 🔍 Auto-Scanned Comments\n`;
            if(fileComments.length === 0) content += `*No scanned comments*\n`;
            fileComments.forEach(c => content += `- [ ] ${getTag(c.text)} **${c.text}** *(File: ${c.file} - Line: ${c.line})*\n`);
            
        } else {
            // Excel-ready Bulletproof CSV
            content = `Type,Task,Tag,Folder/Location\n`;
            const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

            priorityTasks.forEach(p => {
                content += `Priority,${escapeCSV(p.text)},${escapeCSV(getTag(p.text))},General Workspace\n`;
            });
            manualTasks.forEach(t => {
                content += `Manual Task,${escapeCSV(t.text)},${escapeCSV(getTag(t.text))},${escapeCSV(t.folder)}\n`;
            });
            fileComments.forEach(c => {
                content += `Scanned Comment,${escapeCSV(c.text)},${escapeCSV(getTag(c.text))},${escapeCSV(c.file + " (Line " + c.line + ")")}\n`;
            });
        }

        // Generate File
        const doc = await vscode.workspace.openTextDocument({ content, language: format.includes('Markdown') ? 'markdown' : 'plaintext' });
        await vscode.window.showTextDocument(doc);
    }));
}
module.exports = { registerExport };