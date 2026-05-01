// File: features/subTabs/subTrashOps.js
const vscode = require('vscode');
const { logEvent } = require('../engine/logger');

/**
 * Trash/Recycle Bin ki advanced operations.
 * Minimalist logic for high-performance cleaning.
 */
function registerSubTrashCommands(context, todoProvider) {

    // --- 1. SMART RESTORE (jargon.recRestore) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recRestore', async (item) => {
        if (!item) return;

        let trashTasks = context.globalState.get('trashTasks', []);
        let generalTasks = context.globalState.get('generalTasks', []);
        let folders = context.globalState.get('customFolders', []);

        // Task ko trash se dhoondhein
        const taskIndex = trashTasks.findIndex(t => t.id === item.id);
        if (taskIndex === -1) return;

        const taskToRestore = trashTasks[taskIndex];
        trashTasks.splice(taskIndex, 1); // Trash se nikalo

        // Smart Logic: Original folder check karein
        // Agar folder delete ho chuka hai, toh 'General' mein bhejein
        let restored = false;
        if (taskToRestore.originFolderId) {
            const targetFolder = folders.find(f => f.id === taskToRestore.originFolderId);
            if (targetFolder) {
                targetFolder.tasks.push(taskToRestore);
                restored = true;
            }
        }

        if (!restored) {
            generalTasks.push(taskToRestore);
        }

        // State Update
        await context.globalState.update('trashTasks', trashTasks);
        await context.globalState.update('generalTasks', generalTasks);
        await context.globalState.update('customFolders', folders);

        logEvent(context, 'Recycle Bin', `Restored: ${taskToRestore.text}`);
        todoProvider.refresh();
        vscode.window.showInformationMessage(`Task restored to ${restored ? 'original folder' : 'General'}.`);
    }));

    // --- 2. SEARCH TRASH (jargon.recSearch) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recSearch', async () => {
        const trashTasks = context.globalState.get('trashTasks', []);
        if (trashTasks.length === 0) {
            vscode.window.showInformationMessage("Recycle bin is already empty.");
            return;
        }

        const searchTerm = await vscode.window.showInputBox({
            placeHolder: "Search in trash...",
            prompt: "Enter keywords to find deleted tasks"
        });

        if (!searchTerm) return;

        const results = trashTasks.filter(t => t.text.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (results.length > 0) {
            const picked = await vscode.window.showQuickPick(
                results.map(r => ({ label: r.text, description: "Click to Restore", task: r })),
                { title: `Found ${results.length} items` }
            );
            
            if (picked) {
                vscode.commands.executeCommand('jargon.recRestore', picked.task);
            }
        } else {
            vscode.window.showInformationMessage("No matching items found in trash.");
        }
    }));

    // --- 3. PERMANENT WIPE (jargon.recEmpty) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.recEmpty', async () => {
        const confirm = await vscode.window.showWarningMessage(
            "Are you sure? This will permanently delete all items in the Recycle Bin.",
            { modal: true }, "Empty Bin"
        );

        if (confirm === "Empty Bin") {
            await context.globalState.update('trashTasks', []);
            logEvent(context, 'Recycle Bin', "Wiped all items permanently.");
            todoProvider.refresh();
            vscode.window.showInformationMessage("Recycle Bin cleared.");
        }
    }));
}

module.exports = { registerSubTrashCommands };