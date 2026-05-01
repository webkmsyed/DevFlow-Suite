// File: features/subTabs/subTaskOps.js
const vscode = require('vscode');

/**
 * General Workspace optimization and sorting controls.
 * Uses existing TreeRenderer logic to maintain performance.
 */
function registerSubTaskCommands(context, todoProvider) {

    // --- 1. TAB SORTING (jargon.subTaskSort) ---
    context.subscriptions.push(vscode.commands.registerCommand('jargon.subTaskSort', async () => {
        const options = [
            { label: 'Default', description: 'Time Added' },
            { label: 'A-Z (Alphabetical)', description: 'Sort tasks by name' },
            { label: 'Z-A (Reverse Alphabetical)', description: 'Reverse sort' },
            { label: 'Folder Size (High to Low)', description: 'Biggest folders first' },
            { label: 'Folder Size (Low to High)', description: 'Smallest folders first' }
        ];

        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select sorting order for Workspace'
        });

        if (choice) {
            // Update global state which treeRenderer already uses
            await context.globalState.update('sortOrder', choice.label);
            
            todoProvider.refresh();
            vscode.window.showInformationMessage(`DevFlow-Suite: Sorted by ${choice.label}`);
        }
    }));
}

module.exports = { registerSubTaskCommands };