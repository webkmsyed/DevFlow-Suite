// File: features/subTabs/subFolderOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');
const { recordHistory } = require('../commands/historyOps');

/**
 * Custom Folders ke liye Advanced Controls.
 * Includes: Rename, Deep Delete, and Folder-Specific Export.
 */
function registerSubFolderCommands(context, todoProvider, scanWorkspaceForComments) {

    // --- 1. RENAME FOLDER (jargon.subFolderRename) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subFolderRename', async (node) => {
        if (!node || !node.isUser) {
            vscode.window.showWarningMessage("Only user-created folders can be renamed.");
            return;
        }

        const oldName = node.originalText;
        const newName = await vscode.window.showInputBox({
            prompt: `Rename folder '${oldName}' to:`,
            value: oldName
        });

        if (newName && newName !== oldName) {
            recordHistory(context); // Undo support

            // 1. Update Folders List
            let folders = context.globalState.get('userFolders', []);
            const idx = folders.indexOf(oldName);
            if (idx !== -1) folders[idx] = newName;
            await context.globalState.update('userFolders', folders);

            // 2. Update Manual Tasks Reference
            let manualTasks = context.globalState.get('manualTasks', []);
            manualTasks.forEach(t => { if (t.folder === oldName) t.folder = newName; });
            await context.globalState.update('manualTasks', manualTasks);

            // 3. Update Scanned Comments Target
            let fileComments = context.globalState.get('fileComments', []);
            fileComments.forEach(c => { if (c.target === oldName) c.target = newName; });
            await context.globalState.update('fileComments', fileComments);

            logEvent(context, 'Update', `Renamed folder '${oldName}' to '${newName}'`);
            todoProvider.refresh();
            vscode.window.showInformationMessage(`Folder successfully renamed to ${newName}`);
        }
    }));

    // --- 2. FOLDER EXPORT (jargon.subFolderExport) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subFolderExport', async (node) => {
        if (!node) return;
        const folderName = node.originalText;

        const manualTasks = context.globalState.get('manualTasks', []);
        const fileComments = context.globalState.get('fileComments', []);

        // Filter items for this specific folder
        const folderManual = manualTasks.filter(t => t.folder === folderName);
        const folderScanned = fileComments.filter(c => c.target === folderName);

        if (folderManual.length === 0 && folderScanned.length === 0) {
            vscode.window.showInformationMessage(`Folder '${folderName}' is empty.`);
            return;
        }

        // Luxury Markdown Template
        let output = `# 📂 DevFlow-Suite: ${folderName.toUpperCase()} Report\n`;
        output += `*Scope: Specific Folder Export | Date: ${new Date().toLocaleDateString()}*\n\n---\n\n`;

        if (folderManual.length > 0) {
            output += `### 📝 Manual Tasks\n`;
            folderManual.forEach((t, i) => output += `${i + 1}. [ ] **${t.text}**\n`);
            output += `\n`;
        }

        if (folderScanned.length > 0) {
            output += `### 🔍 Scanned Code Comments\n`;
            folderScanned.forEach((c, i) => output += `${i + 1}. [ ] **${c.text}** \n   - *File:* \`${c.file}\` (Line ${c.line})\n`);
        }

        const doc = await vscode.workspace.openTextDocument({ content: output, language: 'markdown' });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        
        logEvent(context, 'Export', `Exported documentation for folder '${folderName}'`);
    }));
}

module.exports = { registerSubFolderCommands };